import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.clock-time-truncate.title'),
  path: '/clock-time-truncate',
  description: t('tools.clock-time-truncate.description'),
  keywords: ['time', 'truncate', 'round', 'seconds', 'minutes', 'clock', 'время', 'округлить', 'отбросить', 'секунды'],
  component: () => import('./clock-time-truncate.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Clock')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
