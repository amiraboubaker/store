#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Brings up BOTH stacks in the right order: database + API first, then the
# frontend, because VITE_API_URL in the frontend .env must point at a backend
# that is already reachable.
#
#   ./deploy.sh up        clone/pull once, then start backend -> frontend
#   ./deploy.sh down      stop both stacks
#   ./deploy.sh restart   restart both stacks
#   ./deploy.sh status    show both stacks
#   ./deploy.sh logs      follow logs of both stacks
#   ./deploy.sh pull      rebuild and redeploy both stacks from latest main
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

case "$COMMAND" in
    up)      run_both up ;;
    down)    run_both down ;;
    restart) run_both restart ;;
    logs)
        # both stacks are interactive, so follow them side by side
        bash "$BACKEND"  logs ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} &
        bash "$FRONTEND" logs ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} &
        wait
        ;;
    status)  run_both status ;;
    pull)    run_both pull ;;
    init)
        ok "env files ready in $DEVOPS_DIR, $DEVOPS_DIR/backend, $DEVOPS_DIR/frontend"
        warn "review them, then run: ./deploy.sh up"
        ;;
    *)
        printf 'usage: %s {up|down|restart|logs|status|pull|init}\n' "$0" >&2
        exit 2
        ;;
esac
