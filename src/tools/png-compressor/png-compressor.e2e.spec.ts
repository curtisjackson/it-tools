import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PNG compressor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/png-compressor');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PNG compressor - IT Tools');
  });

  test('Compresses a PNG', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample.png');
  });
});
