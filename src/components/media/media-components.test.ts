// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MediaTrimRange from './MediaTrimRange.vue';
import MultiFileList from './MultiFileList.vue';
import MediaResult from './MediaResult.vue';
import MediaFileInput from './MediaFileInput.vue';
import { i18nPlugin } from '@/plugins/i18n.plugin';

vi.mock('@/composable/media/probe-media', () => ({
  probeWithFfmpeg: vi.fn<() => Promise<{ duration: number; width: number; height: number }>>(async () => ({
    duration: 3,
    width: 320,
    height: 240,
  })),
}));

const global = { plugins: [i18nPlugin] };

describe('media components', () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn<(obj: Blob) => string>(() => 'blob:fake');
    URL.revokeObjectURL = vi.fn<(url: string) => void>();
  });

  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('MediaTrimRange', () => {
    const props = { duration: 10, start: 0, end: 10 };

    it('shows the range as timecodes', () => {
      const wrapper = mount(MediaTrimRange, { props, global });
      const inputs = wrapper.findAll('input');

      expect((inputs[0].element as HTMLInputElement).value).toBe('00:00.000');
      expect((inputs[1].element as HTMLInputElement).value).toBe('00:10.000');
      expect(wrapper.text()).toContain('Selected: 00:10.000');
    });

    it('emits a typed start time and seeks to it', async () => {
      const wrapper = mount(MediaTrimRange, { props, global });

      await wrapper.findAll('input')[0].setValue('2.5');

      expect(wrapper.emitted('update:start')?.at(-1)).toEqual([2.5]);
      expect(wrapper.emitted('seek')?.at(-1)).toEqual([2.5]);
    });

    it('does not emit an end before the start or past the duration', async () => {
      const wrapper = mount(MediaTrimRange, { props: { ...props, start: 4 }, global });
      const end = wrapper.findAll('input')[1];

      await end.setValue('3');
      await end.setValue('00:11');

      expect(wrapper.emitted('update:end')).toBeUndefined();
      expect(wrapper.text()).toContain('Start must be before end');
    });

    it('rejects a malformed time', async () => {
      const wrapper = mount(MediaTrimRange, { props, global });

      await wrapper.findAll('input')[0].setValue('1:2:3:4');

      expect(wrapper.emitted('update:start')).toBeUndefined();
      expect(wrapper.text()).toContain('Use SS, MM:SS or HH:MM:SS');
    });
  });

  describe('MultiFileList', () => {
    const files = ['a.mp4', 'b.mp4', 'c.mp4'].map((name) => new File(['x'], name));
    const names = (emitted: unknown) => (emitted as File[][])[0].map((file) => file.name);

    it('lists the files in order', () => {
      const wrapper = mount(MultiFileList, { props: { files }, global });

      expect(wrapper.findAll('[data-test-id="file-item"]').map((item) => item.text())).toEqual([
        expect.stringContaining('1. a.mp4'),
        expect.stringContaining('2. b.mp4'),
        expect.stringContaining('3. c.mp4'),
      ]);
    });

    it('moves a file down and removes one', async () => {
      const wrapper = mount(MultiFileList, { props: { files }, global });

      await wrapper.find('[aria-label="Move down"]').trigger('click');
      expect(names(wrapper.emitted('update:files')?.at(-1))).toEqual(['b.mp4', 'a.mp4', 'c.mp4']);

      await wrapper.findAll('[aria-label="Remove"]')[2].trigger('click');
      expect(names(wrapper.emitted('update:files')?.at(-1))).toEqual(['a.mp4', 'b.mp4']);
    });
  });

  describe('MediaResult', () => {
    it('shows progress and emits cancel while running', async () => {
      const wrapper = mount(MediaResult, { props: { running: true, progress: 0.42, logs: [] }, global });

      expect(wrapper.text()).toContain('42%');
      await wrapper
        .findAll('button')
        .find((button) => button.text() === 'Cancel')!
        .trigger('click');
      expect(wrapper.emitted('cancel')).toHaveLength(1);
    });

    it('shows the result with its size change', () => {
      const result = new File([new Uint8Array(250)], 'out.mp4', { type: 'video/mp4' });
      const wrapper = mount(MediaResult, {
        props: { running: false, progress: 1, logs: ['frame=1'], result, sourceSize: 1000 },
        global,
      });

      expect(wrapper.find('video').exists()).toBe(true);
      expect(wrapper.get('[data-test-id="result-info"]').text()).toContain('out.mp4');
      expect(wrapper.get('[data-test-id="result-info"]').text()).toBe('out.mp4 · 250 Bytes · -75% vs. original');
    });

    it('shows the error', () => {
      const wrapper = mount(MediaResult, { props: { running: false, progress: 0, logs: [], error: 'boom' }, global });

      expect(wrapper.text()).toContain('boom');
    });
  });

  describe('MediaFileInput', () => {
    it('shows an upload zone, then the file with its metadata', async () => {
      const wrapper = mount(MediaFileInput, { props: { kind: 'video' }, global });
      expect(wrapper.text()).toContain('Drag and drop a video here');

      await wrapper.setProps({ file: new File([new Uint8Array(2048)], 'clip.mp4', { type: 'video/mp4' }) });
      const video = wrapper.get('video').element as HTMLVideoElement;
      Object.defineProperties(video, {
        duration: { value: 3 },
        videoWidth: { value: 320 },
        videoHeight: { value: 240 },
      });
      await wrapper.get('video').trigger('loadedmetadata');

      expect(wrapper.emitted('loaded')?.at(-1)).toEqual([{ duration: 3, width: 320, height: 240 }]);
      expect(wrapper.get('[data-test-id="media-info"]').text()).toBe('clip.mp4 · 2 KB · 00:03.000 · 320×240');
    });

    it('falls back to ffmpeg when the browser cannot open the file', async () => {
      const wrapper = mount(MediaFileInput, {
        props: { kind: 'video', file: new File([new Uint8Array(2048)], 'clip.mp4', { type: 'video/mp4' }) },
        global,
      });

      await wrapper.get('video').trigger('error');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.find('video').exists()).toBe(false);
      expect(wrapper.get('[data-test-id="preview-unsupported"]').text()).toContain('cannot play this file');
      expect(wrapper.emitted('loaded')?.at(-1)).toEqual([{ duration: 3, width: 320, height: 240 }]);
      expect(wrapper.get('[data-test-id="media-info"]').text()).toBe('clip.mp4 · 2 KB · 00:03.000 · 320×240');
    });

    it('clears the file on "Choose another file"', async () => {
      const wrapper = mount(MediaFileInput, {
        props: { kind: 'audio', file: new File(['x'], 'a.mp3', { type: 'audio/mpeg' }) },
        global,
      });

      await wrapper
        .findAll('button')
        .find((button) => button.text() === 'Choose another file')!
        .trigger('click');

      expect(wrapper.emitted('update:file')?.at(-1)).toEqual([undefined]);
    });
  });
});
