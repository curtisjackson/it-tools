// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SplitSeparatorOptions from './SplitSeparatorOptions.vue';
import { i18nPlugin } from '@/plugins/i18n.plugin';

function mountOptions(props: { splitOperatorType: 'symbol' | 'regex'; splitSeparator: string }) {
  return mount(SplitSeparatorOptions, { props, global: { plugins: [i18nPlugin] } });
}

describe('SplitSeparatorOptions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('emits the typed separator', async () => {
    const wrapper = mountOptions({ splitOperatorType: 'symbol', splitSeparator: ',' });

    await wrapper.get('input').setValue(';');

    expect(wrapper.emitted('update:splitSeparator')?.at(-1)).toEqual([';']);
  });

  it('emits the chosen split mode', async () => {
    const wrapper = mountOptions({ splitOperatorType: 'symbol', splitSeparator: ',' });

    const regexButton = wrapper.findAll('button').find((button) => button.text() === 'Regex');
    await regexButton!.trigger('click');

    expect(wrapper.emitted('update:splitOperatorType')?.at(-1)).toEqual(['regex']);
  });

  it('flags an invalid regex only in regex mode', async () => {
    const symbol = mountOptions({ splitOperatorType: 'symbol', splitSeparator: '(' });
    const regex = mountOptions({ splitOperatorType: 'regex', splitSeparator: '(' });
    await symbol.vm.$nextTick();
    await regex.vm.$nextTick();

    expect(symbol.text()).not.toContain('Invalid regular expression');
    expect(regex.text()).toContain('Invalid regular expression');
  });
});
