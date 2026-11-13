import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test.describe('Tool - WHOIS (RDAP)', () => {
  test.beforeEach(async ({ page }) => {
    // The registries are not queried: rdap.org answers with saved responses.
    await page.route('https://rdap.org/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/ip/8.8.8.8') {
        await route.fulfill({
          status: 200,
          contentType: 'application/rdap+json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: fixture('ip-arin.json'),
        });
      } else if (path === '/domain/example.com') {
        await route.fulfill({
          status: 200,
          contentType: 'application/rdap+json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: fixture('domain-verisign.json'),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/rdap+json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ errorCode: 404, title: 'No RDAP service is available for this resource' }),
        });
      }
    });
  });

  test('Has correct title', async ({ page }) => {
    await page.goto('/rdap-whois');
    await expect(page).toHaveTitle('WHOIS (RDAP) - IT Tools');
  });

  test('Looks up an IP address', async ({ page }) => {
    await page.goto('/rdap-whois?q=8.8.8.8');
    const summary = page.getByTestId('summary');
    await expect(summary).toContainText('8.8.8.0 – 8.8.8.255');
    await expect(summary).toContainText('8.8.8.0/24');
    await expect(summary).toContainText('network-abuse@google.com');
    await expect(page.getByTestId('contacts')).toContainText('ABUSE5250-ARIN');
  });

  test('Looks up the domain of a URL typed in', async ({ page }) => {
    await page.goto('/rdap-whois');
    await page.getByTestId('query').locator('input').fill('https://example.com/page');
    await page.getByTestId('lookup').click();
    await expect(page.getByTestId('summary')).toContainText('elliott.ns.cloudflare.com');
  });

  test('Explains a zone without RDAP', async ({ page }) => {
    await page.goto('/rdap-whois?q=yandex.ru');
    await expect(page.getByTestId('error')).toContainText('no RDAP service');
    await expect(page.getByTestId('error').getByRole('link')).toHaveAttribute(
      'href',
      'https://www.whois.com/whois/yandex.ru',
    );
  });
});
