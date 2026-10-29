import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF rotator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-rotate');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF rotator - IT Tools');
  });

  test('Rotates a PDF', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_rotated.pdf');
  });
});
