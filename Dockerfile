# Katagami production image: one container serves the API, the WebSocket
# sync endpoint and the built client. Postgres runs in a sibling container
# (see docker-compose.prod.yml).

# ---- build stage -----------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL at generate time and at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm db:generate && pnpm build

# ---- runtime stage ---------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# node_modules is copied whole (dev deps included) so the Prisma CLI is
# available to run migrations on start. Image size is not a concern at this
# scale; simplicity is.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3001

# Apply pending migrations, then start. `migrate deploy` is a no-op when the
# schema is already current, so restarts are safe.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server/server/index.js"]
