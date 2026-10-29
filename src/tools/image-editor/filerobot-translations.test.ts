import { describe, expect, it } from 'vitest';
// @ts-expect-error: plain JS module of the editor, without types
import english from 'react-filerobot-image-editor/lib/context/defaultTranslations';
import { filerobotRussian } from './filerobot-translations';

describe('filerobot-translations', () => {
  it('translates every string of the editor', () => {
    expect(Object.keys(filerobotRussian).sort()).toEqual(Object.keys(english as Record<string, string>).sort());
  });
});
