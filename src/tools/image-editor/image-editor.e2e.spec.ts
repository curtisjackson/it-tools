import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - Image editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/image-editor');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Image editor - IT Tools');
  });

  test('Opens an image and saves it', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.png'));
    const editor = page.getByTestId('editor');
    await expect(editor.getByText('Finetune')).toBeVisible({ timeout: 30_000 });

    await editor.getByRole('button', { name: 'Save', exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save', exact: true }).last().click();
    expect((await download).suggestedFilename()).toBe('sample-edited.png');

    await page.getByTestId('close').click();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });
});
