import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.palindrome.title'),
  path: '/palindrome',
  description: t('tools.palindrome.description'),
  keywords: ['palindrome', 'check', 'create', 'mirror', 'палиндром', 'перевёртыш', 'проверить'],
  component: () => import('./palindrome.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ArrowsLeftRight')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
