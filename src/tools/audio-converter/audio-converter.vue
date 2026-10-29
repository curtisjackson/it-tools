<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildAudioConvertArgs } from './audio-converter.service';
import { type AudioEncodeOptions, audioFormats } from '@/composable/media/audio-formats';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const options = useQueryParamOrStorage<AudioEncodeOptions>({
  name: 'audio',
  storageName: 'audio-converter:audio',
  defaultValue: { format: 'mp3', bitrate: 192, sampleRate: 0, channels: 0 },
});

async function convert({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const info = audioFormats[options.value.format];
  const input = await writeInput(source, fileExtension(source.name, 'audio'));
  const output = tempFile(info.extension);
  await exec(buildAudioConvertArgs(input, output, options.value));
  return readOutput(output, outputFileName(source.name, '', info.extension), info.mime);
}
</script>

<template>
  <media-tool-layout
    kind="audio"
    accept="audio/*,video/*,.mkv,.opus,.flac"
    :task="convert"
    :button-text="t('tools.audio-converter.texts.button')"
  >
    <audio-format-options v-model:value="options" />
  </media-tool-layout>
</template>
