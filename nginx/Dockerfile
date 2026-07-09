FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine

RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf

COPY --from=frontend-builder --chown=nginx:nginx /app/frontend/dist /usr/share/nginx/html

RUN chmod -R 755 /usr/share/nginx/html && \
    rm -rf /var/cache/apk/*

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
