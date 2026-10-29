import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.csv-transpose.title'),
  path: '/csv-transpose',
  description: t('tools.csv-transpose.description'),
  keywords: ['csv', 'transpose', 'rows', 'columns', 'swap', 'pivot', 'транспонировать', 'строки', 'столбцы', 'таблица'],
  component: () => import('./csv-transpose.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsSort')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
