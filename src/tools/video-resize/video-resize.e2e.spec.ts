import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video resizer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-resize?mode=preset&h=480');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video resizer - IT Tools');
  });

  test('Processes a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample_480p.mp4');
  });
});
