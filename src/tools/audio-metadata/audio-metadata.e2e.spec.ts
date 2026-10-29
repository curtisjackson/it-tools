import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Audio metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/audio-metadata');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio metadata - IT Tools');
  });

  test('Reads the format of an MP3', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.mp3'));
    await expect(page.getByRole('cell', { name: 'MPEG 1 Layer 3' })).toBeVisible();
  });
});
