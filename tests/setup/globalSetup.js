/**
 * Global setup - runs once before all tests
 */
export default async function globalSetup() {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

  console.log('\\n🧪 Global test setup complete\\n');
}
