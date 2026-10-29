import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Video speed changer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-speed');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video speed changer - IT Tools');
  });

  test('Processes a video', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample_2x.mp4');
  });
});
