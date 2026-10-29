import { expect, test } from '@playwright/test';

test.describe('Tool - HTTP response cleaner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/http-response-cleaner?dechunk=auto&decompress=true');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('HTTP response cleaner - IT Tools');
  });

  test('Strips the headers and dechunks the body', async ({ page }) => {
    await expect(page.getByTestId('start-line')).toHaveText('HTTP/1.1 200 OK');
    await expect(page.getByTestId('body')).toContainText('MozillaDeveloperNetwork');
    await expect(page.getByTestId('step')).toHaveCount(1);
  });
});
