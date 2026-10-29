import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.tls-ssh-fingerprint.title'),
  path: '/tls-ssh-fingerprint',
  description: t('tools.tls-ssh-fingerprint.description'),
  keywords: [
    'ja3',
    'ja3s',
    'ja3n',
    'ja4',
    'ja4s',
    'hassh',
    'tls',
    'ssl',
    'ssh',
    'fingerprint',
    'clienthello',
    'serverhello',
    'kexinit',
    'отпечаток',
  ],
  component: () => import('./tls-ssh-fingerprint.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Fingerprint')),
  createdAt: new Date('2026-10-29'),
  category: 'Network',
  npmPackages: ['crypto-es'],
});
