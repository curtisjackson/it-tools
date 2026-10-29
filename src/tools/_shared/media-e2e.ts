import { fileURLToPath } from 'node:url';
import { type Page, expect } from '@playwright/test';

/** Absolute path of a file of `src/tools/_shared/fixtures`. */
export function fixture(name: string): string {
  return fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
}

/**
 * Uploads fixtures into the tool's file input, waits for the media to be read, runs the tool and waits for the result
 * file. The bundled Chromium cannot decode H.264 and then probes with ffmpeg, so this can take a few seconds.
 */
export async function processMedia(page: Page, files: string[], expectedFileName: string | RegExp): Promise<void> {
  await page.locator('input[type="file"]').first().setInputFiles(files.map(fixture));
  if (files.length === 1) {
    await expect(page.getByTestId('media-info')).toContainText('00:', { timeout: 30_000 });
  }
  await page.getByTestId('process').click();
  await expect(page.getByTestId('result-info')).toContainText(expectedFileName, { timeout: 90_000 });
}
