import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Global test setup
beforeAll(async () => {
  // Setup test database
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/ministry_platform_test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
});

afterAll(async () => {
  // Cleanup test database
  // Add cleanup logic here
});

beforeEach(() => {
  // Reset test state
});

afterEach(() => {
  // Cleanup after each test
});
