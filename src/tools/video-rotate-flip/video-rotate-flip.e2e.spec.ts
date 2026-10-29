import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video rotator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-rotate-flip');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video rotator - IT Tools');
  });

  test('Processes a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample_rotated.mp4');
  });
});
