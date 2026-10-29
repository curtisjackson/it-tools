import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.time-to-decimal.title'),
  path: '/time-to-decimal',
  description: t('tools.time-to-decimal.description'),
  keywords: ['time', 'decimal', 'hours', 'timesheet', 'convert', 'время', 'десятичные', 'часы', 'табель'],
  component: () => import('./time-to-decimal.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Hourglass')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
