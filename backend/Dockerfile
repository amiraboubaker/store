# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: install production dependencies
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 2: runtime
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node sql ./sql
# Operational scripts (reset-database.js) are run on demand via
# `docker compose exec backend node scripts/reset-database.js`. Without this
# COPY the container has no way to drop tables left behind by removed models.
COPY --chown=node:node scripts ./scripts

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# `node` runs as PID 1 so the SIGTERM handler in src/index.js is honoured.
CMD ["node", "src/index.js"]
