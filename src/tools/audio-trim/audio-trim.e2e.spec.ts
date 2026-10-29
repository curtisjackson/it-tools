import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Audio trimmer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audio-trim');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio trimmer - IT Tools');
  });

  test('Processes audio', async ({ page }) => {
    await processMedia(page, ['sample.mp3'], 'sample_trimmed.mp3');
  });
});
