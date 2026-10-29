import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF image extractor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-extract-images');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF image extractor - IT Tools');
  });

  test('Extracts the embedded image', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_page1_image1.png', { timeout: 30_000 });
  });
});
