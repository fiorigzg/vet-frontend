# Multi-stage Dockerfile.
# - `dev` target: hot-reload dev server (default for docker-compose.yml).
# - `prod` target: production build, used by docker-compose.prod.yml.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
# registry.yarnpkg.com часто недоступен из РФ — переключаемся на зеркало.
# --frozen-lockfile сверяет URL дословно с yarn.lock, поэтому переписываем
# их через sed (DNS до yarnpkg.com из контейнера не резолвится).
RUN yarn config set registry https://registry.npmmirror.com && \
    sed -i 's|https://registry\.yarnpkg\.com|https://registry.npmmirror.com|g' yarn.lock && \
    yarn install --frozen-lockfile --network-timeout 600000


# --- dev ------------------------------------------------------------------

FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["yarn", "dev"]


# --- build (used by prod) -------------------------------------------------

FROM node:22-alpine AS builder
WORKDIR /app
# NEXT_PUBLIC_* env vars are baked into the client bundle at build time.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY=${NEXT_PUBLIC_YANDEX_MAPS_API_KEY}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build


# --- prod -----------------------------------------------------------------

FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["yarn", "start"]
