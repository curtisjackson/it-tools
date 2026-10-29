import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-trim.title'),
  path: '/video-trim',
  description: t('tools.video-trim.description'),
  keywords: ['video', 'trim', 'cut', 'clip', 'ffmpeg', 'видео', 'обрезать', 'вырезать', 'фрагмент'],
  component: () => import('./video-trim.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Scissors')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
