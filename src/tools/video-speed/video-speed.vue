<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildSpeedArgs } from './video-speed.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const speed = useQueryParamOrStorage({ name: 'speed', storageName: 'video-speed:speed', defaultValue: 2 });
const removeAudio = useQueryParamOrStorage({ name: 'mute', storageName: 'video-speed:mute', defaultValue: false });

const presets = [0.25, 0.5, 0.75, 1.25, 1.5, 2, 4].map((value) => ({ label: `${value}×`, value }));

async function changeSpeed({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('mp4');
  await exec(buildSpeedArgs(input, output, { speed: speed.value ?? 1, removeAudio: removeAudio.value }));
  return readOutput(output, outputFileName(source.name, `_${speed.value}x`, 'mp4'), 'video/mp4');
}
</script>

<template>
  <media-tool-layout
    kind="video"
    :task="changeSpeed"
    :ready="(speed ?? 0) > 0 && speed !== 1"
    :button-text="t('tools.video-speed.texts.button')"
  >
    <c-buttons-select
      v-model:value="speed"
      :options="presets"
      :label="t('tools.video-speed.texts.label-speed')"
      label-width="120px"
      mb-2
    />
    <n-space align="center">
      <n-form-item
        :label="t('tools.video-speed.texts.label-custom')"
        label-placement="left"
        label-width="120"
        :show-feedback="false"
      >
        <n-input-number-i18n v-model:value="speed" :min="0.1" :max="16" :step="0.05" />
      </n-form-item>
      <n-form-item
        :label="t('tools.video-speed.texts.label-remove-audio')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-switch v-model:value="removeAudio" />
      </n-form-item>
    </n-space>
    <n-text depth="3" text-sm>{{ t('tools.video-speed.texts.hint') }}</n-text>
  </media-tool-layout>
</template>
