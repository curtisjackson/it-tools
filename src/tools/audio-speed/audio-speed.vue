<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildAudioSpeedArgs } from './audio-speed.service';
import { type AudioEncodeOptions, audioFormats } from '@/composable/media/audio-formats';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const speed = useQueryParamOrStorage({ name: 'speed', storageName: 'audio-speed:speed', defaultValue: 1.5 });
const options = useQueryParamOrStorage<AudioEncodeOptions>({
  name: 'audio',
  storageName: 'audio-speed:audio',
  defaultValue: { format: 'mp3', bitrate: 192, sampleRate: 0, channels: 0 },
});
const presets = [0.5, 0.75, 1.25, 1.5, 2, 3].map((value) => ({ label: `${value}×`, value }));

async function changeSpeed({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const info = audioFormats[options.value.format];
  const input = await writeInput(source, fileExtension(source.name, 'mp3'));
  const output = tempFile(info.extension);
  await exec(buildAudioSpeedArgs(input, output, speed.value ?? 1, options.value));
  return readOutput(output, outputFileName(source.name, `_${speed.value}x`, info.extension), info.mime);
}
</script>

<template>
  <media-tool-layout
    kind="audio"
    :task="changeSpeed"
    :ready="(speed ?? 0) > 0 && speed !== 1"
    :button-text="t('tools.audio-speed.texts.button')"
  >
    <c-buttons-select
      v-model:value="speed"
      :options="presets"
      :label="t('tools.audio-speed.texts.label-speed')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      :label="t('tools.audio-speed.texts.label-custom')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
      mb-2
    >
      <n-input-number-i18n v-model:value="speed" :min="0.1" :max="16" :step="0.05" />
    </n-form-item>
    <audio-format-options v-model:value="options" />
    <n-text depth="3" text-sm>{{ t('tools.audio-speed.texts.hint') }}</n-text>
  </media-tool-layout>
</template>
