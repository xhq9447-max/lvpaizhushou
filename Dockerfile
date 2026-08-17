FROM node:22-bookworm-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY admin-web/package.json admin-web/package.json
RUN npm ci

COPY backend backend
RUN npm run prisma:generate -w backend && npm run build -w backend

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    PRISMA_SKIP_POSTINSTALL_GENERATE=true

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY admin-web/package.json admin-web/package.json
RUN npm ci --omit=dev

COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/backend/prisma backend/prisma
COPY --from=builder /app/backend/healthcheck.cjs backend/healthcheck.cjs
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

USER node
EXPOSE 3000
HEALTHCHECK CMD node /app/backend/healthcheck.cjs

CMD ["sh", "-c", "npx prisma migrate deploy --schema=backend/prisma/schema.prisma && node backend/dist/main.js"]
