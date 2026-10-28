// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CsvOptions from './CsvOptions.vue';
import { i18nPlugin } from '@/plugins/i18n.plugin';
import { defaultCsvOptions } from '@/utils/csv';

describe('CsvOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('emits the options with the changed delimiter', async () => {
    const wrapper = mount(CsvOptions, {
      props: { value: { ...defaultCsvOptions } },
      global: { plugins: [i18nPlugin] },
    });

    await wrapper.findAll('input')[0].setValue(';');

    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([{ ...defaultCsvOptions, delimiter: ';' }]);
  });

  it('emits the options with a toggled switch', async () => {
    const wrapper = mount(CsvOptions, {
      props: { value: { ...defaultCsvOptions } },
      global: { plugins: [i18nPlugin] },
    });

    await wrapper.findAll('[role="switch"]')[1].trigger('click');

    expect(wrapper.emitted('update:value')?.at(-1)).toEqual([{ ...defaultCsvOptions, deleteEmptyLines: false }]);
  });
});
