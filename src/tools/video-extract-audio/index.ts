import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-extract-audio.title'),
  path: '/video-extract-audio',
  description: t('tools.video-extract-audio.description'),
  keywords: ['video', 'audio', 'extract', 'soundtrack', 'mp3', 'видео', 'звук', 'извлечь', 'достать', 'дорожка'],
  component: () => import('./video-extract-audio.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Music')),
  createdAt: new Date('2026-10-29'),
  category: 'Audio',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
