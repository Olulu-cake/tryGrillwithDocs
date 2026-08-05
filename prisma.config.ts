import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // 💡 保持這行不變！它會自動去撈你在 .env 檔案裡放的那串 neon 網址
    url: process.env.DATABASE_URL!,
  },
});