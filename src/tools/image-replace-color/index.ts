import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.image-replace-color.title'),
  path: '/image-replace-color',
  description: t('tools.image-replace-color.description'),
  keywords: ['image', 'replace', 'color', 'recolor', 'change', 'картинка', 'заменить', 'цвет', 'перекрасить'],
  component: () => import('./image-replace-color.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Palette')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
});
