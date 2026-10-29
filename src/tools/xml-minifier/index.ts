import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.xml-minifier.title'),
  path: '/xml-minifier',
  description: t('tools.xml-minifier.description'),
  keywords: ['xml', 'minify', 'minifier', 'compress', 'whitespace', 'comments', 'минификация', 'сжать'],
  component: () => import('./xml-minifier.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/FileCode')),
  createdAt: new Date('2026-10-29'),
  category: 'XML',
  npmPackages: ['xml-formatter'],
});
