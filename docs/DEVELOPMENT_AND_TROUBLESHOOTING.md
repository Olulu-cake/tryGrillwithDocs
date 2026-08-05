# 開發與除錯指南 (Development & Troubleshooting Guide)

本文件記錄了本專案的環境架構、啟動流程以及常見問題的解決方案。

## 1. 環境架構角色說明

本專案採用前後端分離的架構：

*   **Storefront (Frontend):** 基於 Next.js 開發，負責展示層與使用者互動。
    *   預設開發埠號：`3000`
    *   關鍵設定：`NEXT_PUBLIC_API_URL` (指向後端 API 入口)
*   **API Server (Backend):** 基於 Express 與 TypeScript 開發，負責業務邏輯與資料庫互動。
    *   預設開發埠號：`8080`
    *   API 前綴：所有路由皆掛載於 `/api` 之下 (例如 `/api/products`)

## 2. 本機啟動標準流程

### 2.1 環境變數設定
請確保專案根目錄與 `storefront/` 目錄下皆有正確的 `.env` 設定。
*   根目錄 `.env`: 應包含正確的 `DATABASE_URL` (Prisma 連線字串)。
*   `storefront/.env.local`: 應設定 `NEXT_PUBLIC_API_URL=http://localhost:8080`。

### 2.2 啟動順序
1.  **啟動後端 API Server:**
    ```bash
    npm run dev:api  # 或直接啟動後端服務
    ```
2.  **啟動前端 Storefront:**
    ```bash
    cd storefront
    npm run dev
    ```

## 3. 常見問題與排除步驟 (Troubleshooting)

| 問題現象 | 原因分析 | 解決方案 |
| :--- | :--- | :--- |
| **Prisma P1011** | 資料庫連線字串錯誤或憑證問題。 | 檢查根目錄 `.env` 的 `DATABASE_URL`，確保格式與憑證正確。 |
| **API 404 / 500** | `NEXT_PUBLIC_API_URL` 設定錯誤 (例如重複包含 `/api`)。 | 設定 `NEXT_PUBLIC_API_URL=http://localhost:8080` (不含 `/api`)，由前端 API Client 自動補上。 |
| **Connection Refused** | 前後端埠號對應錯誤。 | 確認前端呼叫的 API URL 埠號與後端監聽的 `PORT` (預設 8080) 一致。 |

---
*註：若遇未知錯誤，請優先檢查 `docker-compose` 狀態與環境變數檔案是否已同步至最新。*
