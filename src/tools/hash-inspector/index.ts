import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.hash-inspector.title'),
  path: '/hash-inspector',
  description: t('tools.hash-inspector.description'),
  keywords: [
    'hash',
    'password',
    'bcrypt',
    'argon2',
    'argon2id',
    'crypt',
    'sha512-crypt',
    'md5-crypt',
    'yescrypt',
    'pbkdf2',
    'django',
    'identify',
    'parse',
    'verify',
    'хэш',
    'пароль',
    'разбор',
  ],
  component: () => import('./hash-inspector.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/ListSearch')),
  createdAt: new Date('2026-10-29'),
  category: 'Crypto',
  npmPackages: ['bcryptjs', 'hash-wasm'],
});
