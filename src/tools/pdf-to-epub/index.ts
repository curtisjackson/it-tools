import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.pdf-to-epub.title'),
  path: '/pdf-to-epub',
  description: t('tools.pdf-to-epub.description'),
  keywords: ['pdf', 'epub', 'ebook', 'book', 'reader', 'kindle', 'электронная книга', 'книга', 'читалка'],
  component: () => import('./pdf-to-epub.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Book')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdfjs-dist', 'fflate'],
});
