import { test, expect, Page } from '@playwright/test';

test.describe('UI Visual Regression Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3000');
  });

  test.describe('Landing Page Visual Tests', () => {
    test('should match landing page design', async () => {
      // Take screenshot of landing page
      await expect(page).toHaveScreenshot('landing-page.png');
    });

    test('should match navigation design', async () => {
      // Take screenshot of navigation
      const nav = page.locator('nav');
      await expect(nav).toHaveScreenshot('navigation.png');
    });

    test('should match error state design', async () => {
      // Take screenshot of tenant error state
      await expect(page.locator('text=TENANT_NOT_FOUND')).toBeVisible();
      await expect(page).toHaveScreenshot('tenant-error-state.png');
    });
  });

  test.describe('Form Builder Visual Tests', () => {
    test.beforeEach(async () => {
      await page.click('text=Forms');
    });

    test('should match form builder layout', async () => {
      // Take screenshot of form builder
      await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
      await expect(page).toHaveScreenshot('form-builder-layout.png');
    });

    test('should match component library design', async () => {
      // Take screenshot of component library
      await expect(page.locator('[data-testid="component-library"]')).toBeVisible();
      await expect(page.locator('[data-testid="component-library"]')).toHaveScreenshot('component-library.png');
    });

    test('should match form canvas design', async () => {
      // Take screenshot of empty form canvas
      await expect(page.locator('[data-testid="form-canvas"]')).toBeVisible();
      await expect(page.locator('[data-testid="form-canvas"]')).toHaveScreenshot('form-canvas-empty.png');
    });

    test('should match property panel design', async () => {
      // Add a component first
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Take screenshot of property panel
      await expect(page.locator('[data-testid="property-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="property-panel"]')).toHaveScreenshot('property-panel.png');
    });

    test('should match form with components design', async () => {
      // Add multiple components
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      const button = page.locator('[data-testid="component-button"]');
      await button.dragTo(canvas);
      
      const textarea = page.locator('[data-testid="component-textarea"]');
      await textarea.dragTo(canvas);
      
      // Take screenshot of form with components
      await expect(canvas).toHaveScreenshot('form-canvas-with-components.png');
    });

    test('should match component selection state', async () => {
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Take screenshot of selected component
      await expect(canvas.locator('[data-testid="component-wrapper"]').first()).toHaveScreenshot('component-selected.png');
    });
  });

  test.describe('Admin Panel Visual Tests', () => {
    test.beforeEach(async () => {
      await page.click('text=Admin');
    });

    test('should match admin dashboard design', async () => {
      // Take screenshot of admin dashboard
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      await expect(page).toHaveScreenshot('admin-dashboard.png');
    });

    test('should match ministry management design', async () => {
      // Take screenshot of ministry management
      await expect(page.locator('[data-testid="ministry-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="ministry-management"]')).toHaveScreenshot('ministry-management.png');
    });

    test('should match user management design', async () => {
      // Take screenshot of user management
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-management"]')).toHaveScreenshot('user-management.png');
    });

    test('should match role management design', async () => {
      // Take screenshot of role management
      await expect(page.locator('[data-testid="role-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-management"]')).toHaveScreenshot('role-management.png');
    });
  });

  test.describe('Analytics Dashboard Visual Tests', () => {
    test.beforeEach(async () => {
      await page.click('text=Analytics');
    });

    test('should match analytics dashboard design', async () => {
      // Take screenshot of analytics dashboard
      await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible();
      await expect(page).toHaveScreenshot('analytics-dashboard.png');
    });

    test('should match real-time metrics design', async () => {
      // Take screenshot of real-time metrics
      await expect(page.locator('[data-testid="real-time-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="real-time-metrics"]')).toHaveScreenshot('real-time-metrics.png');
    });

    test('should match form analytics design', async () => {
      // Take screenshot of form analytics
      await expect(page.locator('[data-testid="form-analytics"]')).toBeVisible();
      await expect(page.locator('[data-testid="form-analytics"]')).toHaveScreenshot('form-analytics.png');
    });
  });

  test.describe('Authentication Visual Tests', () => {
    test('should match login form design', async () => {
      await page.goto('http://localhost:3000/login');
      
      // Take screenshot of login form
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page).toHaveScreenshot('login-form.png');
    });

    test('should match MFA setup design', async () => {
      await page.goto('http://localhost:3000/mfa/setup');
      
      // Take screenshot of MFA setup
      await expect(page.locator('[data-testid="mfa-setup"]')).toBeVisible();
      await expect(page).toHaveScreenshot('mfa-setup.png');
    });

    test('should match MFA verification design', async () => {
      await page.goto('http://localhost:3000/mfa/verify');
      
      // Take screenshot of MFA verification
      await expect(page.locator('[data-testid="mfa-verification"]')).toBeVisible();
      await expect(page).toHaveScreenshot('mfa-verification.png');
    });
  });

  test.describe('Responsive Visual Tests', () => {
    test('should match mobile layout', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      
      // Take screenshot of mobile layout
      await expect(page).toHaveScreenshot('mobile-layout.png');
    });

    test('should match tablet layout', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      
      // Take screenshot of tablet layout
      await expect(page).toHaveScreenshot('tablet-layout.png');
    });

    test('should match desktop layout', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000');
      
      // Take screenshot of desktop layout
      await expect(page).toHaveScreenshot('desktop-layout.png');
    });
  });

  test.describe('Internationalization Visual Tests', () => {
    test('should match Arabic layout', async () => {
      // Switch to Arabic
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-ar"]');
      
      // Take screenshot of Arabic layout
      await expect(page).toHaveScreenshot('arabic-layout.png');
    });

    test('should match RTL layout', async () => {
      // Switch to Arabic for RTL
      await page.click('[data-testid="language-selector"]');
      await page.click('[data-testid="language-ar"]');
      
      // Check if RTL is applied
      const body = page.locator('body');
      await expect(body).toHaveAttribute('dir', 'rtl');
      
      // Take screenshot of RTL layout
      await expect(page).toHaveScreenshot('rtl-layout.png');
    });
  });

  test.describe('Component Visual Tests', () => {
    test('should match all form components', async () => {
      await page.click('text=Forms');
      
      // Add all component types
      const components = [
        'component-text-input',
        'component-textarea',
        'component-select',
        'component-checkbox',
        'component-radio',
        'component-button',
        'component-date-picker',
        'component-file-upload'
      ];
      
      const canvas = page.locator('[data-testid="form-canvas"]');
      
      for (const componentId of components) {
        const component = page.locator(`[data-testid="${componentId}"]`);
        await component.dragTo(canvas);
      }
      
      // Take screenshot of all components
      await expect(canvas).toHaveScreenshot('all-form-components.png');
    });

    test('should match component states', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      
      // Test hover state
      await component.hover();
      await expect(component).toHaveScreenshot('component-hover.png');
      
      // Test selected state
      await component.click();
      await expect(component).toHaveScreenshot('component-selected.png');
      
      // Test focused state
      await component.press('Tab');
      await expect(component).toHaveScreenshot('component-focused.png');
    });
  });

  test.describe('Modal and Dialog Visual Tests', () => {
    test('should match template library modal', async () => {
      await page.click('text=Forms');
      await page.click('[data-testid="templates-button"]');
      
      // Take screenshot of template library modal
      await expect(page.locator('[data-testid="template-library"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-library"]')).toHaveScreenshot('template-library-modal.png');
    });

    test('should match publishing workflow modal', async () => {
      await page.click('text=Forms');
      await page.click('[data-testid="publish-button"]');
      
      // Take screenshot of publishing workflow modal
      await expect(page.locator('[data-testid="publishing-workflow"]')).toBeVisible();
      await expect(page.locator('[data-testid="publishing-workflow"]')).toHaveScreenshot('publishing-workflow-modal.png');
    });

    test('should match conditional logic builder modal', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select component and open logic builder
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      await page.click('[data-testid="logic-tab"]');
      await page.click('[data-testid="open-logic-builder"]');
      
      // Take screenshot of conditional logic builder modal
      await expect(page.locator('[data-testid="conditional-logic-builder"]')).toBeVisible();
      await expect(page.locator('[data-testid="conditional-logic-builder"]')).toHaveScreenshot('conditional-logic-builder-modal.png');
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('should match 404 error page', async () => {
      await page.goto('http://localhost:3000/nonexistent-page');
      
      // Take screenshot of 404 page
      await expect(page).toHaveScreenshot('404-error-page.png');
    });

    test('should match network error state', async () => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      await page.goto('http://localhost:3000');
      
      // Take screenshot of network error state
      await expect(page).toHaveScreenshot('network-error-state.png');
    });

    test('should match validation error states', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select component and trigger validation error
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      await page.click('[data-testid="validation-tab"]');
      
      // Try to set invalid validation rules
      await page.fill('[data-testid="min-length-input"]', 'invalid');
      
      // Take screenshot of validation error state
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-error"]')).toHaveScreenshot('validation-error-state.png');
    });
  });
});
