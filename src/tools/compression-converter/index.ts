import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.compression-converter.title'),
  path: '/compression-converter',
  description: t('tools.compression-converter.description'),
  keywords: [
    'compression',
    'compress',
    'decompress',
    'lz-string',
    'lzstring',
    'lz4',
    'lzma',
    '7z',
    'сжатие',
    'распаковка',
    'архив',
  ],
  component: () => import('./compression-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsMinimize')),
  createdAt: new Date('2026-10-29'),
  category: 'Converters',
  npmPackages: ['lz-string', 'lz4js'],
});
