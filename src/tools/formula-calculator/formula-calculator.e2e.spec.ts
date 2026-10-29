import { expect, test } from '@playwright/test';

test.describe('Tool - Formula calculator', () => {
  test('Has correct title', async ({ page }) => {
    await page.goto('/formula-calculator');
    await expect(page).toHaveTitle('Formula calculator - IT Tools');
  });

  test("Solves Ohm's law", async ({ page }) => {
    await page.goto('/formula-calculator?calc=ohms-law');
    await expect(page.getByTestId('value-R').locator('input')).toHaveValue('5');
    await expect(page.getByTestId('extra-0').locator('input')).toHaveValue('5');
  });

  test('Solves the voltage drop for the wire area', async ({ page }) => {
    await page.goto('/formula-calculator?calc=voltage-drop');
    await expect(page.getByTestId('value-x').locator('input')).toHaveValue('2.24');

    await page.getByTestId('solve-A').click();
    await expect(page.getByTestId('value-A').locator('input')).toHaveValue('1.5');
    await page.getByTestId('value-x').locator('input').fill('3');
    await page.getByTestId('value-x').locator('input').blur();
    await expect(page.getByTestId('value-A').locator('input')).toHaveValue('1.12');
  });

  test('Takes the diameter of a sphere', async ({ page }) => {
    await page.goto('/formula-calculator?calc=sphere-volume');
    await expect(page.getByTestId('value-v').locator('input')).toHaveValue('4.18879020479');
    await page.getByTestId('diameter-r').locator('input').fill('4');
    await page.getByTestId('diameter-r').locator('input').blur();
    await expect(page.getByTestId('value-r').locator('input')).toHaveValue('2');
    await expect(page.getByTestId('value-v').locator('input')).toHaveValue('33.5103216383');
  });

  test('Solves a formula of the user', async ({ page }) => {
    await page.goto(`/formula-calculator?calc=custom&formula=${encodeURIComponent('x^2 = 16')}`);
    await expect(page.getByTestId('value-x').locator('input')).toHaveValue('4');
    await expect(page.getByText('Other solutions: -4')).toBeVisible();
  });
});
