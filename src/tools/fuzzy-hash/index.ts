import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.fuzzy-hash.title'),
  path: '/fuzzy-hash',
  description: t('tools.fuzzy-hash.description'),
  keywords: [
    'ssdeep',
    'ctph',
    'fuzzy',
    'hash',
    'spamsum',
    'similarity',
    'compare',
    'context triggered piecewise hashing',
    'нечёткий',
    'хэш',
    'похожесть',
    'сравнение',
  ],
  component: () => import('./fuzzy-hash.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Fingerprint')),
  createdAt: new Date('2026-10-29'),
  category: 'Crypto',
});
