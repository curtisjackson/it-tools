import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.date-weekday-calculator.title'),
  path: '/date-weekday-calculator',
  description: t('tools.date-weekday-calculator.description'),
  keywords: [
    'weekday',
    'date',
    'year',
    'birthday',
    'friday 13',
    'calendar',
    'день недели',
    'дата',
    'год',
    'пятница',
    'календарь',
  ],
  component: () => import('./date-weekday-calculator.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/CalendarStats')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
