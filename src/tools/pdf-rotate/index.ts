import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.pdf-rotate.title'),
  path: '/pdf-rotate',
  description: t('tools.pdf-rotate.description'),
  keywords: ['pdf', 'rotate', 'pages', 'orientation', 'turn', 'повернуть', 'страницы', 'ориентация'],
  component: () => import('./pdf-rotate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Rotate')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdf-lib'],
});
