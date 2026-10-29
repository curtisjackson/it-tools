import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.discord-timestamp.title'),
  path: '/discord-timestamp',
  description: t('tools.discord-timestamp.description'),
  keywords: ['discord', 'timestamp', 'time', 'date', 'unix', 'relative', 'дискорд', 'метка времени', 'дата'],
  component: () => import('./discord-timestamp.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/BrandDiscord')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
