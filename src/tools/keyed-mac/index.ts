import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.keyed-mac.title'),
  path: '/keyed-mac',
  description: t('tools.keyed-mac.description'),
  keywords: [
    'cmac',
    'omac',
    'mac',
    'aes',
    '3des',
    'triple des',
    'ascon',
    'ascon-mac',
    'message authentication code',
    'sp 800-38b',
    'rfc 4493',
    'имитовставка',
  ],
  component: () => import('./keyed-mac.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Key')),
  createdAt: new Date('2026-10-29'),
  category: 'Crypto',
  npmPackages: ['node-forge'],
});
