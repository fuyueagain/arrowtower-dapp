# 多阶段构建 Dockerfile for Next.js with Prisma - 通用版本

# 第一阶段: 依赖安装
FROM node:24-alpine AS deps

# 安装系统依赖
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# 复制包管理文件
COPY package.json package-lock.json* ./
RUN npm ci

# 复制 Prisma schema
COPY prisma ./prisma/
RUN npx prisma generate

# 第二阶段: 构建应用
FROM node:24-alpine AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用
RUN npm run build

# 第三阶段: 生产运行时
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 从构建阶段复制必要文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用（包含数据库迁移）
CMD sh -c "npx prisma migrate deploy && node server.js"