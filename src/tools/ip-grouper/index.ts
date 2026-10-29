import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.ip-grouper.title'),
  path: '/ip-grouper',
  description: t('tools.ip-grouper.description'),
  keywords: [
    'ip',
    'ipv4',
    'ipv6',
    'group',
    'subnet',
    'cidr',
    'network',
    'sort',
    'deduplicate',
    'адрес',
    'подсеть',
    'группировка',
  ],
  component: () => import('./ip-grouper.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Sitemap')),
  createdAt: new Date('2026-10-29'),
  category: 'Network',
  npmPackages: ['ip-address'],
});
