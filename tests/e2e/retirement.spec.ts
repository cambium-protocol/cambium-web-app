import { test, expect } from '@playwright/test';

test.describe('Retirement flow', () => {
  test('connects wallet, views project, and retires credits', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await expect(page.locator('text=Cambium Protocol')).toBeVisible();

    await page.click('text=Projects');
    await expect(page).toHaveURL(/\/projects/);

    await page.click('text=Trade');
    await expect(page).toHaveURL(/\/trade/);

    await page.click('text=Retire');
    await expect(page).toHaveURL(/\/retire/);

    await expect(page.locator('text=Retire Credits')).toBeVisible();
    await expect(page.locator('text=Coming Soon')).toBeVisible();
  });
});
