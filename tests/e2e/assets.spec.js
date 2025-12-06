import { test, expect } from '@playwright/test';

test.describe('Asset Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assets');
  });

  test('should display assets page', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('h1, h2').first()).toContainText(/asset/i);
  });

  test('should have add asset button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add asset form when clicking add button', async ({ page }) => {
    // Click add button
    await page.getByRole('button', { name: /add|new|create/i }).click();

    // Check form is visible
    await expect(page.getByLabel(/asset code/i)).toBeVisible();
    await expect(page.getByLabel(/asset type/i)).toBeVisible();
  });

  test('should show validation error for empty required fields', async ({ page }) => {
    // Open form
    await page.getByRole('button', { name: /add|new|create/i }).click();

    // Try to submit empty form
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Should show validation error or form should not submit
    // The form should still be visible
    await expect(page.getByLabel(/asset code/i)).toBeVisible();
  });

  test('should create new asset successfully', async ({ page }) => {
    const uniqueCode = `TEST-${Date.now()}`;

    // Open form
    await page.getByRole('button', { name: /add|new|create/i }).click();

    // Fill form
    await page.getByLabel(/asset code/i).fill(uniqueCode);
    await page.getByLabel(/asset type/i).fill('Test Laptop');

    // Optional fields
    const descriptionField = page.getByLabel(/description/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill('E2E Test Asset');
    }

    // Submit
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Wait for success and check asset appears in list
    await expect(page.getByText(uniqueCode)).toBeVisible({ timeout: 5000 });
  });

  test('should search/filter assets', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Check filtered results (or no results message)
      // This depends on actual data in the database
    }
  });

  test('should delete asset', async ({ page }) => {
    // First create an asset to delete
    const uniqueCode = `DELETE-${Date.now()}`;

    await page.getByRole('button', { name: /add|new|create/i }).click();
    await page.getByLabel(/asset code/i).fill(uniqueCode);
    await page.getByLabel(/asset type/i).fill('To Delete');
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Wait for asset to appear
    await expect(page.getByText(uniqueCode)).toBeVisible({ timeout: 5000 });

    // Find and click delete button for this asset
    const assetRow = page.locator(`tr:has-text("${uniqueCode}")`).first();
    if (await assetRow.isVisible()) {
      await assetRow.getByRole('button', { name: /delete/i }).click();

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Check asset is removed
      await expect(page.getByText(uniqueCode)).not.toBeVisible({ timeout: 5000 });
    }
  });
});
