<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildLoopArgs } from './video-loop.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const times = useQueryParamOrStorage({ name: 'times', storageName: 'video-loop:times', defaultValue: 3 });

async function loop({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const extension = fileExtension(source.name, 'mp4');
  const input = await writeInput(source, extension);
  const output = tempFile(extension);
  await exec(buildLoopArgs(input, output, times.value ?? 2));
  return readOutput(output, outputFileName(source.name, `_x${times.value}`, extension), source.type || 'video/mp4');
}
</script>

<template>
  <media-tool-layout
    kind="video"
    :task="loop"
    :ready="(times ?? 0) >= 2"
    :button-text="t('tools.video-loop.texts.button')"
  >
    <n-form-item
      :label="t('tools.video-loop.texts.label-times')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-input-number-i18n v-model:value="times" :min="2" :max="100" />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.video-loop.texts.hint') }}</n-text>
  </media-tool-layout>
</template>
