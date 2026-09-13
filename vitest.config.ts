import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // '@/…' mirrors tsconfig paths so component-level tests can import the tree.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: { environment: 'node', include: ['lib/__tests__/**/*.test.ts'] },
});
