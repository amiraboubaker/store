#!/usr/bin/env bash
set -euo pipefail

# Push the backend Docker image to Docker Hub
# Usage: ./push.sh [tag]

IMAGE_NAME="${BACKEND_IMAGE_NAME:-couture-backend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${1:-latest}"

echo "Pushing backend image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
docker push "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
echo "Done."