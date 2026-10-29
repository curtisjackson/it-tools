import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-loop.title'),
  path: '/video-loop',
  description: t('tools.video-loop.description'),
  keywords: ['video', 'loop', 'repeat', 'cycle', 'видео', 'зациклить', 'повторить', 'цикл'],
  component: () => import('./video-loop.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Repeat')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
