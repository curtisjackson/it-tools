import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.csv-separator-converter.title'),
  path: '/csv-separator-converter',
  description: t('tools.csv-separator-converter.description'),
  keywords: [
    'csv',
    'separator',
    'delimiter',
    'semicolon',
    'comma',
    'tab',
    'excel',
    'разделитель',
    'точка с запятой',
    'запятая',
  ],
  component: () => import('./csv-separator-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ColumnInsertRight')),
  createdAt: new Date('2026-10-29'),
  category: 'Data',
});
