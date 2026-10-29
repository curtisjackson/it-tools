import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-speed.title'),
  path: '/video-speed',
  description: t('tools.video-speed.description'),
  keywords: ['video', 'speed', 'fast', 'slow motion', 'timelapse', 'видео', 'скорость', 'ускорить', 'замедлить'],
  component: () => import('./video-speed.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/PlayerTrackNext')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
