import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.csv-insert-columns.title'),
  path: '/csv-insert-columns',
  description: t('tools.csv-insert-columns.description'),
  keywords: ['csv', 'insert', 'add', 'column', 'merge', 'вставить', 'добавить', 'столбец', 'колонка'],
  component: () => import('./csv-insert-columns.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ColumnInsertRight')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
