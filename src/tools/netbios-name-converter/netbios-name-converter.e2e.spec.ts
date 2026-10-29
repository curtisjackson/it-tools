import { expect, test } from '@playwright/test';

test.describe('Tool - NetBIOS name converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/netbios-name-converter');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('NetBIOS name converter - IT Tools');
  });

  test('Encodes and decodes a name', async ({ page }) => {
    await page.getByTestId('name').fill('fred');
    await expect(page.getByTestId('encoded').locator('input')).toHaveValue('EGFCEFEECACACACACACACACACACACACA');
    await page.getByTestId('encoded-input').fill('EGFCEFEECACACACACACACACACACACACA');
    await expect(page.getByTestId('decoded').locator('input')).toHaveValue('FRED');
  });
});
