#!/usr/bin/env bash
set -euo pipefail

# Run the frontend container locally
# Usage: ./run.sh [port]

PORT="${1:-3000}"
IMAGE_NAME="${FRONTEND_IMAGE_NAME:-couture-frontend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${IMAGE_TAG:-latest}"

echo "Running frontend on port ${PORT}"
docker run -d \
  --name couture-frontend \
  -p "${PORT}:80" \
  -e VITE_API_URL="${VITE_API_URL:-http://localhost:5000}" \
  --restart unless-stopped \
  "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "Frontend is running at http://localhost:${PORT}"