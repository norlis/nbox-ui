FROM node:22 AS  base

RUN addgroup --system --gid 1001 remix
RUN adduser --system --uid 1001 remix


FROM base AS deps
WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json \
   --mount=type=bind,source=package-lock.json,target=package-lock.json \
   --mount=type=cache,target=/root/.npm \
    npm ci


FROM deps AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY . .
RUN npm run build


FROM deps AS prod-deps
WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json \
   --mount=type=bind,source=package-lock.json,target=package-lock.json \
   --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev


################################
# TOOLS
# image used for production stage
################################
#FROM busybox:uclibc AS busybox
FROM public.ecr.aws/docker/library/busybox:stable-uclibc AS busybox


FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group
COPY --from=busybox /bin/sh /bin/ls /bin/wget /bin/cat /bin/vi /bin/cp /bin/grep /bin/ln /bin/mkdir /bin/ps /bin/
COPY --from=prod-deps --chown=remix:remix /app/node_modules ./node_modules
COPY --from=builder --chown=remix:remix /app/build ./build

USER remix

ENV NODE_ENV=production
CMD [ "node_modules/.bin/react-router-serve", "build/server/index.js"]

EXPOSE 3000