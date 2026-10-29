import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Image opacity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-opacity?mode=radial');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Image opacity - IT Tools');
  });

  test('Fades an image', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_opacity.png');
  });
});
