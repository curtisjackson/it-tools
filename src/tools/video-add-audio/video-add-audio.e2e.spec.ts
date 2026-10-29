import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Audio adder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-add-audio');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Audio adder - IT Tools');
  });

  test('Mixes an audio track into a video', async ({ page }) => {
    await page.getByRole('button', { name: 'Mix', exact: true }).click();
    await page.locator('input[type="file"]').first().setInputFiles(fixture('sample.mp4'));
    await expect(page.getByTestId('media-info').first()).toContainText('00:03', { timeout: 30_000 });
    await page.locator('input[type="file"]').last().setInputFiles(fixture('sample.mp3'));
    await page.getByTestId('process').click();
    await expect(page.getByTestId('result-info')).toContainText('sample_with_audio.mp4', { timeout: 90_000 });
  });
});
