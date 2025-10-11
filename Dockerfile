# 多阶段构建 Dockerfile for Next.js with Prisma - Node.js 24 版本

# 第一阶段: 基础依赖安装
FROM node:24-alpine AS deps

# 更新系统包并安装构建依赖
RUN apk update && apk upgrade && \
    apk add --no-cache libc6-compat python3 make g++ && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# 复制包管理文件
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# 复制 Prisma schema 并生成客户端
COPY prisma ./prisma/
RUN npx prisma generate

# 第二阶段: 构建应用
FROM node:24-alpine AS builder

RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

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

RUN apk update && apk upgrade && \
    apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 从构建阶段复制必要文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]