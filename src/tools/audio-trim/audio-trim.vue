<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildAudioTrimArgs } from './audio-trim.service';
import MediaToolLayout from '@/components/media/MediaToolLayout.vue';
import { type AudioFormat, audioFormats } from '@/composable/media/audio-formats';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const options = useQueryParamOrStorage<{
  format: AudioFormat | 'copy';
  bitrate: number;
  sampleRate: number;
  channels: number;
}>({
  name: 'audio',
  storageName: 'audio-trim:audio',
  defaultValue: { format: 'copy', bitrate: 192, sampleRate: 0, channels: 0 },
});
const extraFormats = computed(() => [{ label: t('tools.audio-trim.texts.format-copy'), value: 'copy' }]);

const duration = ref(0);
const start = ref(0);
const end = ref(0);
const layout = ref<InstanceType<typeof MediaToolLayout>>();

function onLoaded({ duration: loaded }: MediaMetadata) {
  duration.value = loaded;
  start.value = 0;
  end.value = loaded;
}

async function trim({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const { format } = options.value;
  const extension = format === 'copy' ? fileExtension(source.name, 'mp3') : audioFormats[format].extension;
  const input = await writeInput(source, fileExtension(source.name, 'mp3'));
  const output = tempFile(extension);
  await exec(
    buildAudioTrimArgs(
      input,
      output,
      start.value,
      end.value,
      format === 'copy' ? undefined : { ...options.value, format },
    ),
  );
  return readOutput(
    output,
    outputFileName(source.name, '_trimmed', extension),
    format === 'copy' ? source.type || 'audio/mpeg' : audioFormats[format].mime,
  );
}
</script>

<template>
  <media-tool-layout
    ref="layout"
    kind="audio"
    :task="trim"
    :ready="duration > 0 && end > start"
    :button-text="t('tools.audio-trim.texts.button')"
    @loaded="onLoaded"
    @update:file="duration = 0"
  >
    <audio-format-options v-model:value="options" :extra-formats="extraFormats" />

    <template #below-input>
      <media-trim-range
        v-if="duration > 0"
        v-model:start="start"
        v-model:end="end"
        :duration="duration"
        @seek="(time: number) => layout?.seek(time)"
      />
    </template>
  </media-tool-layout>
</template>
