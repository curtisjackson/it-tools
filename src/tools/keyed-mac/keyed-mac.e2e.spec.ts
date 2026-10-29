import { expect, test } from '@playwright/test';

test.describe('Tool - CMAC and Ascon-Mac', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/keyed-mac?algo=cmac-aes&keyfmt=hex');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('CMAC and Ascon-Mac - IT Tools');
  });

  test('Computes the CMAC of the NIST example', async ({ page }) => {
    await expect(page.getByTestId('mac-hex').locator('input')).toHaveValue('070a16b46b4d4144f79bdd9dd04a287c');
  });

  test('Reports a key of the wrong size', async ({ page }) => {
    await page.getByTestId('key').fill('0011');
    await expect(page.getByTestId('error')).toContainText('not 2');
  });
});
