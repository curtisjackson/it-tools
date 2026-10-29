import { expect, test } from '@playwright/test';

test.describe('Tool - PHP serialize converter', () => {
  test('Has correct title', async ({ page }) => {
    await page.goto('/php-serialize-converter');
    await expect(page).toHaveTitle('PHP serialize converter - IT Tools');
  });

  test('Unserializes to JSON', async ({ page }) => {
    await page.goto('/php-serialize-converter?mode=unserialize');
    await page.getByTestId('input').fill('a:2:{i:0;s:8:"тест";i:1;b:1;}');
    await expect(page.getByTestId('area-content')).toContainText('"тест"');
    await expect(page.getByTestId('area-content')).toContainText('true');
  });

  test('Serializes JSON', async ({ page }) => {
    await page.goto('/php-serialize-converter?mode=serialize');
    await page.getByTestId('input').fill('{"a": "тест"}');
    await expect(page.getByTestId('area-content')).toContainText('a:1:{s:1:"a";s:8:"тест";}');
  });
});
