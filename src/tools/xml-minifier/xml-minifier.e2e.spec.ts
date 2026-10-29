import { expect, test } from '@playwright/test';

test.describe('Tool - XML minifier', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/xml-minifier');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('XML minifier - IT Tools');
  });

  test('Minifies XML', async ({ page }) => {
    await page.getByTestId('input').fill('<a>\n  <!-- note -->\n  <b>text</b>\n</a>');
    await expect(page.getByTestId('area-content')).toContainText('<a><b>text</b></a>');
  });
});
