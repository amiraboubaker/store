#!/usr/bin/env bash
set -euo pipefail

# Stop and remove the frontend container
docker stop couture-frontend 2>/dev/null || true
docker rm couture-frontend 2>/dev/null || true
echo "Frontend container stopped and removed."