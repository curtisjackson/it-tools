import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.video-crop.title'),
  path: '/video-crop',
  description: t('tools.video-crop.description'),
  keywords: [
    'video',
    'crop',
    'cut',
    'frame',
    'aspect ratio',
    'vertical',
    'видео',
    'кадрировать',
    'обрезать края',
    'соотношение',
  ],
  component: () => import('./video-crop.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Crop')),
  createdAt: new Date('2026-10-29'),
  category: 'Video',
  npmPackages: ['@ffmpeg/ffmpeg', 'cropperjs'],
});
