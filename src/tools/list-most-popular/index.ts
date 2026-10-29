import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-most-popular.title'),
  path: '/list-most-popular',
  description: t('tools.list-most-popular.description'),
  keywords: [
    'list',
    'most popular',
    'frequency',
    'count',
    'occurrences',
    'top',
    'список',
    'частота',
    'популярные',
    'подсчёт',
    'повторы',
  ],
  component: () => import('./list-most-popular.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ChartBar')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
