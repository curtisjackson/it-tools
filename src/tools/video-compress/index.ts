import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-compress.title'),
  path: '/video-compress',
  description: t('tools.video-compress.description'),
  keywords: ['video', 'compress', 'smaller', 'reduce', 'size', 'mp4', 'видео', 'сжать', 'уменьшить', 'размер файла'],
  component: () => import('./video-compress.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/FileZip')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
