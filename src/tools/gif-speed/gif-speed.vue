<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildGifSpeedArgs } from './gif-speed.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const speed = useQueryParamOrStorage({ name: 'speed', storageName: 'gif-speed:speed', defaultValue: 2 });
const presets = [0.25, 0.5, 0.75, 1.5, 2, 3].map((value) => ({ label: `${value}×`, value }));

async function changeSpeed({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, 'gif');
  const output = tempFile('gif');
  await exec(buildGifSpeedArgs(input, output, speed.value ?? 1));
  return readOutput(output, outputFileName(source.name, `_${speed.value}x`, 'gif'), 'image/gif');
}
</script>

<template>
  <media-tool-layout
    kind="image"
    accept="image/gif"
    :task="changeSpeed"
    :ready="(speed ?? 0) > 0 && speed !== 1"
    :button-text="t('tools.gif-speed.texts.button')"
  >
    <c-buttons-select
      v-model:value="speed"
      :options="presets"
      :label="t('tools.gif-speed.texts.label-speed')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      :label="t('tools.gif-speed.texts.label-custom')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-input-number-i18n v-model:value="speed" :min="0.1" :max="10" :step="0.05" />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.gif-speed.texts.hint') }}</n-text>
  </media-tool-layout>
</template>
