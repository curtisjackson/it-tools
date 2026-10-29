import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-to-gif.title'),
  path: '/video-to-gif',
  description: t('tools.video-to-gif.description'),
  keywords: ['video', 'gif', 'animated', 'animation', 'convert', 'видео', 'гиф', 'анимация', 'конвертировать'],
  component: () => import('./video-to-gif.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Movie')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
