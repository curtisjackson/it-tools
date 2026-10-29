import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.image-opacity.title'),
  path: '/image-opacity',
  description: t('tools.image-opacity.description'),
  keywords: [
    'image',
    'opacity',
    'transparency',
    'fade',
    'gradient',
    'vignette',
    'alpha',
    'картинка',
    'прозрачность',
    'затухание',
    'градиент',
  ],
  component: () => import('./image-opacity.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Contrast')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
});
