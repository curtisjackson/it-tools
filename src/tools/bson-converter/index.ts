import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.bson-converter.title'),
  path: '/bson-converter',
  description: t('tools.bson-converter.description'),
  keywords: [
    'bson',
    'json',
    'mongodb',
    'mongo',
    'extended json',
    'ejson',
    'objectid',
    'mongodump',
    'serialize',
    'deserialize',
    'сериализация',
  ],
  component: () => import('./bson-converter.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Database')),
  createdAt: new Date('2026-10-29'),
  category: 'JSON',
  npmPackages: ['bson'],
});
