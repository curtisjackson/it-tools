import { expect, test } from '@playwright/test';

test.describe('Tool - Windows password hashes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/windows-password-hashes');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('NT and LM hashes - IT Tools');
  });

  test('Computes the NT and LM hashes', async ({ page }) => {
    await page.getByTestId('password').fill('password');
    await expect(page.getByTestId('nt').locator('input')).toHaveValue('8846F7EAEE8FB117AD06BDD830B7586C');
    await expect(page.getByTestId('lm').locator('input')).toHaveValue('E52CAC67419A9A224A3B108F3FA6CB6D');
  });
});
