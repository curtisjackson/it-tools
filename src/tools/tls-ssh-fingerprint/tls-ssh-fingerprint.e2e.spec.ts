import { expect, test } from '@playwright/test';

test.describe('Tool - TLS and SSH fingerprints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tls-ssh-fingerprint');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('TLS and SSH fingerprints - IT Tools');
  });

  test('Computes the fingerprints of the sample ClientHello', async ({ page }) => {
    const hash = (name: string) => page.getByTestId(`fingerprint-${name}`).getByTestId('hash').locator('input');
    await expect(hash('JA4')).toHaveValue('t13d1516h2_8daaf6152771_e5627efa2ab1');
    await expect(hash('JA3')).toHaveValue(/^[0-9a-f]{32}$/);
  });
});
