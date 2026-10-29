import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-merge.title'),
  path: '/video-merge',
  description: t('tools.video-merge.description'),
  keywords: ['video', 'merge', 'join', 'concatenate', 'combine', 'видео', 'склеить', 'объединить', 'соединить'],
  component: () => import('./video-merge.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Stack2')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
