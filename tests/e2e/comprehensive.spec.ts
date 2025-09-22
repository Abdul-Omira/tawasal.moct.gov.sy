import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete full form creation workflow', async ({ page }) => {
    // Navigate to form builder
    await page.goto('/form-builder');
    await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();

    // Create new form
    await page.click('[data-testid="new-form-button"]');
    await page.fill('[data-testid="form-title"]', 'E2E Test Form');
    await page.fill('[data-testid="form-description"]', 'A comprehensive test form');

    // Add text input component
    await page.dragAndDrop('[data-testid="text-component"]', '[data-testid="form-canvas"]');
    await page.fill('[data-testid="component-label"]', 'Full Name');
    await page.check('[data-testid="component-required"]');

    // Add email input component
    await page.dragAndDrop('[data-testid="email-component"]', '[data-testid="form-canvas"]');
    await page.fill('[data-testid="component-label"]', 'Email Address');
    await page.check('[data-testid="component-required"]');

    // Add select component
    await page.dragAndDrop('[data-testid="select-component"]', '[data-testid="form-canvas"]');
    await page.fill('[data-testid="component-label"]', 'Department');
    await page.fill('[data-testid="component-options"]', 'IT,HR,Finance,Operations');

    // Save form
    await page.click('[data-testid="save-form-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Publish form
    await page.click('[data-testid="publish-form-button"]');
    await expect(page.locator('[data-testid="publish-success"]')).toBeVisible();
  });

  test('should complete form submission workflow', async ({ page }) => {
    // Navigate to published form
    await page.goto('/forms/published');
    await page.click('[data-testid="form-item"]:first-child');

    // Fill form
    await page.fill('[data-testid="field-full-name"]', 'John Doe');
    await page.fill('[data-testid="field-email"]', 'john.doe@example.com');
    await page.selectOption('[data-testid="field-department"]', 'IT');

    // Submit form
    await page.click('[data-testid="submit-form-button"]');
    await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();
  });

  test('should complete user management workflow', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();

    // Create new user
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="username"]', 'newuser');
    await page.fill('[data-testid="password"]', 'newpassword123');
    await page.fill('[data-testid="name"]', 'New User');
    await page.selectOption('[data-testid="role"]', 'ministry_admin');
    await page.selectOption('[data-testid="ministry"]', '1');

    // Save user
    await page.click('[data-testid="save-user-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Edit user
    await page.click('[data-testid="edit-user-button"]:first-child');
    await page.fill('[data-testid="name"]', 'Updated User');
    await page.click('[data-testid="save-user-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Delete user
    await page.click('[data-testid="delete-user-button"]:first-child');
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should complete analytics workflow', async ({ page }) => {
    // Navigate to analytics
    await page.goto('/admin/analytics');
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();

    // Check overview metrics
    await expect(page.locator('[data-testid="total-forms"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-submissions"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible();

    // Navigate to form analytics
    await page.click('[data-testid="form-analytics-tab"]');
    await expect(page.locator('[data-testid="form-analytics"]')).toBeVisible();

    // Check form metrics
    await expect(page.locator('[data-testid="form-submission-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="form-performance-chart"]')).toBeVisible();
  });

  test('should complete report generation workflow', async ({ page }) => {
    // Navigate to reports
    await page.goto('/admin/reports');
    await expect(page.locator('[data-testid="report-management"]')).toBeVisible();

    // Create new report
    await page.click('[data-testid="create-report-button"]');
    await page.fill('[data-testid="report-name"]', 'E2E Test Report');
    await page.fill('[data-testid="report-description"]', 'A comprehensive test report');

    // Select report type
    await page.selectOption('[data-testid="report-type"]', 'form_submissions');
    await page.selectOption('[data-testid="date-range"]', 'last_30_days');

    // Configure filters
    await page.check('[data-testid="filter-by-ministry"]');
    await page.selectOption('[data-testid="ministry-filter"]', '1');

    // Generate report
    await page.click('[data-testid="generate-report-button"]');
    await expect(page.locator('[data-testid="report-generated"]')).toBeVisible();

    // Download report
    await page.click('[data-testid="download-report-button"]');
    // Note: File download testing requires additional setup
  });

  test('should complete security monitoring workflow', async ({ page }) => {
    // Navigate to security dashboard
    await page.goto('/admin/security');
    await expect(page.locator('[data-testid="security-dashboard"]')).toBeVisible();

    // Check security metrics
    await expect(page.locator('[data-testid="security-events"]')).toBeVisible();
    await expect(page.locator('[data-testid="threat-level"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-alerts"]')).toBeVisible();

    // Navigate to security events
    await page.click('[data-testid="security-events-tab"]');
    await expect(page.locator('[data-testid="security-events-list"]')).toBeVisible();

    // Check event details
    await page.click('[data-testid="event-item"]:first-child');
    await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
  });

  test('should complete performance monitoring workflow', async ({ page }) => {
    // Navigate to performance dashboard
    await page.goto('/admin/performance');
    await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible();

    // Check performance metrics
    await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="throughput-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible();

    // Navigate to performance alerts
    await page.click('[data-testid="performance-alerts-tab"]');
    await expect(page.locator('[data-testid="performance-alerts"]')).toBeVisible();
  });

  test('should complete API gateway workflow', async ({ page }) => {
    // Navigate to API gateway
    await page.goto('/admin/api-gateway');
    await expect(page.locator('[data-testid="api-gateway-dashboard"]')).toBeVisible();

    // Create API key
    await page.click('[data-testid="create-api-key-button"]');
    await page.fill('[data-testid="api-key-name"]', 'E2E Test API Key');
    await page.selectOption('[data-testid="api-key-role"]', 'read_only');
    await page.fill('[data-testid="api-key-expiry"]', '2024-12-31');

    // Save API key
    await page.click('[data-testid="save-api-key-button"]');
    await expect(page.locator('[data-testid="api-key-created"]')).toBeVisible();

    // Test API key
    await page.click('[data-testid="test-api-key-button"]:first-child');
    await expect(page.locator('[data-testid="api-test-result"]')).toBeVisible();
  });

  test('should complete webhook configuration workflow', async ({ page }) => {
    // Navigate to webhooks
    await page.goto('/admin/webhooks');
    await expect(page.locator('[data-testid="webhook-dashboard"]')).toBeVisible();

    // Create webhook
    await page.click('[data-testid="create-webhook-button"]');
    await page.fill('[data-testid="webhook-name"]', 'E2E Test Webhook');
    await page.fill('[data-testid="webhook-url"]', 'https://example.com/webhook');
    await page.selectOption('[data-testid="webhook-events"]', 'form_submitted');

    // Save webhook
    await page.click('[data-testid="save-webhook-button"]');
    await expect(page.locator('[data-testid="webhook-created"]')).toBeVisible();

    // Test webhook
    await page.click('[data-testid="test-webhook-button"]:first-child');
    await expect(page.locator('[data-testid="webhook-test-result"]')).toBeVisible();
  });

  test('should complete SSO configuration workflow', async ({ page }) => {
    // Navigate to SSO
    await page.goto('/admin/sso');
    await expect(page.locator('[data-testid="sso-dashboard"]')).toBeVisible();

    // Create SSO provider
    await page.click('[data-testid="create-sso-provider-button"]');
    await page.fill('[data-testid="provider-name"]', 'E2E Test SSO');
    await page.selectOption('[data-testid="provider-type"]', 'saml');
    await page.fill('[data-testid="provider-url"]', 'https://example.com/saml');

    // Save SSO provider
    await page.click('[data-testid="save-sso-provider-button"]');
    await expect(page.locator('[data-testid="sso-provider-created"]')).toBeVisible();

    // Test SSO connection
    await page.click('[data-testid="test-sso-button"]:first-child');
    await expect(page.locator('[data-testid="sso-test-result"]')).toBeVisible();
  });

  test('should complete white-label configuration workflow', async ({ page }) => {
    // Navigate to white-label
    await page.goto('/admin/white-label');
    await expect(page.locator('[data-testid="white-label-dashboard"]')).toBeVisible();

    // Configure branding
    await page.fill('[data-testid="organization-name"]', 'E2E Test Organization');
    await page.fill('[data-testid="primary-color"]', '#007bff');
    await page.fill('[data-testid="secondary-color"]', '#6c757d');

    // Upload logo
    await page.setInputFiles('[data-testid="logo-upload"]', 'tests/fixtures/test-logo.png');

    // Save configuration
    await page.click('[data-testid="save-white-label-button"]');
    await expect(page.locator('[data-testid="white-label-saved"]')).toBeVisible();

    // Preview changes
    await page.click('[data-testid="preview-button"]');
    await expect(page.locator('[data-testid="preview-modal"]')).toBeVisible();
  });
});
