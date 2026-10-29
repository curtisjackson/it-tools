import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.images-to-pdf.title'),
  path: '/images-to-pdf',
  description: t('tools.images-to-pdf.description'),
  keywords: ['images', 'pdf', 'convert', 'jpg', 'png', 'heic', 'scan', 'картинки', 'фото', 'в pdf', 'скан'],
  component: () => import('./images-to-pdf.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/FilePlus')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdf-lib'],
});
