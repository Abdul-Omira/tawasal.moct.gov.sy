import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ministry Platform/);
  });

  test('should be able to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display form builder', async ({ page }) => {
    await page.goto('/form-builder');
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
  });
});
