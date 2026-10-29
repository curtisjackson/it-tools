import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Images to PDF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/images-to-pdf');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Images to PDF - IT Tools');
  });

  test('Builds a PDF from images', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles([fixture('sample.png'), fixture('sample.gif')]);
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('images.pdf');
  });
});
