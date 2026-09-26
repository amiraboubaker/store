FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node
CMD ["npm", "start"]