<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type Rotation, buildRotateFlipArgs } from './video-rotate-flip.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const rotation = useQueryParamOrStorage<Rotation>({
  name: 'rotate',
  storageName: 'video-rotate-flip:rotate',
  defaultValue: 90,
});
const flipHorizontal = useQueryParamOrStorage({
  name: 'fliph',
  storageName: 'video-rotate-flip:fliph',
  defaultValue: false,
});
const flipVertical = useQueryParamOrStorage({
  name: 'flipv',
  storageName: 'video-rotate-flip:flipv',
  defaultValue: false,
});

const rotationOptions = computed(() => [
  { label: t('tools.video-rotate-flip.texts.rotation-none'), value: 0 },
  { label: '90° ↻', value: 90 },
  { label: '180°', value: 180 },
  { label: '90° ↺', value: 270 },
]);
const hasChange = computed(() => rotation.value !== 0 || flipHorizontal.value || flipVertical.value);

async function rotate({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('mp4');
  await exec(
    buildRotateFlipArgs(input, output, {
      rotation: Number(rotation.value) as Rotation,
      flipHorizontal: flipHorizontal.value,
      flipVertical: flipVertical.value,
    }),
  );
  return readOutput(output, outputFileName(source.name, '_rotated', 'mp4'), 'video/mp4');
}
</script>

<template>
  <media-tool-layout
    kind="video"
    :task="rotate"
    :ready="hasChange"
    :button-text="t('tools.video-rotate-flip.texts.button')"
  >
    <c-buttons-select
      v-model:value="rotation"
      :options="rotationOptions"
      :label="t('tools.video-rotate-flip.texts.label-rotation')"
      label-width="120px"
      mb-2
    />
    <n-space>
      <n-form-item
        :label="t('tools.video-rotate-flip.texts.label-flip-horizontal')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-switch v-model:value="flipHorizontal" />
      </n-form-item>
      <n-form-item
        :label="t('tools.video-rotate-flip.texts.label-flip-vertical')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-switch v-model:value="flipVertical" />
      </n-form-item>
    </n-space>
  </media-tool-layout>
</template>
