#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Brings up BOTH stacks in the right order: database + API first, then the
# frontend, because VITE_API_URL in the frontend .env must point at a backend
# that is already reachable. After both stacks are healthy, the nginx reverse
# proxy on the host is configured and Let's Encrypt certificates are requested.
#
#   ./deploy.sh up        clone/pull once, start backend -> frontend -> nginx proxy
#   ./deploy.sh down      stop both stacks (nginx stays up)
#   ./deploy.sh restart   restart both stacks
#   ./deploy.sh status    show both stacks + proxy URLs
#   ./deploy.sh logs      follow logs of both stacks
#   ./deploy.sh pull      rebuild and redeploy both stacks from latest main
#   ./deploy.sh proxy     (re)configure nginx reverse proxy + certbot
#   ./deploy.sh init      just create the .env files and the network
# ---------------------------------------------------------------------------

set -euo pipefail

DEVOPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
. "$DEVOPS_DIR/lib/common.sh"

COMMAND="${1:-up}"
shift || true
EXTRA_ARGS=("$@")

BACKEND="$DEVOPS_DIR/backend/deploy.sh"
FRONTEND="$DEVOPS_DIR/frontend/deploy.sh"
PROXY="$DEVOPS_DIR/nginx/setup-nginx.sh"

require_docker
ensure_executable "$DEVOPS_DIR/.."
ensure_env_file "$DEVOPS_DIR" "$DEVOPS_DIR/.env.example"
ensure_env_file "$DEVOPS_DIR/backend" "$DEVOPS_DIR/backend/.env.example"
ensure_env_file "$DEVOPS_DIR/frontend" "$DEVOPS_DIR/frontend/.env.example"
load_env "$DEVOPS_DIR/.env"
ensure_network "${STORE_NETWORK:-store-net}"

run_both() {
    bash "$BACKEND"  "$1" ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}
    bash "$FRONTEND" "$1" ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}
}

setup_proxy() {
    if [ -z "${FRONTEND_DOMAIN:-}" ] || [ -z "${API_DOMAIN:-}" ] || [ -z "${DB_DOMAIN:-}" ]; then
        warn "FRONTEND_DOMAIN / API_DOMAIN / DB_DOMAIN not set in .env - skipping nginx proxy setup."
        warn "Run: ./deploy.sh proxy  after setting the domains, or set them in .env and run ./deploy.sh up again."
        return 0
    fi
    if [ "$(id -u)" -ne 0 ]; then
        warn "cannot configure nginx proxy without root privileges. Re-run with sudo."
        warn "The containers are running; only the TLS/proxy step needs root."
        return 0
    fi
    # Pull port values from the per-stack .env files so the nginx proxy knows
    # which loopback port each container listens on.
    load_env "$DEVOPS_DIR/backend/.env" "$DEVOPS_DIR/frontend/.env"
    FRONTEND_PORT="${FRONTEND_PORT:-3000}"
    BACKEND_PORT="${BACKEND_PORT:-5000}"
    PHPADMIN_PORT="${PHPADMIN_PORT:-8081}"
    export FRONTEND_PORT BACKEND_PORT PHPADMIN_PORT
    bash "$PROXY"
}

case "$COMMAND" in
    up)
        run_both up
        head_ "configuring nginx reverse proxy + certbot"
        setup_proxy
        ;;
    down)
        run_both down
        warn "nginx proxy and certbot are left running. Stop them with:"
        warn "  sudo systemctl stop nginx"
        warn "  sudo crontab -l | grep -v 'certbot renew' | sudo crontab -"
        ;;
    restart)      run_both restart ;;
    logs)
        # both stacks are interactive, so follow them side by side
        bash "$BACKEND"  logs ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} &
        bash "$FRONTEND" logs ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} &
        wait
        ;;
    status)       run_both status ;;
    pull)         run_both pull ;;
    proxy)
        head_ "configuring nginx reverse proxy + certbot"
        setup_proxy
        ;;
    init)
        ok "env files ready in $DEVOPS_DIR, $DEVOPS_DIR/backend, $DEVOPS_DIR/frontend"
        warn "review them, then run: ./deploy.sh up"
        # also pre-flight the proxy configs so the operator sees the domains
        if [ -n "${FRONTEND_DOMAIN:-}" ]; then
            head_ "nginx reverse proxy will serve:"
            printf '  Frontend ....... https://%s\n' "${FRONTEND_DOMAIN}"
            printf '  Backend API .... https://%s\n' "${API_DOMAIN:-<not set>}"
            printf '  Database (PM) .. https://%s\n' "${DB_DOMAIN:-<not set>}"
        fi
        ;;
    *)
        printf 'usage: %s {up|down|restart|logs|status|pull|proxy|init}\n' "$0" >&2
        exit 2
        ;;
esac
