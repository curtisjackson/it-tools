import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.table-converter.title'),
  path: '/table-converter',
  description: t('tools.table-converter.description'),
  keywords: ['table', 'convert', 'markdown', 'csv', 'tsv', 'html', 'mysql', 'json', 'таблица', 'конвертер', 'маркдаун'],
  component: () => import('./table-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Table')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
