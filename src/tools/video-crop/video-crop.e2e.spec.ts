import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video cropper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-crop');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video cropper - IT Tools');
  });

  test('Crops a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample_cropped.mp4');
  });
});
