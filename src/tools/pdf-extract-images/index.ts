import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.pdf-extract-images.title'),
  path: '/pdf-extract-images',
  description: t('tools.pdf-extract-images.description'),
  keywords: ['pdf', 'extract', 'images', 'pictures', 'photos', 'извлечь', 'картинки', 'изображения', 'фото'],
  component: () => import('./pdf-extract-images.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Photo')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdfjs-dist'],
});
