<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type ResizeMode, buildResizeArgs, resizePresets, resizeSuffix } from './video-resize.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const mode = useQueryParamOrStorage<ResizeMode>({
  name: 'mode',
  storageName: 'video-resize:mode',
  defaultValue: 'preset',
});
const height = useQueryParamOrStorage({ name: 'h', storageName: 'video-resize:h', defaultValue: 720 });
const width = useQueryParamOrStorage({ name: 'w', storageName: 'video-resize:w', defaultValue: 1280 });
const customHeight = useQueryParamOrStorage({ name: 'ch', storageName: 'video-resize:ch', defaultValue: 720 });

const modeOptions = computed(() => [
  { label: t('tools.video-resize.texts.mode-preset'), value: 'preset' },
  { label: t('tools.video-resize.texts.mode-width'), value: 'width' },
  { label: t('tools.video-resize.texts.mode-custom'), value: 'custom' },
]);
const presetOptions = resizePresets.map((value) => ({ label: `${value}p`, value }));

function options() {
  return {
    mode: mode.value,
    height: height.value ?? 720,
    width: Math.round((width.value ?? 1280) / 2) * 2,
    customHeight: Math.round((customHeight.value ?? 720) / 2) * 2,
  };
}

async function resize({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('mp4');
  await exec(buildResizeArgs(input, output, options()));
  return readOutput(output, outputFileName(source.name, resizeSuffix(options()), 'mp4'), 'video/mp4');
}
</script>

<template>
  <media-tool-layout kind="video" :task="resize" :button-text="t('tools.video-resize.texts.button')">
    <c-buttons-select
      v-model:value="mode"
      :options="modeOptions"
      :label="t('tools.video-resize.texts.label-mode')"
      label-width="120px"
      mb-2
    />
    <c-buttons-select
      v-if="mode === 'preset'"
      v-model:value="height"
      :options="presetOptions"
      :label="t('tools.video-resize.texts.label-height')"
      label-width="120px"
    />
    <n-space v-else align="center">
      <n-form-item :label="t('tools.video-resize.texts.label-width')" label-placement="left" :show-feedback="false">
        <n-input-number-i18n v-model:value="width" :min="16" :max="7680" :step="2" />
      </n-form-item>
      <n-form-item
        v-if="mode === 'custom'"
        :label="t('tools.video-resize.texts.label-height')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-input-number-i18n v-model:value="customHeight" :min="16" :max="4320" :step="2" />
      </n-form-item>
    </n-space>
    <n-text v-if="mode === 'custom'" depth="3" block text-sm>{{ t('tools.video-resize.texts.hint-custom') }}</n-text>
  </media-tool-layout>
</template>
