import { expect, test } from '@playwright/test';
import { fixture } from '../_shared/media-e2e';

test.describe('Tool - PDF form builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdf-form-builder');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('PDF form builder - IT Tools');
  });

  test('Places fields and downloads the form', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(fixture('sample.pdf'));
    const firstPage = page.getByTestId('page-1').locator('img');
    await expect(page.getByTestId('page-2')).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('tool-text').click();
    await firstPage.click({ position: { x: 120, y: 260 } });
    await page.getByTestId('tool-checkbox').click();
    await firstPage.click({ position: { x: 450, y: 80 } });
    await expect(page.getByTestId('field-count')).toHaveText('Fields: 2');

    await page.getByTestId('field-text1').click();
    await page.getByTestId('field-name').locator('input').fill('full_name');
    const field = page.getByTestId('field-full_name');
    await expect(field).toBeVisible();

    // Moved with the mouse, then resized by its corner.
    const before = (await field.boundingBox())!;
    await page.mouse.move(before.x + 10, before.y + 5);
    await page.mouse.down();
    await page.mouse.move(before.x + 60, before.y + 45, { steps: 5 });
    await page.mouse.up();
    const moved = (await field.boundingBox())!;
    expect(Math.round(moved.x - before.x)).toBe(50);
    expect(Math.round(moved.y - before.y)).toBe(40);
    await page.mouse.move(moved.x + moved.width + 2, moved.y + moved.height + 2);
    await page.mouse.down();
    await page.mouse.move(moved.x + moved.width + 32, moved.y + moved.height + 12, { steps: 5 });
    await page.mouse.up();
    const resized = (await field.boundingBox())!;
    expect(Math.round(resized.width - moved.width)).toBe(30);
    expect(Math.round(resized.height - moved.height)).toBe(10);

    await page.getByTestId('duplicate').click();
    await expect(page.getByTestId('field-count')).toHaveText('Fields: 3');
    await page.getByTestId('delete').click();
    await expect(page.getByTestId('field-count')).toHaveText('Fields: 2');

    const download = page.waitForEvent('download');
    await page.getByTestId('download').click();
    expect((await download).suggestedFilename()).toBe('sample_form.pdf');
  });
});
