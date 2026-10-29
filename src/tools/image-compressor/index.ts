import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.image-compressor.title'),
  path: '/image-compressor',
  description: t('tools.image-compressor.description'),
  keywords: [
    'image',
    'compress',
    'compressor',
    'jpeg',
    'jpg',
    'png',
    'webp',
    'reduce',
    'size',
    'optimize',
    'batch',
    'картинка',
    'сжать',
    'сжатие',
    'уменьшить',
    'размер',
    'оптимизация',
  ],
  component: () => import('./image-compressor.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Photo')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
});
