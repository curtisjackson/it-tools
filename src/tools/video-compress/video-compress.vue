<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildCompressArgs } from './video-compress.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const height = useQueryParamOrStorage({ name: 'h', storageName: 'video-compress:h', defaultValue: 720 });
const crf = useQueryParamOrStorage({ name: 'crf', storageName: 'video-compress:crf', defaultValue: 28 });
const removeAudio = useQueryParamOrStorage({ name: 'mute', storageName: 'video-compress:mute', defaultValue: false });

const heightOptions = computed(() => [
  { label: t('tools.video-compress.texts.size-original'), value: 0 },
  ...[1080, 720, 480, 360].map((value) => ({ label: `${value}p`, value })),
]);
const qualityMarks = computed(() => ({
  18: t('tools.video-compress.texts.quality-high'),
  28: '',
  38: t('tools.video-compress.texts.quality-small'),
}));

async function compress({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('mp4');
  await exec(
    buildCompressArgs(input, output, {
      height: height.value ?? 0,
      crf: crf.value ?? 28,
      removeAudio: removeAudio.value,
    }),
  );
  return readOutput(output, outputFileName(source.name, '_compressed', 'mp4'), 'video/mp4');
}
</script>

<template>
  <media-tool-layout kind="video" :task="compress" warn-if-larger :button-text="t('tools.video-compress.texts.button')">
    <c-buttons-select
      v-model:value="height"
      :options="heightOptions"
      :label="t('tools.video-compress.texts.label-size')"
      label-width="120px"
      mb-3
    />
    <n-form-item
      :label="t('tools.video-compress.texts.label-quality', [crf])"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
      mb-4
    >
      <n-slider v-model:value="crf" :min="18" :max="38" :step="1" :marks="qualityMarks" />
    </n-form-item>
    <n-form-item
      :label="t('tools.video-compress.texts.label-remove-audio')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-switch v-model:value="removeAudio" />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.video-compress.texts.hint') }}</n-text>
  </media-tool-layout>
</template>
