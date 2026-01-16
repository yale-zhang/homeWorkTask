FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies and build the production bundle
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Add a small entrypoint script that can generate a runtime config JS
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
