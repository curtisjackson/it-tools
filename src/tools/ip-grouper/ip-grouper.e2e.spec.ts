import { expect, test } from '@playwright/test';

test.describe('Tool - IP grouper', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ip-grouper?v4=24&v6=64&unique=true&subnets=false&counts=true');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('IP address grouper - IT Tools');
  });

  test('Groups addresses by subnet', async ({ page }) => {
    await page.getByTestId('input').fill('10.0.0.2\n10.0.0.1\n10.0.1.9\nnot-an-ip');
    await expect(page.getByTestId('output')).toContainText('10.0.0.0/24 (2)');
    await expect(page.getByTestId('output')).toContainText('10.0.1.0/24 (1)');
    await expect(page.getByTestId('invalid')).toContainText('not-an-ip');
  });
});
