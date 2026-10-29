import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-chunk.title'),
  path: '/list-chunk',
  description: t('tools.list-chunk.description'),
  keywords: ['list', 'chunk', 'group', 'split', 'batch', 'список', 'разбить', 'группы', 'куски', 'пачки'],
  component: () => import('./list-chunk.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/LayoutRows')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
