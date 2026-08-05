#!/bin/bash
set -e

# 1. 彈性檢查：確保外部有傳入環境變數
if [ -z "$DATABASE_URL" ]; then
  echo "❌ 錯誤: 缺少 DATABASE_URL 環境變數。"
  echo "💡 提示: 請使用 DATABASE_URL='你的連線字串' ./scripts/deploy-gcp.sh 執行。"
  exit 1
fi

PROJECT_ID="gen-lang-client-0445851809"
REGION="asia-east1"
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/my-app-repo/my-app:latest"

echo "🚀 開始部署流程..."

echo "📦 正在建置 Docker 映像檔..."
gcloud builds submit --tag $IMAGE_PATH .

echo "🔄 設定資料庫 Migration Job..."
gcloud run jobs update olulu-cakeart-migrate \
  --region $REGION \
  --image $IMAGE_PATH \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --command="npm" \
  --args="run,migrate:prod" \
  || \
gcloud run jobs create olulu-cakeart-migrate \
  --region $REGION \
  --image $IMAGE_PATH \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --command="npm" \
  --args="run,migrate:prod"

echo "🏃 執行資料庫 Migration..."
gcloud run jobs execute olulu-cakeart-migrate --region $REGION --wait

echo "🌐 部署 Cloud Run API 服務..."
gcloud run deploy my-app \
  --image $IMAGE_PATH \
  --region $REGION \
  --set-env-vars="DATABASE_URL=${DATABASE_URL}" \
  --allow-unauthenticated

echo "✅ 部署完成！"
