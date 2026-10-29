import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.gif-speed.title'),
  path: '/gif-speed',
  description: t('tools.gif-speed.description'),
  keywords: ['gif', 'speed', 'fast', 'slow', 'animation', 'гиф', 'скорость', 'ускорить', 'замедлить', 'анимация'],
  component: () => import('./gif-speed.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/PlayerTrackNext')),
  createdAt: new Date('2026-10-29'),
  category: 'Images',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
