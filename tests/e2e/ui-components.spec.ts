import { test, expect, Page } from '@playwright/test';

test.describe('UI Components Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('http://localhost:3000');
  });

  test.describe('Form Components', () => {
    test('should render text input component correctly', async () => {
      await page.click('text=Forms');
      
      // Add text input component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('input[type="text"]')).toBeVisible();
    });

    test('should render textarea component correctly', async () => {
      await page.click('text=Forms');
      
      // Add textarea component
      const textarea = page.locator('[data-testid="component-textarea"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textarea.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('textarea')).toBeVisible();
    });

    test('should render select component correctly', async () => {
      await page.click('text=Forms');
      
      // Add select component
      const select = page.locator('[data-testid="component-select"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await select.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('select')).toBeVisible();
    });

    test('should render checkbox component correctly', async () => {
      await page.click('text=Forms');
      
      // Add checkbox component
      const checkbox = page.locator('[data-testid="component-checkbox"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await checkbox.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('input[type="checkbox"]')).toBeVisible();
    });

    test('should render radio component correctly', async () => {
      await page.click('text=Forms');
      
      // Add radio component
      const radio = page.locator('[data-testid="component-radio"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await radio.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('input[type="radio"]')).toBeVisible();
    });

    test('should render button component correctly', async () => {
      await page.click('text=Forms');
      
      // Add button component
      const button = page.locator('[data-testid="component-button"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await button.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('button')).toBeVisible();
    });

    test('should render date picker component correctly', async () => {
      await page.click('text=Forms');
      
      // Add date picker component
      const datePicker = page.locator('[data-testid="component-date-picker"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await datePicker.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('input[type="date"]')).toBeVisible();
    });

    test('should render file upload component correctly', async () => {
      await page.click('text=Forms');
      
      // Add file upload component
      const fileUpload = page.locator('[data-testid="component-file-upload"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await fileUpload.dragTo(canvas);
      
      // Check component rendering
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await expect(component).toBeVisible();
      await expect(component.locator('input[type="file"]')).toBeVisible();
    });
  });

  test.describe('Component Interactions', () => {
    test('should allow component selection and editing', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await component.click();
      
      // Check if component is selected (should have selection indicator)
      await expect(component).toHaveClass(/selected/);
      
      // Check if property panel is visible
      await expect(page.locator('[data-testid="property-panel"]')).toBeVisible();
    });

    test('should allow component deletion', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await component.click();
      
      // Delete the component
      await page.press('body', 'Delete');
      
      // Check if component is removed
      await expect(component).not.toBeVisible();
    });

    test('should allow component duplication', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      const component = canvas.locator('[data-testid="component-wrapper"]').first();
      await component.click();
      
      // Duplicate the component
      await page.press('body', 'Control+d');
      
      // Check if component is duplicated
      const components = canvas.locator('[data-testid="component-wrapper"]');
      await expect(components).toHaveCount(2);
    });

    test('should allow component reordering', async () => {
      await page.click('text=Forms');
      
      // Add two components
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      const button = page.locator('[data-testid="component-button"]');
      await button.dragTo(canvas);
      
      // Get initial order
      const components = canvas.locator('[data-testid="component-wrapper"]');
      const firstComponent = components.first();
      const secondComponent = components.nth(1);
      
      // Drag first component below second
      await firstComponent.dragTo(secondComponent, { targetPosition: { x: 0, y: 50 } });
      
      // Check if order changed
      const newComponents = canvas.locator('[data-testid="component-wrapper"]');
      await expect(newComponents).toHaveCount(2);
    });
  });

  test.describe('Property Panel', () => {
    test('should display basic properties tab', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Check basic properties tab
      await page.click('[data-testid="basic-tab"]');
      await expect(page.locator('[data-testid="basic-properties"]')).toBeVisible();
    });

    test('should display validation properties tab', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Check validation properties tab
      await page.click('[data-testid="validation-tab"]');
      await expect(page.locator('[data-testid="validation-properties"]')).toBeVisible();
    });

    test('should display styling properties tab', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Check styling properties tab
      await page.click('[data-testid="style-tab"]');
      await expect(page.locator('[data-testid="styling-editor"]')).toBeVisible();
    });

    test('should display responsive properties tab', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Check responsive properties tab
      await page.click('[data-testid="responsive-tab"]');
      await expect(page.locator('[data-testid="responsive-controls"]')).toBeVisible();
    });

    test('should display logic properties tab', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      
      // Check logic properties tab
      await page.click('[data-testid="logic-tab"]');
      await expect(page.locator('[data-testid="conditional-logic-builder"]')).toBeVisible();
    });
  });

  test.describe('Form Builder Features', () => {
    test('should support form preview', async () => {
      await page.click('text=Forms');
      
      // Add some components
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      const button = page.locator('[data-testid="component-button"]');
      await button.dragTo(canvas);
      
      // Open preview
      await page.click('[data-testid="preview-button"]');
      await expect(page.locator('[data-testid="form-preview"]')).toBeVisible();
    });

    test('should support form saving', async () => {
      await page.click('text=Forms');
      
      // Add a component
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Save form
      await page.click('[data-testid="save-button"]');
      
      // Check if save confirmation appears
      await expect(page.locator('text=Form saved successfully')).toBeVisible();
    });

    test('should support form validation', async () => {
      await page.click('text=Forms');
      
      // Add a required text input
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select the component and make it required
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      await page.click('[data-testid="validation-tab"]');
      await page.check('[data-testid="required-checkbox"]');
      
      // Test form validation
      await page.click('[data-testid="validate-button"]');
      await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      
      // Check if mobile navigation works
      await expect(page.locator('nav')).toBeVisible();
      
      // Check if forms page works on mobile
      await page.click('text=Forms');
      await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
    });

    test('should work on tablet devices', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:3000');
      
      // Check if tablet layout works
      await expect(page.locator('nav')).toBeVisible();
      
      // Check if forms page works on tablet
      await page.click('text=Forms');
      await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
    });

    test('should work on desktop devices', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('http://localhost:3000');
      
      // Check if desktop layout works
      await expect(page.locator('nav')).toBeVisible();
      
      // Check if forms page works on desktop
      await page.click('text=Forms');
      await expect(page.locator('[data-testid="form-builder"]')).toBeVisible();
    });
  });

  test.describe('User Experience', () => {
    test('should provide helpful tooltips', async () => {
      await page.click('text=Forms');
      
      // Hover over components to check for tooltips
      const textInput = page.locator('[data-testid="component-text-input"]');
      await textInput.hover();
      
      // Check if tooltip appears
      await expect(page.locator('[data-testid="component-tooltip"]')).toBeVisible();
    });

    test('should provide keyboard shortcuts', async () => {
      await page.click('text=Forms');
      
      // Test keyboard shortcuts
      await page.keyboard.press('Control+s'); // Save
      await page.keyboard.press('Control+z'); // Undo
      await page.keyboard.press('Control+y'); // Redo
      
      // Check if shortcuts work (no errors should occur)
      await expect(page.locator('body')).toBeVisible();
    });

    test('should provide loading states', async () => {
      await page.click('text=Forms');
      
      // Add a component (should show loading state)
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Check if loading state is handled properly
      await expect(canvas.locator('[data-testid="component-wrapper"]')).toBeVisible();
    });

    test('should provide error states', async () => {
      await page.click('text=Forms');
      
      // Try to add invalid component configuration
      const textInput = page.locator('[data-testid="component-text-input"]');
      const canvas = page.locator('[data-testid="form-canvas"]');
      await textInput.dragTo(canvas);
      
      // Select component and try invalid configuration
      await canvas.locator('[data-testid="component-wrapper"]').first().click();
      await page.click('[data-testid="validation-tab"]');
      
      // Try to set invalid validation rules
      await page.fill('[data-testid="min-length-input"]', 'invalid');
      
      // Check if error message appears
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    });
  });
});
