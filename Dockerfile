# 階段一：Builder
FROM node:20-slim AS builder
WORKDIR /app

# 安裝 build 必要的依賴
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 複製 package 檔並安裝所有依賴
COPY package*.json ./
RUN npm install

# 複製原始碼與 Prisma schema
COPY . .

# 執行 Prisma generate
RUN npx prisma generate

# 編譯 TypeScript
RUN npm run build

# ---------------------------------------------------

# 階段二：Runner
FROM node:20-slim AS runner
WORKDIR /app

# 安裝 tini (init process) 與 openssl
RUN apt-get update -y && apt-get install -y tini openssl && rm -rf /var/lib/apt/lists/*

# 複製 package 檔
COPY package*.json ./

# 安裝正式機依賴
RUN npm install --production

# 從 Builder 階段複製編譯好的程式碼與 prisma 客戶端
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# 複製 schema
COPY prisma ./prisma

# 安全性設定
RUN chown -R node:node /app
USER node

# 使用 tini 啟動
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/app.js"]
