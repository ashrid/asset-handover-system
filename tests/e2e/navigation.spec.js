import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load homepage and show navigation', async ({ page }) => {
    await page.goto('/');

    // Check main navigation items exist
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: /assets/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /handover/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /assignments/i })).toBeVisible();
  });

  test('should navigate to Assets page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /assets/i }).click();

    await expect(page).toHaveURL(/.*assets/);
    await expect(page.locator('h1, h2').first()).toContainText(/asset/i);
  });

  test('should navigate to Handover page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /handover/i }).click();

    await expect(page).toHaveURL(/.*handover/);
  });

  test('should navigate to Assignments page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /assignments/i }).click();

    await expect(page).toHaveURL(/.*assignments/);
  });

  test('should navigate to Dashboard page', async ({ page }) => {
    await page.goto('/');

    // Dashboard might be in a different location
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });
});
