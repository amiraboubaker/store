#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Backend DevOps entrypoint.
#
#   ./deploy.sh up        clone/pull the repo, build the image, start the stack
#   ./deploy.sh down      stop and remove the containers
#   ./deploy.sh restart   restart the containers
#   ./deploy.sh logs      follow logs (optionally: ./deploy.sh logs backend)
#   ./deploy.sh status    show container state and the public URLs
#   ./deploy.sh pull      rebuild the backend image and recreate the backend
#   ./deploy.sh shell     open a shell inside the backend container
#
# Everything it needs is read from ./.env (created from ./.env.example on the
# first run) and from the shared ../.env (REPO_URL / REPO_BRANCH / APP_DIR).
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
    local host="$1" port="$2" scheme="$3"
    if [ -n "${DOMAIN:-}" ]; then
        printf '%s://%s' "$scheme" "$DOMAIN"
        [ "$port" = "80" ] || printf ':%s' "$port"
    else
        local ip
        ip="$(curl -fsS --max-time 3 https://api.ipify.org 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')"
        printf '%s://%s:%s' "$scheme" "${ip:-SERVER_IP}" "$port"
    fi
}

print_status() {
    local backend_url phpmyadmin_url
    backend_url="$(public_url "${BACKEND_BIND_ADDRESS:-0.0.0.0}" "${BACKEND_PORT:-5000}" http)"
    phpmyadmin_url="$(public_url "${PHPADMIN_BIND_ADDRESS:-0.0.0.0}" "${PHPADMIN_PORT:-8081}" http)"
    head_ "Backend stack status"
    compose "$STACK_DIR" ps
    head_ "Reachable endpoints"
    printf '  API base ....... %s\n' "$backend_url"
    printf '  API health ..... %s/health\n' "$backend_url"
    printf '  API info ....... %s/api\n' "$backend_url"
    printf '  Admin API ....... %s/admin\n' "$backend_url"
    printf '  MySQL ......... %s:%s (loopback only)\n' "${DB_BIND_ADDRESS:-127.0.0.1}" "${DB_PUBLIC_PORT:-3306}"
    printf '  phpMyAdmin ..... %s\n' "$phpmyadmin_url"
    if [ -z "${CORS_ORIGIN:-}" ]; then
        warn "CORS_ORIGIN is empty - the frontend browser will be blocked."
    elif printf '%s' "$CORS_ORIGIN" | grep -qE '(^|,)https?://(localhost|127\.0\.0\.1)'; then
        warn "CORS_ORIGIN still lists localhost: $CORS_ORIGIN"
        warn "Replace it with this server's real frontend origin or the browser will refuse API calls."
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
        head_ "3/4 building and starting the backend stack"
        compose "$STACK_DIR" up -d --build --remove-orphans
        head_ "4/4 waiting for health"
        wait_healthy "${BACKEND_CONTAINER:-rayesmodes-backend}" 180 || true
        compose "$STACK_DIR" ps
        print_status
        ;;

    down)
        require_docker
        load_env "$STACK_DIR/.env"
        warn "removing containers (the db-data volume is kept unless --volumes)"
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
        log "rebuilding the backend image"
        compose "$STACK_DIR" build backend
        compose "$STACK_DIR" up -d --force-recreate --remove-orphans
        wait_healthy "${BACKEND_CONTAINER:-rayesmodes-backend}" 180 || true
        print_status
        ;;

    shell)
        require_docker
        compose "$STACK_DIR" exec backend sh
        ;;

    *)
        printf 'usage: %s {up|down|restart|logs [service]|status|pull|shell}\n' "$0" >&2
        exit 2
        ;;
esac
