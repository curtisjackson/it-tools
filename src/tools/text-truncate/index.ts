import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.text-truncate.title'),
  path: '/text-truncate',
  description: t('tools.text-truncate.description'),
  keywords: [
    'truncate',
    'substring',
    'cut',
    'shorten',
    'limit',
    'length',
    'обрезать',
    'подстрока',
    'сократить',
    'длина',
  ],
  component: () => import('./text-truncate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Cut')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
