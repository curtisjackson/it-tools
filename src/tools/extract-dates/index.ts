import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.extract-dates.title'),
  path: '/extract-dates',
  description: t('tools.extract-dates.description'),
  keywords: ['extract', 'dates', 'find', 'parse', 'iso', 'text', 'извлечь', 'даты', 'найти', 'текст'],
  component: () => import('./extract-dates.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/CalendarEvent')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
