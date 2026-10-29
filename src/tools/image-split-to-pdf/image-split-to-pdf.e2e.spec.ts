import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Image splitter to PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-split-to-pdf');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Image splitter to PDF - IT Tools');
  });

  test('Splits an image into a PDF', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample.pdf', { timeout: 30_000 });
  });
});
