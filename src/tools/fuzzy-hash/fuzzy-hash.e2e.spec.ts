import { expect, test } from '@playwright/test';

test.describe('Tool - Fuzzy hashes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fuzzy-hash');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Fuzzy hashes (SSDEEP) - IT Tools');
  });

  test('Hashes a text and compares two hashes', async ({ page }) => {
    await page.locator('textarea').first().fill('shotgun tyranny snugly');
    await expect(page.getByTestId('ssdeep').locator('input')).toHaveValue('3:DLIXzMQCJc:XERKc');
    await page.getByTestId('hash1').fill('3:DLIXzMQCJc:XERKc');
    await page.getByTestId('hash2').fill('3:DLIXzMQCJc:XERKc');
    await expect(page.getByTestId('score')).toContainText('100');
  });
});
