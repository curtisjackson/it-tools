import { describe, expect, it } from 'vitest';
import { loadLocaleMessages, translate as t } from '@/plugins/i18n.plugin';
import { tools } from '../index';

describe('_shared locales', () => {
  it('labels the categories added by this fork', async () => {
    await loadLocaleMessages('ru');

    expect(t('tools.categories.video')).toBe('Video');
    expect(t('tools.categories.audio')).toBe('Audio');
    expect(t('tools.categories.video', {}, { locale: 'ru' })).toBe('Видео');
    expect(t('tools.categories.audio', {}, { locale: 'ru' })).toBe('Аудио');
  });

  it('keeps the base category labels', () => {
    expect(t('tools.categories.text')).toBe('Text');
  });

  it('is not registered as a tool', () => {
    expect(tools.some(({ path }) => path.includes('_shared'))).toBe(false);
  });
});
