#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Shared helpers for the store DevOps stacks.
# Sourced by ../deploy.sh and by ../backend/deploy.sh and ../frontend/deploy.sh.
# Do not execute this file directly.
# ---------------------------------------------------------------------------

set -euo pipefail

DEVOPS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- output ------------------------------------------------------------------
if [ -t 1 ]; then
    _C_RESET=$'\033[0m'; _C_INFO=$'\033[36m'; _C_OK=$'\033[32m'
    _C_WARN=$'\033[33m';   _C_ERR=$'\033[31m';  _C_HEAD=$'\033[1;35m'
else
    _C_RESET=''; _C_INFO=''; _C_OK=''; _C_WARN=''; _C_ERR=''; _C_HEAD=''
fi

log()   { printf '%s==>%s %s\n' "$_C_INFO"  "$_C_RESET" "$*"; }
ok()    { printf '%s[ok]%s %s\n' "$_C_OK"    "$_C_RESET" "$*"; }
warn()  { printf '%s[warn]%s %s\n' "$_C_WARN"  "$_C_RESET" "$*" >&2; }
die()   { printf '%s[error]%s %s\n' "$_C_ERR"  "$_C_RESET" "$*" >&2; exit 1; }
head_() { printf '\n%s### %s%s\n' "$_C_HEAD" "$*" "$_C_RESET"; }

# --- preflight ---------------------------------------------------------------
require_docker() {
    command -v docker >/dev/null 2>&1 || die "docker is not installed on this host."
    docker compose version >/dev/null 2>&1 \
        || die "docker compose v2+ is required ('docker compose version' failed)."
    docker info >/dev/null 2>&1 \
        || die "cannot talk to the Docker daemon. Try: sudo systemctl start docker"
}

# --- secrets -----------------------------------------------------------------
gen_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n'
    fi
}

# generate a URL-safe password (no quotes, no $, safe inside compose .env)
gen_password() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-28
    else
        head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n' | cut -c1-28
    fi
}

# Replace every `GENERATE` placeholder in a .env file with a fresh secret.
# Keys ending in _PASSWORD get an alphanumeric password, everything else hex.
fill_generated_secrets() {
    local env_file="$1" key value tmp
    tmp="$(mktemp)"
    while IFS= read -r line || [ -n "$line" ]; do
        case "$line" in
            GENERATE*|*"=GENERATE")
                key="${line%%=*}"
                case "$key" in
                    *PASSWORD*) value="$(gen_password)" ;;
                    *)          value="$(gen_secret)" ;;
                esac
                printf '%s=%s\n' "$key" "$value" >>"$tmp"
                ;;
            *) printf '%s\n' "$line" >>"$tmp" ;;
        esac
    done <"$env_file"
    mv "$tmp" "$env_file"
    chmod 600 "$env_file"
}

# --- env files ---------------------------------------------------------------
# load_env <file...>   later files win over earlier ones (last = highest priority)
load_env() {
    local f
    for f in "$@"; do
        [ -f "$f" ] || continue
        set -a
        # shellcheck disable=SC1090
        . "$f"
        set +a
    done
}

# ensure_env_file <dir> <example> : create <dir>/.env from <example> when missing
ensure_env_file() {
    # NOTE: bash expands every word of a `local` statement before running the
    # builtin, so each assignment needs its own statement.
    local dir="$1"
    local example="$2"
    local target="$dir/.env"
    if [ -f "$target" ]; then
        return 0
    fi
    [ -f "$example" ] || die "missing template $example"
    cp "$example" "$target"
    chmod 600 "$target"
    if grep -q '=GENERATE' "$target"; then
        fill_generated_secrets "$target"
        log "generated fresh secrets in $target"
    fi
    warn "created $target from the example - review it before going live."
}

# --- repository sync ---------------------------------------------------------
# sync_repo <app_dir> <repo_url> <branch>
# Clones the repository on first run, otherwise fast-forwards the tracked branch.
# Local (untracked) DevOps env files are preserved across the reset.
sync_repo() {
    local app_dir="$1" repo_url="$2" branch="$3"
    local preserved="" f backup
    if [ -z "$repo_url" ]; then
        die "REPO_URL is empty. Set it in $DEVOPS_ROOT/.env (see .env.example)."
    fi

    for f in devops-scripts/.env \
             devops-scripts/backend/.env \
             devops-scripts/frontend/.env; do
        if [ -f "$app_dir/$f" ]; then
            preserved="$preserved $f"
        fi
    done

    if [ -d "$app_dir/.git" ]; then
        log "updating existing checkout in $app_dir"
        backup="$(mktemp -d)"
        for f in $preserved; do
            mkdir -p "$backup/$(dirname "$f")"
            cp "$app_dir/$f" "$backup/$f"
        done
        git -C "$app_dir" fetch --prune origin
        git -C "$app_dir" checkout -q "$branch"
        git -C "$app_dir" reset --hard "origin/$branch" >/dev/null
        git -C "$app_dir" clean -fdq
        for f in $preserved; do
            mkdir -p "$app_dir/$(dirname "$f")"
            cp "$backup/$f" "$app_dir/$f"
            chmod 600 "$app_dir/$f"
        done
        rm -rf "$backup"
    else
        log "cloning $repo_url -> $app_dir"
        if ! git ls-remote --exit-code --heads "$repo_url" "$branch" >/dev/null 2>&1; then
            die "branch '$branch' does not exist on $repo_url.
     Check REPO_BRANCH in $DEVOPS_ROOT/.env against the branches on the remote:
       git ls-remote --heads $repo_url"
        fi
        mkdir -p "$(dirname "$app_dir")"
        git clone --branch "$branch" --depth 1 "$repo_url" "$app_dir"
    fi
    ok "repository in sync ($(git -C "$app_dir" rev-parse --short HEAD))"
}

# --- docker helpers ----------------------------------------------------------
ensure_network() {
    local name="$1"
    if docker network inspect "$name" >/dev/null 2>&1; then
        return 0
    fi
    log "creating docker network '$name'"
    docker network create "$name" >/dev/null
}

# compose <stack_dir> <args...>
compose() {
    local stack_dir="$1"; shift
    ( cd "$stack_dir" && docker compose --env-file .env --project-directory . "$@" )
}

# wait_healthy <container> [timeout_seconds]
wait_healthy() {
    local name="$1" timeout="${2:-120}" i=0 status=""
    log "waiting for '$name' to become healthy (max ${timeout}s)"
    while [ "$i" -lt "$timeout" ]; do
        status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$name" 2>/dev/null || echo missing)"
        case "$status" in
            healthy|running) ok "'$name' is $status"; return 0 ;;
            exited|dead)
                warn "'$name' exited. Last log lines:"
                docker logs --tail 30 "$name" 2>&1 | sed 's/^/    /' >&2
                return 1 ;;
        esac
        i=$((i + 5)); sleep 5
        printf '.'
    done
    echo
    warn "'$name' did not become healthy within ${timeout}s"
    docker logs --tail 30 "$name" 2>&1 | sed 's/^/    /' >&2
    return 1
}
