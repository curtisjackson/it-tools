import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.csv-incomplete-records.title'),
  path: '/csv-incomplete-records',
  description: t('tools.csv-incomplete-records.description'),
  keywords: [
    'csv',
    'validate',
    'missing',
    'empty',
    'incomplete',
    'check',
    'проверить',
    'пустые',
    'неполные',
    'пропуски',
  ],
  component: () => import('./csv-incomplete-records.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/TableOff')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
