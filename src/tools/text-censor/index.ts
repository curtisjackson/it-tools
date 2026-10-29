import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.text-censor.title'),
  path: '/text-censor',
  description: t('tools.text-censor.description'),
  keywords: [
    'censor',
    'mask',
    'bad words',
    'profanity',
    'filter',
    'redact',
    'цензура',
    'мат',
    'скрыть',
    'замаскировать',
    'слова',
  ],
  component: () => import('./text-censor.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/EyeOff')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
