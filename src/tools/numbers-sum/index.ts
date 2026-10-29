import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.numbers-sum.title'),
  path: '/numbers-sum',
  description: t('tools.numbers-sum.description'),
  keywords: ['sum', 'total', 'add', 'numbers', 'calculator', 'running total', 'сумма', 'сложить', 'итог', 'числа'],
  component: () => import('./numbers-sum.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Sum')),
  createdAt: new Date('2026-10-29'),
  category: 'Maths',
});
