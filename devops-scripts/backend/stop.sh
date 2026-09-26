#!/usr/bin/env bash
set -euo pipefail

# Stop and remove the backend container
docker stop couture-backend 2>/dev/null || true
docker rm couture-backend 2>/dev/null || true
echo "Backend container stopped and removed."