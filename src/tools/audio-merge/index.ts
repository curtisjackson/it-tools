import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.audio-merge.title'),
  path: '/audio-merge',
  description: t('tools.audio-merge.description'),
  keywords: ['audio', 'merge', 'join', 'concatenate', 'combine', 'mp3', 'аудио', 'склеить', 'объединить', 'соединить'],
  component: () => import('./audio-merge.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Stack2')),
  createdAt: new Date('2026-10-29'),
  category: 'Audio',
  npmPackages: ['@ffmpeg/ffmpeg'],
});
