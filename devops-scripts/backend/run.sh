#!/usr/bin/env bash
set -euo pipefail

# Run the backend container locally
# Usage: ./run.sh [port]

PORT="${1:-5000}"
IMAGE_NAME="${BACKEND_IMAGE_NAME:-couture-backend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${IMAGE_TAG:-latest}"

echo "Running backend on port ${PORT}"
docker run -d \
  --name couture-backend \
  -p "${PORT}:5000" \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=5000 \
  --restart unless-stopped \
  "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "Backend is running at http://localhost:${PORT}"