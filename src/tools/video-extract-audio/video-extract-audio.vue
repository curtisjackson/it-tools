<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildExtractAudioArgs } from './video-extract-audio.service';
import {
  type AudioEncodeOptions,
  type AudioFormat,
  audioFormats,
  containerForCodec,
} from '@/composable/media/audio-formats';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { probeInput } from '@/composable/media/probe-inputs';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const options = useQueryParamOrStorage<Omit<AudioEncodeOptions, 'format'> & { format: AudioFormat | 'copy' }>({
  name: 'audio',
  storageName: 'video-extract-audio:audio',
  defaultValue: { format: 'copy', bitrate: 192, sampleRate: 0, channels: 0 },
});
const extraFormats = computed(() => [{ label: t('tools.video-extract-audio.texts.format-copy'), value: 'copy' }]);

async function extract(context: FfmpegTaskContext, source: File) {
  const input = await context.writeInput(source, fileExtension(source.name, 'mp4'));
  const probed = await probeInput(context, input);
  if (!probed.hasAudio) {
    throw new Error(t('tools.video-extract-audio.texts.no-audio'));
  }
  const { format } = options.value;
  const target =
    format === 'copy'
      ? containerForCodec(probed.audioCodec)
      : { extension: audioFormats[format].extension, mime: audioFormats[format].mime };
  const output = context.tempFile(target.extension);
  await context.exec(
    buildExtractAudioArgs(input, output, format === 'copy' ? undefined : { ...options.value, format }),
  );
  return context.readOutput(output, outputFileName(source.name, '', target.extension), target.mime);
}
</script>

<template>
  <media-tool-layout kind="video" :task="extract" :button-text="t('tools.video-extract-audio.texts.button')">
    <audio-format-options v-model:value="options" :extra-formats="extraFormats" />
    <n-text v-if="options.format === 'copy'" depth="3" text-sm>{{
      t('tools.video-extract-audio.texts.hint-copy')
    }}</n-text>
  </media-tool-layout>
</template>
