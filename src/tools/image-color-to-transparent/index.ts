import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.image-color-to-transparent.title'),
  path: '/image-color-to-transparent',
  description: t('tools.image-color-to-transparent.description'),
  keywords: [
    'image',
    'transparent',
    'background',
    'remove color',
    'png',
    'alpha',
    'картинка',
    'прозрачный',
    'фон',
    'убрать цвет',
  ],
  component: () => import('./image-color-to-transparent.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Eraser')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
});
