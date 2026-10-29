import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.arithmetic-sequence.title'),
  path: '/arithmetic-sequence',
  description: t('tools.arithmetic-sequence.description'),
  keywords: [
    'arithmetic',
    'sequence',
    'progression',
    'series',
    'generate',
    'арифметическая',
    'прогрессия',
    'последовательность',
    'ряд',
  ],
  component: () => import('./arithmetic-sequence.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ListNumbers')),
  createdAt: new Date('2026-10-29'),
  category: 'Maths',
});
