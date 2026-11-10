import { defineConfig } from 'vite';
export default defineConfig({
  base: '/gostop2026/',
  build: { outDir: 'dist' },
  test: { include: ['test/**/*.test.ts'] },
} as any);
