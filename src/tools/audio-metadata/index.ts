import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.audio-metadata.title'),
  path: '/audio-metadata',
  description: t('tools.audio-metadata.description'),
  keywords: [
    'audio',
    'metadata',
    'id3',
    'tags',
    'mp3',
    'flac',
    'm4a',
    'ogg',
    'opus',
    'wav',
    'wma',
    'aiff',
    'cover',
    'vorbis',
    'exif',
    'метаданные',
    'теги',
    'обложка',
  ],
  component: () => import('./audio-metadata.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Music')),
  createdAt: new Date('2026-10-29'),
  category: 'Forensic',
  npmPackages: ['music-metadata'],
});
