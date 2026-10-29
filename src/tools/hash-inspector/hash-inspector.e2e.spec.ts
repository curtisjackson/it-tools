import { expect, test } from '@playwright/test';

test.describe('Tool - Password hash inspector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hash-inspector');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Password hash inspector - IT Tools');
  });

  test('Parses a bcrypt hash and checks a password', async ({ page }) => {
    await page.getByTestId('hash').fill('$2a$10$qyon0LQCmMxpFFjwWH6Qh.dDdhqntQh./IN0RXCc3XIMILuOYZKgK');
    await expect(page.getByTestId('scheme')).toContainText('bcrypt');
    await page.getByTestId('password').fill('dolphin');
    await page.getByTestId('check').click();
    await expect(page.getByTestId('match')).toContainText('matches');
  });
});
