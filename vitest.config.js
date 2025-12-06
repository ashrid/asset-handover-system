import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test timeout
    testTimeout: 10000,

    // Include patterns
    include: [
      'tests/**/*.test.js',
      'tests/**/*.spec.js'
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**'  // E2E tests run separately with Playwright
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['server/**/*.js'],
      exclude: [
        'server/migrations/**',
        'server/templates/**'
      ]
    },

    // Global setup/teardown
    globalSetup: './tests/setup/globalSetup.js',
    setupFiles: ['./tests/setup/testSetup.js'],

    // Reporter
    reporters: ['verbose'],

    // Pool options for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true  // Use single fork for DB tests
      }
    }
  }
});
