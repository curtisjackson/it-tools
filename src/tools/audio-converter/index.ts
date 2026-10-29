import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.audio-converter.title'),
  path: '/audio-converter',
  description: t('tools.audio-converter.description'),
  keywords: ['audio', 'convert', 'mp3', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'аудио', 'конвертер', 'музыка', 'звук'],
  component: () => import('./audio-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Headphones')),
  createdAt: new Date('2026-10-29'),
  category: 'Audio',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
