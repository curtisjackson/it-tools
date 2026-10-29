import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.audio-speed.title'),
  path: '/audio-speed',
  description: t('tools.audio-speed.description'),
  keywords: [
    'audio',
    'speed',
    'tempo',
    'fast',
    'slow',
    'podcast',
    'аудио',
    'скорость',
    'темп',
    'ускорить',
    'замедлить',
  ],
  component: () => import('./audio-speed.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/PlayerTrackNext')),
  createdAt: new Date('2026-10-29'),
  category: 'Audio',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
