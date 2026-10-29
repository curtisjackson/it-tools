import { translate as t } from '@/plugins/i18n.plugin';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: t('tools.pdf-form-builder.title'),
  path: '/pdf-form-builder',
  description: t('tools.pdf-form-builder.description'),
  keywords: [
    'pdf',
    'form',
    'fillable',
    'field',
    'acroform',
    'text field',
    'checkbox',
    'radio',
    'dropdown',
    'builder',
    'форма',
    'заполняемая',
    'поле',
    'флажок',
    'переключатель',
    'список',
    'конструктор',
  ],
  component: () => import('./pdf-form-builder.vue'),
  icon: defineAsyncComponent(() => import('@vicons/tabler/es/Forms')),
  createdAt: new Date('2026-10-29'),
  category: 'PDF',
  npmPackages: ['pdf-lib', 'pdfjs-dist', '@pdf-lib/fontkit'],
});
