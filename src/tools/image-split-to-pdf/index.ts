import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.image-split-to-pdf.title'),
  path: '/image-split-to-pdf',
  description: t('tools.image-split-to-pdf.description'),
  keywords: [
    'image',
    'split',
    'pdf',
    'pages',
    'print',
    'long screenshot',
    'poster',
    'картинка',
    'разрезать',
    'печать',
    'длинный скриншот',
  ],
  component: () => import('./image-split-to-pdf.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/LayoutRows')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdf-lib'],
});
