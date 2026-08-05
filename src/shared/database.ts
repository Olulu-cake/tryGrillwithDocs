import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config'; // 💡 強迫 Vitest 測試期從專案根目錄精準載入環境變數

// 1. 利用 pg 驅動建立一個原生的高效資料庫連線池 (Connection Pool)
console.log('🔗 當前 Prisma 連線的 DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. 將連線池包裝進 Prisma 7 官方規定的 PostgreSQL 適配器中
const adapter = new PrismaPg(pool);

// 🚀 生產環境就緒（Production-Ready）的純淨單例
// 100% 正式規格，再也不會觸發 "instantiated without options" 異常，效能最高！
export const prisma = new PrismaClient({ adapter });