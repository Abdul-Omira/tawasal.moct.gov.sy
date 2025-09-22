import { test, expect } from '@playwright/test';

test.describe('Health Checks', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
  });

  test('should check database connectivity', async ({ request }) => {
    const response = await request.get('/api/health/db');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'connected');
  });

  test('should check Redis connectivity', async ({ request }) => {
    const response = await request.get('/api/health/redis');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'connected');
  });
});
