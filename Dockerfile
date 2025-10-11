# Coolify 专用 Dockerfile - 简化版本
FROM node:24-alpine

WORKDIR /app

# 安装系统依赖
RUN apk update && apk upgrade && \
    apk add --no-cache curl python3 make g++ && \
    rm -rf /var/cache/apk/*

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖（让 Coolify 处理 secret 挂载）
RUN npm ci

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制应用代码
COPY . .

# 构建应用
RUN npm run build

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动命令（在运行时执行数据库迁移）
CMD sh -c "npx prisma migrate deploy && node server.js"