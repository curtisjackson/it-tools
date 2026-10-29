import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.images-to-gif.title'),
  path: '/images-to-gif',
  description: t('tools.images-to-gif.description'),
  keywords: ['images', 'gif', 'animation', 'slideshow', 'frames', 'картинки', 'гиф', 'анимация', 'слайдшоу'],
  component: () => import('./images-to-gif.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Photo')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
