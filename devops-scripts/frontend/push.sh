#!/usr/bin/env bash
set -euo pipefail

# Push the frontend Docker image to Docker Hub
# Usage: ./push.sh [tag]

IMAGE_NAME="${FRONTEND_IMAGE_NAME:-couture-frontend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${1:-latest}"

echo "Pushing frontend image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
docker push "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
echo "Done."