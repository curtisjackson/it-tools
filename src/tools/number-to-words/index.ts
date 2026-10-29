import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.number-to-words.title'),
  path: '/number-to-words',
  description: t('tools.number-to-words.description'),
  keywords: [
    'number',
    'words',
    'spell',
    'amount',
    'currency',
    'cheque',
    'число',
    'прописью',
    'сумма',
    'рубли',
    'словами',
  ],
  component: () => import('./number-to-words.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/CurrencyRubel')),
  createdAt: new Date('2026-10-29'),
  category: 'Maths',
  npmPackages: ['to-words'],
});
