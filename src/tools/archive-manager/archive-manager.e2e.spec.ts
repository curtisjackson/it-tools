import { expect, test } from '@playwright/test';
import { LONG_PATH, TAR_GZ, ZIP_CRYPTO } from './archive-manager.vectors';

test.describe('Tool - ZIP / TAR archives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/archive-manager');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('ZIP / TAR archives - IT Tools');
  });

  test('Opens an encrypted zip with its password', async ({ page }) => {
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'secret.zip',
        mimeType: 'application/zip',
        buffer: Buffer.from(ZIP_CRYPTO, 'base64'),
      });
    await expect(page.getByTestId('summary')).toHaveText('ZIP: 2 files, 19 Bytes');
    await page.getByTestId('password').locator('input').fill('secret');
    await page.getByTestId('preview').nth(1).click();
    await expect(page.getByTestId('area-content')).toHaveText('привет\n');
  });

  test('Lists a tar.gz with long names and links', async ({ page }) => {
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'files.tar.gz',
        mimeType: 'application/gzip',
        buffer: Buffer.from(TAR_GZ.gnu, 'base64'),
      });
    await expect(page.getByTestId('entry')).toHaveCount(5);
    await expect(page.getByTestId('entry').nth(1)).toContainText('link.txt → hello.txt');
    await expect(page.getByTestId('entry').nth(4)).toContainText(LONG_PATH);
  });

  test('Creates a tar archive', async ({ page }) => {
    await page.getByText('Create', { exact: true }).click();
    await page.getByRole('button', { name: '.tar', exact: true }).click();
    await page
      .locator('input[type="file"]')
      .last()
      .setInputFiles([
        { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('a') },
        { name: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('b') },
      ]);
    await page.getByTestId('process').click();
    await expect(page.getByText('archive.tar · 10 KB')).toBeVisible();
  });
});
