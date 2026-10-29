import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.archive-manager.title'),
  path: '/archive-manager',
  description: t('tools.archive-manager.description'),
  keywords: [
    'zip',
    'unzip',
    'tar',
    'untar',
    'tgz',
    'tar.gz',
    'gzip',
    'archive',
    'extract',
    'password',
    'aes',
    'zipcrypto',
    'архив',
    'распаковать',
    'упаковать',
    'пароль',
  ],
  component: () => import('./archive-manager.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/FileZip')),
  createdAt: new Date('2026-10-29'),
  category: 'Converters',
  npmPackages: ['@zip.js/zip.js', 'fflate'],
});
