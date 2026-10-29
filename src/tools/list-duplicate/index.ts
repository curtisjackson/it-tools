import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-duplicate.title'),
  path: '/list-duplicate',
  description: t('tools.list-duplicate.description'),
  keywords: ['list', 'duplicate', 'repeat', 'copy', 'multiply', 'список', 'повторить', 'дублировать', 'размножить'],
  component: () => import('./list-duplicate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Copy')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
