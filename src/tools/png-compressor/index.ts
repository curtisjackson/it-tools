import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.png-compressor.title'),
  path: '/png-compressor',
  description: t('tools.png-compressor.description'),
  keywords: [
    'png',
    'compress',
    'compressor',
    'palette',
    'quantize',
    'indexed',
    'optimize',
    'reduce',
    'size',
    'dithering',
    'сжать',
    'сжатие',
    'палитра',
    'оптимизация',
    'размер',
  ],
  component: () => import('./png-compressor.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/FileZip')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
});
