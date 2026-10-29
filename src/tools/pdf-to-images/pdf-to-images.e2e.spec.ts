import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF to images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-to-images');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF to images - IT Tools');
  });

  test('Renders every page', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-item')).toHaveCount(2, { timeout: 30_000 });
    await expect(page.getByTestId('result-item').first()).toContainText('sample_page1.png');
  });
});
