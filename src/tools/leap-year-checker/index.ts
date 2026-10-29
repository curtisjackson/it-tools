import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.leap-year-checker.title'),
  path: '/leap-year-checker',
  description: t('tools.leap-year-checker.description'),
  keywords: ['leap year', 'year', 'february 29', 'calendar', 'високосный', 'год', '29 февраля'],
  component: () => import('./leap-year-checker.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Calendar')),
  createdAt: new Date('2026-10-29'),
  category: 'Datetime',
});
