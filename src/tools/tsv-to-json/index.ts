import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.tsv-to-json.title'),
  path: '/tsv-to-json',
  description: t('tools.tsv-to-json.description'),
  keywords: ['tsv', 'tab', 'json', 'convert', 'spreadsheet', 'табуляция', 'конвертер', 'таблица'],
  component: () => import('./tsv-to-json.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Typography')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
