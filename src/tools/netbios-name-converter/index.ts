import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.netbios-name-converter.title'),
  path: '/netbios-name-converter',
  description: t('tools.netbios-name-converter.description'),
  keywords: ['netbios', 'nbns', 'smb', 'name', 'encode', 'decode', 'suffix', 'wins', 'имя', 'кодирование'],
  component: () => import('./netbios-name-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Server')),
  createdAt: new Date('2026-10-29'),
  category: 'Network',
});
