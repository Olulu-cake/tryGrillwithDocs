# GCP Deployment Runbook

本手冊紀錄了基於 Cloud Run 與 Cloud SQL (PostgreSQL) 的生產環境部署與維護指南。

---

## 1. 架構概覽 (Architecture Overview)

*   **連線架構**: 應用程式運作於 Cloud Run (受管 Container)，透過 Cloud SQL Auth Proxy (由 Cloud Run 內建整合) 連接至 Cloud SQL (PostgreSQL)。
*   **環境變數 (`DATABASE_URL`)**: 格式為 `postgresql://USER:PASSWORD@localhost:5432/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_ID&sslmode=require`。
    *   **注意**: 必須設定 `sslmode=require` 以確保與 Cloud SQL 的加密連線。
*   **監聽機制**: Cloud Run 透過環境變數 `PORT` (預設為 `8080`) 監聽請求。應用程式必須明確監聽 `0.0.0.0` 而非 `127.0.0.1`。

---

## 2. Docker 最佳實踐 (Production Dockerfile)

我們採用 **多階段建置 (Multi-stage build)** 以優化映像檔體積並確保安全性。

```dockerfile
# 階段一：Builder (建置環境)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# 階段二：Runner (正式環境)
FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
RUN chown -R node:node /app
USER node
CMD ["node", "dist/app.js"]
```

### 關鍵技術說明
*   **分階段 `prisma generate`**: Builder 階段產生 client 供編譯檢查；Runner 階段產生正式環境用的 binary (僅含 runtime 需求)。
*   **權限設定 (`chown` 與 `USER node`)**: 確保應用程式不以 root 執行，限制受駭時的攻擊面；透過 `chown` 確保 `node` 使用者可存取 prisma 產生的檔案。

---

## 3. 故障排除指南 (Troubleshooting)

| 錯誤訊息 | 原因 | 解法 |
| :--- | :--- | :--- |
| `Cannot find module '@prisma/adapter-pg'` | Runner 階段缺少依賴。 | 確保 `npm install --production` 有執行，且 prisma generate 正確。 |
| `@prisma/client did not initialize yet` | `node_modules` 與 Builder 階段不一致。 | 確認 Runner 階段有重新執行 `npx prisma generate`。 |
| `Can't write to /app/node_modules/prisma` | `USER node` 權限不足。 | 在切換使用者前，執行 `chown -R node:node /app`。 |
| `Health Check 失敗` | 應用程式未綁定 `0.0.0.0`。 | 在 `app.listen()` 中明確指定 `'0.0.0.0'`。 |

---

## 4. 標準部署流程 (Deployment Checklist)

1.  **確認環境**: 確保已安裝 `gcloud` CLI 並登入。
2.  **設定變數**: 定義 `DATABASE_URL`。
3.  **執行部署**:
    ```bash
    DATABASE_URL='你的連線字串' ./scripts/deploy-gcp.sh
    ```
4.  **驗證**: 觀察 Cloud Run 日誌與 Jobs Migration 狀態。
