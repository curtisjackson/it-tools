import { expect, test } from '@playwright/test';

test.describe('Tool - TLS and SSH fingerprints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tls-ssh-fingerprint');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('TLS and SSH fingerprints - IT Tools');
  });

  test('Computes the JA3 of the sample ClientHello', async ({ page }) => {
    await expect(page.getByTestId('fingerprint-JA3').getByTestId('hash').locator('input')).toHaveValue(
      '4826a90ec2daf4f7b4b64cc1c8bd343b',
    );
  });
});
