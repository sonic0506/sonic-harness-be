import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./test/setup/msw.ts'],
    coverage: {
      include: ['src/**/*.service.ts'],
      thresholds: { lines: 80, branches: 80 },
    },
  },
});
