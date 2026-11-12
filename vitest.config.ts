import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      include: ['src/domain/**/*.ts', 'src/storage/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    projects: [
      {
        test: {
          environment: 'node',
          include: ['src/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        test: {
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          name: 'ui',
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
})
