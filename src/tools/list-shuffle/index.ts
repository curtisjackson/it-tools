import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-shuffle.title'),
  path: '/list-shuffle',
  description: t('tools.list-shuffle.description'),
  keywords: ['list', 'shuffle', 'random', 'randomize', 'order', 'список', 'перемешать', 'случайный', 'порядок'],
  component: () => import('./list-shuffle.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsShuffle')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
