import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.text-repeat.title'),
  path: '/text-repeat',
  description: t('tools.text-repeat.description'),
  keywords: ['repeat', 'text', 'duplicate', 'multiply', 'повторить', 'текст', 'размножить'],
  component: () => import('./text-repeat.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Repeat')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
