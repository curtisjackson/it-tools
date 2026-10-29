import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.csv-swap-columns.title'),
  path: '/csv-swap-columns',
  description: t('tools.csv-swap-columns.description'),
  keywords: ['csv', 'swap', 'columns', 'reorder', 'move', 'поменять', 'столбцы', 'местами', 'переставить'],
  component: () => import('./csv-swap-columns.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsLeftRight')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
