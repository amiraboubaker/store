#!/usr/bin/env bash
set -euo pipefail

# Build the backend Docker image
# Usage: ./build.sh [tag]

IMAGE_NAME="${BACKEND_IMAGE_NAME:-couture-backend}"
DOCKERHUB_USERNAME="${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME}"
TAG="${1:-latest}"

echo "Building backend image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"
docker build \
  -t "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}" \
  -f Dockerfile \
  .

echo "Done. Image: ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"