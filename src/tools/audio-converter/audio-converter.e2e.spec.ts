import { expect, test } from '@playwright/test';
import { processMedia } from '../_shared/media-e2e';

test.describe('Tool - Audio converter', () => {
  test('Has correct title', async ({ page }) => {
    await page.goto('/audio-converter');
    await expect(page).toHaveTitle('Audio converter - IT Tools');
  });

  test('Converts an MP3 to Opus', async ({ page }) => {
    await page.goto('/audio-converter');
    await page.getByRole('button', { name: 'OPUS', exact: true }).click();
    await processMedia(page, ['sample.mp3'], 'sample.opus');
  });
});
