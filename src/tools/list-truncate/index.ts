import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-truncate.title'),
  path: '/list-truncate',
  description: t('tools.list-truncate.description'),
  keywords: ['list', 'truncate', 'limit', 'first', 'last', 'head', 'tail', 'список', 'обрезать', 'первые', 'последние'],
  component: () => import('./list-truncate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Scissors')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
