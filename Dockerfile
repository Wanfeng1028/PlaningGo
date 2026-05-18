FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN pnpm build
# 移除 devDependencies，只保留生产依赖
RUN pnpm prune --prod

FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated/prisma ./src/generated/prisma
COPY --from=build /app/package.json ./

# prisma migrate 需要 schema 文件
COPY --from=build /app/prisma ./prisma

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

# 等待 DB 就绪后运行 migrate 并启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/index.js"]
