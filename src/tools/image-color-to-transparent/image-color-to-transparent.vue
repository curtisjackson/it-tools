<script setup lang="ts">
// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/image/generic/create-transparent/index.tsx. Unlike omni-tools
// 0.7.0, which painted the matching pixels with a background colour, they really become transparent, with optional
// soft edges.
import { useI18n } from 'vue-i18n';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { imageDataToFile, loadImageData } from '@/utils/canvas-image';
import { type Rgba, hexToRgba, makeTransparent, rgbaToHex } from '@/utils/image-pixels';

const { t } = useI18n();

const color = useQueryParamOrStorage({
  name: 'color',
  storageName: 'image-color-to-transparent:color',
  defaultValue: '#ffffff',
});
const similarity = useQueryParamOrStorage({
  name: 'sim',
  storageName: 'image-color-to-transparent:sim',
  defaultValue: 10,
});
const softness = useQueryParamOrStorage({
  name: 'soft',
  storageName: 'image-color-to-transparent:soft',
  defaultValue: 5,
});

function onPick([r, g, b]: Rgba) {
  color.value = rgbaToHex([r, g, b, 255]);
}

async function process([file]: File[]) {
  const image = await loadImageData(file);
  makeTransparent(image.data, hexToRgba(color.value), similarity.value ?? 10, softness.value ?? 0);
  return imageDataToFile(image, outputFileName(file.name, '_transparent', 'png'));
}
</script>

<template>
  <file-tool-layout
    accept="image/*"
    :title="t('shared.media.drop-image')"
    :task="process"
    :button-text="t('tools.image-color-to-transparent.texts.button')"
  >
    <n-form-item
      :label="t('tools.image-color-to-transparent.texts.label-color')"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
      mb-2
    >
      <n-color-picker v-model:value="color" :show-alpha="false" :modes="['hex']" w-160px />
    </n-form-item>
    <n-form-item
      :label="t('tools.image-color-to-transparent.texts.label-similarity', [similarity])"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="similarity" :min="0" :max="60" />
    </n-form-item>
    <n-form-item
      :label="t('tools.image-color-to-transparent.texts.label-softness', [softness])"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
    >
      <n-slider v-model:value="softness" :min="0" :max="30" />
    </n-form-item>

    <template #below-input="{ files }">
      <pixel-picker :file="files[0]" @pick="onPick" />
    </template>
  </file-tool-layout>
</template>
