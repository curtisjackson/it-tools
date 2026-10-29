// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BytesInput from './BytesInput.vue';
import { i18nPlugin } from '@/plugins/i18n.plugin';

function mountInput(props: { value: string; format: 'utf8' | 'hex' | 'base64' | 'latin1' | 'file' }) {
  return mount(BytesInput, { props, global: { plugins: [i18nPlugin] } });
}

describe('BytesInput', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('emits the parsed bytes of the initial value', () => {
    const wrapper = mountInput({ value: '48 69', format: 'hex' });

    expect(wrapper.emitted('update:bytes')?.at(-1)).toEqual([new Uint8Array([0x48, 0x69])]);
  });

  it('emits new bytes when the format changes', async () => {
    const wrapper = mountInput({ value: '4869', format: 'hex' });

    await wrapper.setProps({ format: 'utf8' });

    expect(wrapper.emitted('update:bytes')?.at(-1)).toEqual([new TextEncoder().encode('4869')]);
  });

  it('emits no bytes and shows the parse error for invalid input', async () => {
    const wrapper = mountInput({ value: '486', format: 'hex' });
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:bytes')?.at(-1)).toEqual([undefined]);
    expect(wrapper.text()).toContain('Invalid input: Invalid hex: odd number of digits');
  });

  it('shows a file picker in file mode', () => {
    const wrapper = mountInput({ value: '', format: 'file' });

    expect(wrapper.find('textarea').exists()).toBe(false);
    expect(wrapper.find('input[type="file"]').exists()).toBe(true);
    expect(wrapper.emitted('update:bytes')?.at(-1)).toEqual([undefined]);
  });

  it('emits the chosen file only in file mode', async () => {
    const wrapper = mountInput({ value: '', format: 'file' });
    const file = new File(['Hi'], 'hi.txt');
    const input = wrapper.find('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.emitted('update:file')?.at(-1)).toEqual([file]);
    expect(wrapper.emitted('update:bytes')?.at(-1)).toEqual([new Uint8Array([0x48, 0x69])]);

    await wrapper.setProps({ format: 'utf8' });

    expect(wrapper.emitted('update:file')?.at(-1)).toEqual([undefined]);
  });
});
