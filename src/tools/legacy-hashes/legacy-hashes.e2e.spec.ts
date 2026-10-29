import { expect, test } from '@playwright/test';

test.describe('Tool - Rare hashes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/legacy-hashes?enc=hex');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Rare hashes - IT Tools');
  });

  test('Hashes the sample text', async ({ page }) => {
    await expect(page.getByTestId('hash-md2').locator('input')).toHaveValue('1c8f1e6a94aaa7145210bf90bb52871a');
    await expect(page.getByTestId('hash-sha0').locator('input')).toHaveValue(
      '5a5588f0407c6ae9a988758e76965f841b299229',
    );
  });
});
