import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Audio speed changer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audio-speed');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio speed changer - IT Tools');
  });

  test('Processes audio', async ({ page }) => {
    await processMedia(page, ['sample.mp3'], 'sample_1.5x.mp3');
  });
});
