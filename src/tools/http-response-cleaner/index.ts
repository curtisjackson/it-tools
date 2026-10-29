import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.http-response-cleaner.title'),
  path: '/http-response-cleaner',
  description: t('tools.http-response-cleaner.description'),
  keywords: [
    'http',
    'response',
    'headers',
    'strip',
    'chunked',
    'dechunk',
    'transfer-encoding',
    'gzip',
    'deflate',
    'raw',
    'ответ',
    'заголовки',
  ],
  component: () => import('./http-response-cleaner.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/WorldDownload')),
  createdAt: new Date('2026-10-29'),
  category: 'Web',
});
