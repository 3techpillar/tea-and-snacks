FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
# Copy workspace package files
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (workspaces will link)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Build shared package then backend
RUN npm run build:shared
RUN npm run build:backend

# Production image
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3015

CMD ["npm", "run", "start", "-w", "@tea-and-snacks/backend"]
