#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Frontend DevOps entrypoint.
#
#   ./deploy.sh up        clone/pull the repo, build the bundle, start nginx
#   ./deploy.sh down      stop and remove the container
#   ./deploy.sh restart   restart the container
#   ./deploy.sh logs      follow nginx logs
#   ./deploy.sh status    show container state and the public URL
#   ./deploy.sh pull      rebuild the image (required after changing VITE_*)
#   ./deploy.sh shell     open a shell inside the frontend container
#
# VITE_* values are compiled into the JavaScript bundle, so they only take
# effect after a rebuild. ./deploy.sh up always rebuilds, ./deploy.sh pull is
# the explicit "I changed my .env" command.
# ---------------------------------------------------------------------------

set -euo pipefail

STACK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/common.sh
. "$STACK_DIR/../lib/common.sh"

COMMAND="${1:-up}"
SERVICE="${2:-}"
shift || true
EXTRA_ARGS=("$@")

load_env "$DEVOPS_ROOT/.env" "$STACK_DIR/.env"
APP_DIR="${APP_DIR:-/opt/store}"
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-main}"

public_url() {
    if [ -n "${DOMAIN:-}" ]; then
        printf 'http://%s' "$DOMAIN"
        [ "${FRONTEND_PORT:-80}" = "80" ] || printf ':%s' "${FRONTEND_PORT:-80}"
    else
        local ip
        ip="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
        printf 'http://%s:%s' "${ip:-SERVER_IP}" "${FRONTEND_PORT:-80}"
    fi
}

print_status() {
    head_ "Frontend stack status"
    compose "$STACK_DIR" ps
    head_ "Reachable endpoints"
    printf '  Frontend ....... %s\n' "$(public_url)"
    printf '  Frontend health  %s/healthz\n' "$(public_url)"
    printf '  API it calls .... %s\n' "${VITE_API_URL:-<unset>}"
    if [ -z "${VITE_API_URL:-}" ] || [ "${VITE_API_URL}" = "http://localhost:5000" ]; then
        warn "VITE_API_URL still points at localhost - browser calls will fail."
        warn "Set it to the public backend URL, then run: ./deploy.sh pull"
    fi
}

case "$COMMAND" in
    up)
        require_docker
        ensure_env_file "$STACK_DIR" "$STACK_DIR/.env.example"
        load_env "$STACK_DIR/.env"
        APP_DIR="${APP_DIR:-/opt/store}"
        head_ "1/4 syncing repository"
        sync_repo "$APP_DIR" "$REPO_URL" "$REPO_BRANCH"
        head_ "2/4 preparing docker network"
        ensure_network "${STORE_NETWORK:-store-net}"
        head_ "3/4 building the bundle and starting nginx"
        compose "$STACK_DIR" up -d --build --remove-orphans
        head_ "4/4 waiting for health"
        wait_healthy "${FRONTEND_CONTAINER:-rayesmodes-frontend}" 180 || true
        compose "$STACK_DIR" ps
        print_status
        ;;

    down)
        require_docker
        load_env "$STACK_DIR/.env"
        compose "$STACK_DIR" down "${EXTRA_ARGS[@]}"
        ;;

    restart)
        require_docker
        load_env "$STACK_DIR/.env"
        compose "$STACK_DIR" restart "${EXTRA_ARGS[@]}"
        ;;

    logs)
        require_docker
        load_env "$STACK_DIR/.env"
        if [ -n "$SERVICE" ]; then
            compose "$STACK_DIR" logs -f --tail=200 "$SERVICE"
        else
            compose "$STACK_DIR" logs -f --tail=100
        fi
        ;;

    status)
        require_docker
        load_env "$STACK_DIR/.env"
        print_status
        ;;

    pull)
        require_docker
        ensure_env_file "$STACK_DIR" "$STACK_DIR/.env.example"
        load_env "$STACK_DIR/.env"
        sync_repo "$APP_DIR" "$REPO_URL" "$REPO_BRANCH"
        ensure_network "${STORE_NETWORK:-store-net}"
        log "rebuilding the frontend image (VITE_* are baked in at build time)"
        compose "$STACK_DIR" build --pull frontend
        compose "$STACK_DIR" up -d --force-recreate --remove-orphans
        wait_healthy "${FRONTEND_CONTAINER:-rayesmodes-frontend}" 180 || true
        print_status
        ;;

    shell)
        require_docker
        compose "$STACK_DIR" exec frontend sh
        ;;

    *)
        printf 'usage: %s {up|down|restart|logs [service]|status|pull|shell}\n' "$0" >&2
        exit 2
        ;;
esac
