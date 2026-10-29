import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.php-serialize-converter.title'),
  path: '/php-serialize-converter',
  description: t('tools.php-serialize-converter.description'),
  keywords: [
    'php',
    'serialize',
    'unserialize',
    'deserialize',
    'json',
    'session',
    'wordpress',
    'сериализация',
    'десериализация',
  ],
  component: () => import('./php-serialize-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/BrandPhp')),
  createdAt: new Date('2026-10-29'),
  category: 'Development',
});
