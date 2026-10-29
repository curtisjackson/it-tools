import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.rot-cipher.title'),
  path: '/rot-cipher',
  description: t('tools.rot-cipher.description'),
  keywords: ['rot13', 'rot', 'caesar', 'cipher', 'shift', 'rotate', 'text', 'цезарь', 'шифр', 'сдвиг', 'текст'],
  component: () => import('./rot-cipher.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Rotate')),
  createdAt: new Date('2026-10-29'),
  category: 'Text',
});
