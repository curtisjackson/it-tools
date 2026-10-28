import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.text-reverse.title'),
  path: '/text-reverse',
  description: t('tools.text-reverse.description'),
  keywords: ['reverse', 'text', 'string', 'mirror', 'backwards', 'перевернуть', 'текст', 'задом наперёд', 'реверс'],
  component: () => import('./text-reverse.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsLeftRight')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
