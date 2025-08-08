import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/utils/**'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 50,
      },
    },
  },
});
