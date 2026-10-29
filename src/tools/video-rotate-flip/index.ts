import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-rotate-flip.title'),
  path: '/video-rotate-flip',
  description: t('tools.video-rotate-flip.description'),
  keywords: ['video', 'rotate', 'flip', 'mirror', 'orientation', 'видео', 'повернуть', 'отразить', 'зеркально'],
  component: () => import('./video-rotate-flip.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Rotate')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
