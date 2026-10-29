import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.legacy-hashes.title'),
  path: '/legacy-hashes',
  description: t('tools.legacy-hashes.description'),
  keywords: [
    'hash',
    'md2',
    'md6',
    'sha0',
    'sha-0',
    'has160',
    'has-160',
    'snefru',
    'shake',
    'shake128',
    'shake256',
    'murmur',
    'murmurhash3',
    'digest',
    'хэш',
  ],
  component: () => import('./legacy-hashes.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Hash')),
  createdAt: new Date('2026-10-29'),
  category: 'Crypto',
  npmPackages: ['@noble/hashes'],
});
