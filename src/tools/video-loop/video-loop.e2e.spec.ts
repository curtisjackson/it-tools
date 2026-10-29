import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video looper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-loop');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video looper - IT Tools');
  });

  test('Processes a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample_x3.mp4');
  });
});
