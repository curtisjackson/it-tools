import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Audio extractor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-extract-audio');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio extractor - IT Tools');
  });

  test('Extracts the audio as is', async ({ page }) => {
    await processMedia(page, ['sample.mp4'], 'sample.m4a');
  });
});
