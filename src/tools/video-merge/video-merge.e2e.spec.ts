import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video merger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-merge');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video merger - IT Tools');
  });

  test('Merges two videos', async ({ page }) => {
    await processMedia(page, ['sample.mp4', 'sample.mp4'], 'sample_merged.mp4');
  });
});
