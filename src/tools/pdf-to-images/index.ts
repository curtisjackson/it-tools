import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.pdf-to-images.title'),
  path: '/pdf-to-images',
  description: t('tools.pdf-to-images.description'),
  keywords: [
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'images',
    'pages',
    'render',
    'convert',
    'картинки',
    'страницы',
    'в png',
    'в jpg',
  ],
  component: () => import('./pdf-to-images.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Photo')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdfjs-dist'],
});
