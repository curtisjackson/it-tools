import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-rotate.title'),
  path: '/list-rotate',
  description: t('tools.list-rotate.description'),
  keywords: ['list', 'rotate', 'shift', 'circular', 'cycle', 'список', 'сдвиг', 'циклический', 'повернуть'],
  component: () => import('./list-rotate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Rotate2')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
