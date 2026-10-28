import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.random-case.title'),
  path: '/random-case',
  description: t('tools.random-case.description'),
  keywords: ['random', 'case', 'alternate', 'mocking', 'spongebob', 'регистр', 'случайный', 'чередование'],
  component: () => import('./random-case.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/LetterCaseToggle')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
