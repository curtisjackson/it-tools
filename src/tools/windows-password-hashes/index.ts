import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.windows-password-hashes.title'),
  path: '/windows-password-hashes',
  description: t('tools.windows-password-hashes.description'),
  keywords: ['ntlm', 'nt', 'lm', 'lanman', 'hash', 'windows', 'password', 'md4', 'sam', 'хэш', 'пароль'],
  component: () => import('./windows-password-hashes.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/BrandWindows')),
  createdAt: new Date('2026-10-29'),
  category: 'Crypto',
  npmPackages: ['hash-wasm', 'node-forge'],
});
