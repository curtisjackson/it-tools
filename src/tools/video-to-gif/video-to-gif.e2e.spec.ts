import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video to GIF', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-to-gif?w=240&fps=5');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video to GIF - IT Tools');
  });

  test('Converts a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample.gif');
  });
});
