# 多阶段构建 Dockerfile for Next.js with Prisma

# 第一阶段：安装所有依赖并生成 Prisma client（保留 dev 依赖以便 builder 使用）
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++  # 编译原生模块所需
WORKDIR /app

# 复制包管理文件与 prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# 安装所有依赖（包含 devDeps），并生成 Prisma Client
RUN npm ci
RUN npm install -D prisma || true
RUN npx prisma generate

# 第二阶段：构建应用
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖与源码
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 再次生成 Prisma（保险起见）
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用（产出 .next/standalone）
RUN npm run build

# 第三阶段：运行时镜像（更小）
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 为 healthcheck 准备 curl，创建非 root 用户
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 与静态资源
# Next.js standalone 模式会在 .next/standalone 中包含 server.js 和运行时所需的 node_modules（部分）
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# 如果你需要 node_modules 中的 prisma client 文件
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma

# 设置权限并使用非 root 用户
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Entrypoint: server.js 应该在 standalone 输出的根目录
CMD ["node", "server.js"]
