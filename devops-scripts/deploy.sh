#!/bin/bash
set -e

COMPOSE_FILE="docker-compose.yml"

echo "=========================================="
echo "  Rayesmodes DevOps - Deployment Script"
echo "=========================================="
echo ""

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: $COMPOSE_FILE not found in $(pwd)"
    echo "Make sure you are in the devops-scripts directory"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found in $(pwd)"
    echo "Copy .env.example to .env and edit your values"
    exit 1
fi

ACTION="${1:-deploy}"

case "$ACTION" in
  deploy)
    echo "[1/4] Pulling latest images from DockerHub..."
    docker compose pull
    echo ""

    echo "[2/4] Starting services..."
    docker compose up -d
    echo ""

    echo "[3/4] Service status:"
    docker compose ps
    echo ""

    echo "[4/4] Deployment complete!"
    echo ""
    echo "  Frontend:      http://localhost:\${FRONTEND_PORT:-3000}"
    echo "  Backend API:   http://localhost:\${BACKEND_PORT:-5000}"
    echo "  phpMyAdmin:    http://localhost:\${PHPADMIN_PORT:-8080}"
    echo ""
    echo "Useful commands:"
    echo "  docker compose logs -f     # View logs"
    echo "  docker compose down        # Stop and remove containers"
    echo "  docker compose restart     # Restart all services"
    echo "  ./deploy.sh update         # Pull new images and restart"
    echo "  ./deploy.sh status         # Check service status"
    echo "  ./deploy.sh logs           # View logs"
    echo "  ./deploy.sh down           # Stop and remove all services"
    ;;

  update)
    echo "Pulling latest images from DockerHub..."
    docker compose pull
    echo ""
    echo "Restarting services with new images..."
    docker compose up -d
    echo ""
    echo "Updated! Current status:"
    docker compose ps
    ;;

  status)
    docker compose ps
    ;;

  logs)
    docker compose logs -f
    ;;

  down)
    echo "Stopping and removing all services..."
    docker compose down
    echo "Done."
    ;;

  *)
    echo "Usage: ./deploy.sh [deploy|update|status|logs|down]"
    echo ""
    echo "Commands:"
    echo "  deploy   - Pull images and start all services (default)"
    echo "  update   - Pull latest images and restart services"
    echo "  status   - Show service status"
    echo "  logs     - View service logs (live)"
    echo "  down     - Stop and remove all containers and volumes"
    exit 1
    ;;
esac