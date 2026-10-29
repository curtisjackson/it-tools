<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildMergeArgs } from './video-merge.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { probeInput } from '@/composable/media/probe-inputs';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const fps = useQueryParamOrStorage({ name: 'fps', storageName: 'video-merge:fps', defaultValue: 30 });
const fpsOptions = [24, 25, 30, 60].map((value) => ({ label: `${value} fps`, value }));

async function merge(context: FfmpegTaskContext, files: File[]) {
  const inputs = [];
  for (const file of files) {
    const name = await context.writeInput(file, fileExtension(file.name, 'mp4'));
    inputs.push(await probeInput(context, name));
  }
  const output = context.tempFile('mp4');
  await context.exec(
    buildMergeArgs(inputs, output, {
      width: inputs[0].width || 1280,
      height: inputs[0].height || 720,
      fps: fps.value ?? 30,
    }),
  );
  return context.readOutput(output, outputFileName(files[0].name, '_merged', 'mp4'), 'video/mp4');
}
</script>

<template>
  <multi-media-tool-layout accept="video/*,.mkv" :task="merge" :button-text="t('tools.video-merge.texts.button')">
    <c-buttons-select
      v-model:value="fps"
      :options="fpsOptions"
      :label="t('tools.video-merge.texts.label-fps')"
      label-width="120px"
      mb-2
    />
    <n-text depth="3" text-sm>{{ t('tools.video-merge.texts.hint') }}</n-text>
  </multi-media-tool-layout>
</template>
