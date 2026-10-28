import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const sampleVideo = fileURLToPath(new URL('../_shared/fixtures/sample.mp4', import.meta.url));

test.describe('Tool - Video trimmer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video-trim');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Video trimmer - IT Tools');
  });

  for (const mode of ['Fast', 'Frame-accurate']) {
    test(`Trims a video in ${mode} mode`, async ({ page }) => {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.locator('input[type="file"]').setInputFiles(sampleVideo);
      await expect(page.getByTestId('media-info')).toContainText('00:03.000');

      await page.getByTestId('trim-start').locator('input').fill('1');
      await page.getByTestId('trim-end').locator('input').fill('2');
      await page.getByRole('button', { name: 'Trim video' }).click();

      await expect(page.getByTestId('result-info')).toContainText('sample_trimmed.mp4', { timeout: 60_000 });
      await expect(page.locator('video')).toHaveCount(2);
    });
  }
});
