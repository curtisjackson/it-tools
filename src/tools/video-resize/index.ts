import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-resize.title'),
  path: '/video-resize',
  description: t('tools.video-resize.description'),
  keywords: ['video', 'resize', 'resolution', 'scale', '720p', '1080p', 'видео', 'размер', 'разрешение', 'уменьшить'],
  component: () => import('./video-resize.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Resize')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
