import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Images to GIF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/images-to-gif');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Images to GIF - IT Tools');
  });

  test('Builds a GIF from images', async ({ page }) => {
    await processMedia(page, ['sample.png', 'sample.png'], 'animation.gif');
  });
});
