# 構建階段
FROM node:20-slim AS builder

WORKDIR /app

# 設置環境變數 & 此階段不下載 Chromium
ENV NODE_OPTIONS="--max-old-space-size=4096" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 複製 package 文件並安裝依賴
COPY package.json pnpm-lock.yaml ./
# 確保 pnpm 是 9.x 版本，10.x 版本有問題(2025/02/04 剛釋出)
RUN npm install -g pnpm@^9 \
    && pnpm install --frozen-lockfile \
    && ls -la node_modules/.pnpm

# 複製所有文件比較保險，可搭配 .dockerignore 使用
COPY . .

# 構建並清理 devDependencies
RUN pnpm build \
    && pnpm prune --prod


# 運行階段
FROM node:20-slim AS runner

WORKDIR /app

# 安裝 Chrome 相關依賴
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-wqy-zenhei \
        fonts-freefont-ttf \
        chromium \
        chromium-sandbox \
        dbus \
        dbus-x11 \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /var/cache/apt/*

# 設置 Puppeteer 環境變數
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 從構建階段複製文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 建立 puppeteer 快取目錄並設定權限
RUN mkdir -p /root/.cache/puppeteer \
    && chmod -R 777 /root/.cache/puppeteer

EXPOSE 3000

CMD ["node", "dist/main.js"]