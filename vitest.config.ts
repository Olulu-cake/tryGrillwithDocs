import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 精準捕捉到 src 下的所有 .spec.ts 或 .test.ts 檔案
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});