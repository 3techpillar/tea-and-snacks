FROM node:22-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspace package files
COPY packages/shared/package.json ./packages/shared/
COPY apps/frontend/package.json ./apps/frontend/
RUN npm ci

# Copy code and build
COPY packages/shared ./packages/shared
COPY apps/frontend ./apps/frontend
RUN npm run build:frontend

# Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
