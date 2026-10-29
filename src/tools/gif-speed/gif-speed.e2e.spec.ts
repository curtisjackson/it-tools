import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - GIF speed changer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gif-speed');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('GIF speed changer - IT Tools');
  });

  test('Speeds up a GIF', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.gif'));
    await expect(page.getByTestId('media-info')).toContainText('80×60');
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_2x.gif', { timeout: 60_000 });
  });
});
