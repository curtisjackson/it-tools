import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Image compressor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-compressor');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Image compressor - IT Tools');
  });

  test('Compresses an image to WebP', async ({ page }) => {
    await page.getByRole('button', { name: 'WebP' }).click();
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample.webp');
  });
});
