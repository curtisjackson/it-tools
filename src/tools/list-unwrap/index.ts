import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.list-unwrap.title'),
  path: '/list-unwrap',
  description: t('tools.list-unwrap.description'),
  keywords: [
    'list',
    'unwrap',
    'unquote',
    'strip',
    'prefix',
    'suffix',
    'список',
    'снять',
    'кавычки',
    'обёртка',
    'префикс',
  ],
  component: () => import('./list-unwrap.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Unlink')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
