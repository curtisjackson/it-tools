import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Color replacer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-replace-color');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Color replacer - IT Tools');
  });

  test('Processes an image', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    await page.getByTestId('pixel-picker').click({ position: { x: 2, y: 2 } });
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_recolored.png');
  });
});
