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

  test('Compresses with Bzip2 and reads every stream back', async ({ page }) => {
    await page.getByRole('button', { name: 'Bzip2', exact: true }).click();
    await page.locator('textarea').first().fill('The cat sat on the mat.');
    await expect(page.getByTestId('sizes')).toContainText('23 Bytes');
    await page.getByRole('button', { name: 'Hex', exact: true }).last().click();
    await expect(page.getByTestId('area-content')).toHaveText(
      '425a6839314159265359b218ed630000031380400104002a438c00200021a68261a840d0342821a65675f0db844263f177245385090b218ed630',
    );

    await page.getByRole('button', { name: 'Decompress', exact: true }).click();
    await page.getByRole('button', { name: 'Hex', exact: true }).first().click();
    await page
      .locator('textarea')
      .first()
      .fill(
        '425a6839314159265359b218ed630000031380400104002a438c00200021a68261a840d0342821a65675f0db844263f177245385090b218ed630425a6839314159265359342f46cf00000015804001200006c184002000221a32681003004a2c3dee6bc5dc914e14240d0bd1b3c0',
      );
    await expect(page.getByTestId('area-content')).toHaveText('The cat sat on the mat. And the dog.');
  });

  test('Compresses text with lz-string', async ({ page }) => {
    await page.getByRole('button', { name: 'LZString', exact: true }).click();
    await page.locator('textarea').first().fill('hello world');
    await expect(page.getByTestId('area-content')).toHaveText('BYUwNmD2AEDukCcwBMg=');
  });
});
