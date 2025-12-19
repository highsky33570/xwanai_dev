# --- Stage 1: The Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./

# 清理并安装依赖
RUN rm -rf node_modules && \
    pnpm install --frozen-lockfile --prefer-offline

# 复制源代码（排除 node_modules）
COPY . .

# 清理构建缓存并构建应用
RUN pnpm run build

# --- Stage 2: The Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 从 builder 阶段复制 standalone 的输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 复制静态资源
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 切换到非 root 用户
USER nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# Next.js 默认在 3000 端口运行
EXPOSE 3000

# 启动 Node.js 服务器
CMD ["node", "server.js"]
