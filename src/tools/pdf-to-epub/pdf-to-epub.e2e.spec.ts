import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF to EPUB', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-to-epub');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF to EPUB - IT Tools');
  });

  test('Converts a PDF', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample.epub', { timeout: 30_000 });
  });
});
