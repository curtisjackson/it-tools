import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-add-audio.title'),
  path: '/video-add-audio',
  description: t('tools.video-add-audio.description'),
  keywords: [
    'video',
    'audio',
    'music',
    'soundtrack',
    'replace',
    'mix',
    'видео',
    'звук',
    'музыка',
    'наложить',
    'заменить',
  ],
  component: () => import('./video-add-audio.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Music')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
