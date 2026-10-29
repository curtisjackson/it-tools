import { expect, test } from '@playwright/test';

test.describe('Tool - BSON converter', () => {
  test('Has correct title', async ({ page }) => {
    await page.goto('/bson-converter');
    await expect(page).toHaveTitle('BSON converter - IT Tools');
  });

  test('Deserializes hex BSON', async ({ page }) => {
    await page.goto('/bson-converter?mode=deserialize');
    await expect(page.getByTestId('json-output')).toContainText('"hello": "world"');
  });

  test('Serializes JSON', async ({ page }) => {
    await page.goto('/bson-converter?mode=serialize&out=hex');
    await page.getByTestId('json-input').fill('{"hello":"world"}');
    await expect(page.getByTestId('bson-output')).toContainText('160000000268656c6c6f0006000000776f726c640000');
    await expect(page.getByTestId('bson-size')).toContainText('22');
  });
});
