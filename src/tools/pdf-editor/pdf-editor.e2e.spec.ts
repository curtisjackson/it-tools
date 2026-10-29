import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-editor');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF editor - IT Tools');
  });

  test('Opens a PDF and downloads it under its name', async ({ page }) => {
    const outside: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['localhost', '127.0.0.1'].includes(url.hostname) && !['blob:', 'data:'].includes(url.protocol)) {
        outside.push(request.url());
      }
    });

    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    const viewer = page.getByTestId('viewer');
    await expect(viewer.getByText('Annotate', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(viewer.getByText('2', { exact: true }).first()).toBeVisible({ timeout: 30_000 });

    await viewer.getByRole('button', { name: 'Document Menu' }).click();
    const download = page.waitForEvent('download');
    await viewer.getByText('Export', { exact: true }).click();
    expect((await download).suggestedFilename()).toBe('sample.pdf');
    expect(outside).toEqual([]);
  });
});
