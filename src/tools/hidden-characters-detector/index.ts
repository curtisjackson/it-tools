import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.hidden-characters-detector.title'),
  path: '/hidden-characters-detector',
  description: t('tools.hidden-characters-detector.description'),
  keywords: [
    'hidden',
    'invisible',
    'zero width',
    'unicode',
    'rtl',
    'bidi',
    'trojan source',
    'homoglyph',
    'невидимые',
    'скрытые',
    'символы',
    'пробел',
  ],
  component: () => import('./hidden-characters-detector.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Ghost')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
