<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildAudioMergeArgs } from './audio-merge.service';
import { type AudioEncodeOptions, audioFormats } from '@/composable/media/audio-formats';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const options = useQueryParamOrStorage<AudioEncodeOptions>({
  name: 'audio',
  storageName: 'audio-merge:audio',
  defaultValue: { format: 'mp3', bitrate: 192, sampleRate: 0, channels: 0 },
});

async function merge(context: FfmpegTaskContext, files: File[]) {
  const info = audioFormats[options.value.format];
  const inputs = [];
  for (const file of files) {
    inputs.push(await context.writeInput(file, fileExtension(file.name, 'mp3')));
  }
  const output = context.tempFile(info.extension);
  await context.exec(buildAudioMergeArgs(inputs, output, options.value));
  return context.readOutput(output, outputFileName(files[0].name, '_merged', info.extension), info.mime);
}
</script>

<template>
  <multi-media-tool-layout
    accept="audio/*,.opus,.flac"
    :task="merge"
    :button-text="t('tools.audio-merge.texts.button')"
  >
    <audio-format-options v-model:value="options" />
  </multi-media-tool-layout>
</template>
