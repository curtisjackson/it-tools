import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.email-extractor.title'),
  path: '/email-extractor',
  description: t('tools.email-extractor.description'),
  keywords: ['email', 'extract', 'e-mail', 'address', 'find', 'почта', 'извлечь', 'адреса', 'найти'],
  component: () => import('./email-extractor.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Mail')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
