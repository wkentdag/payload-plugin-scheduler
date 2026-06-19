import path from 'path'
import { loadEnv } from 'payload/node'
import { fileURLToPath } from 'url'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

loadEnv(path.resolve(dirname, './dev'))

export default defineConfig({
  plugins: [
    tsconfigPaths({
      ignoreConfigErrors: true,
      projects: ['./dev/tsconfig.test.json'],
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
    hookTimeout: 30_000,
    setupFiles: ['./dev/test/setup.ts'],
    testTimeout: 30_000,
  },
})
