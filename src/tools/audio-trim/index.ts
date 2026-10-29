import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.audio-trim.title'),
  path: '/audio-trim',
  description: t('tools.audio-trim.description'),
  keywords: ['audio', 'trim', 'cut', 'ringtone', 'clip', 'mp3', 'аудио', 'обрезать', 'вырезать', 'рингтон'],
  component: () => import('./audio-trim.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Scissors')),
  createdAt: new Date('2026-10-29'),
  category: 'Audio',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
