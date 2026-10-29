<script setup lang="ts">
// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/image/generic/change-colors/service.ts (raster images; the
// SVG text replacement is not ported). The result is a PNG, so a transparent target colour is kept.
import { useI18n } from 'vue-i18n';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { imageDataToFile, loadImageData } from '@/utils/canvas-image';
import { type Rgba, hexToRgba, replaceColor, rgbaToHex } from '@/utils/image-pixels';

const { t } = useI18n();

const from = useQueryParamOrStorage({ name: 'from', storageName: 'image-replace-color:from', defaultValue: '#ffffff' });
const to = useQueryParamOrStorage({ name: 'to', storageName: 'image-replace-color:to', defaultValue: '#ff0000' });
const similarity = useQueryParamOrStorage({ name: 'sim', storageName: 'image-replace-color:sim', defaultValue: 10 });

function onPick(color: Rgba) {
  from.value = rgbaToHex(color);
}

async function process([file]: File[]) {
  const image = await loadImageData(file);
  replaceColor(image.data, hexToRgba(from.value), hexToRgba(to.value), similarity.value ?? 10);
  return imageDataToFile(image, outputFileName(file.name, '_recolored', 'png'));
}
</script>

<template>
  <file-tool-layout
    accept="image/*"
    :title="t('shared.media.drop-image')"
    :task="process"
    :button-text="t('tools.image-replace-color.texts.button')"
  >
    <n-space align="center" mb-2>
      <n-form-item
        :label="t('tools.image-replace-color.texts.label-from')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-color-picker v-model:value="from" :modes="['hex']" w-160px />
      </n-form-item>
      <n-form-item :label="t('tools.image-replace-color.texts.label-to')" label-placement="left" :show-feedback="false">
        <n-color-picker v-model:value="to" :modes="['hex']" w-160px />
      </n-form-item>
    </n-space>
    <n-form-item
      :label="t('tools.image-replace-color.texts.label-similarity', [similarity])"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
    >
      <n-slider v-model:value="similarity" :min="0" :max="60" />
    </n-form-item>

    <template #below-input="{ files }">
      <pixel-picker :file="files[0]" @pick="onPick" />
    </template>
  </file-tool-layout>
</template>
