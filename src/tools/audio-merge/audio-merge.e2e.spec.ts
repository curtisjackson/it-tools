import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Audio merger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audio-merge');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio merger - IT Tools');
  });

  test('Processes audio', async ({ page }) => {
    await processMedia(page, ['sample.mp3', 'sample.mp3'], 'sample_merged.mp3');
  });
});
