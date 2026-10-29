import { expect, test } from '@playwright/test';

test.describe('Tool - Compression converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compression-converter');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Compression converter - IT Tools');
  });

  test('Compresses text with LZ4', async ({ page }) => {
    await page.locator('textarea').first().fill('The cat sat on the mat.');
    await expect(page.getByTestId('sizes')).toContainText('23 Bytes');
    await page.getByRole('button', { name: 'Hex', exact: true }).last().click();
    await expect(page.getByTestId('area-content')).toHaveText(
      '04224d184070df170000805468652063617420736174206f6e20746865206d61742e00000000',
    );
  });

  test('Decompresses LZMA and hints at another format', async ({ page }) => {
    await page.getByRole('button', { name: 'LZMA', exact: true }).click();
    await page.getByRole('button', { name: 'Decompress', exact: true }).click();
    await page.getByRole('button', { name: 'Hex', exact: true }).first().click();
    await page.locator('textarea').first().fill('5d00008000ffffffffffffffff003198490d4a511823fffffde1a000');
    await expect(page.getByTestId('area-content')).toHaveText('café');

    await page
      .locator('textarea')
      .first()
      .fill('04224d184070df170000805468652063617420736174206f6e20746865206d61742e00000000');
    await expect(page.getByTestId('detected')).toContainText('LZ4');
    await page.getByRole('button', { name: 'Switch to LZ4' }).click();
    await expect(page.getByTestId('area-content')).toHaveText('The cat sat on the mat.');
  });

  test('Compresses text with lz-string', async ({ page }) => {
    await page.getByRole('button', { name: 'LZString', exact: true }).click();
    await page.locator('textarea').first().fill('hello world');
    await expect(page.getByTestId('area-content')).toHaveText('BYUwNmD2AEDukCcwBMg=');
  });
});
