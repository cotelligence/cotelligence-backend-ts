# syntax=docker/dockerfile:1.2

FROM node:18-alpine3.16 as node

ENV YARN_CACHE_FOLDER=/.yarn/cache
RUN yarn config set cacheFolder /.yarn/cache

FROM node as builder
WORKDIR /build
COPY .yarn ./.yarn
COPY .yarnrc.yml .
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/.yarn/cache,sharing=shared \
    yarn install
COPY . .
RUN yarn prisma generate
RUN yarn build

FROM node as final
WORKDIR /app
COPY .yarn ./.yarn
COPY .yarnrc.yml .
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/.yarn/cache,sharing=shared \
    yarn workspaces focus --production
# copy dist from builder
COPY --from=builder /build/dist dist
COPY --from=builder /build/prisma prisma
COPY --from=builder /build/node_modules/.prisma /app/node_modules/.prisma
ENV NODE_ENV=production
CMD yarn prisma migrate deploy && node dist/main.js
