#!/usr/bin/env bash
set -euo pipefail

# Build the frontend Docker image
# Usage: ./build.sh [tag]

IMAGE_NAME="${FRONTEND_IMAGE_NAME:-couture-frontend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${1:-latest}"

echo "Building frontend image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
docker build \
  --build-arg VITE_API_URL="${VITE_API_URL:-http://localhost:5000}" \
  -t "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}" \
  -f Dockerfile \
  .

echo "Done. Image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"