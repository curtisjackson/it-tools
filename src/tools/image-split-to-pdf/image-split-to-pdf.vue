<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { PDFDocument } from 'pdf-lib';
import { PAGE_FORMATS, type PageFormat, computeTiles, millimetresToPoints } from './image-split-to-pdf.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { canvasToBlob } from '@/utils/pdfjs';

const { t } = useI18n();

const storage = (name: string) => `image-split-to-pdf:${name}`;
const format = useQueryParamOrStorage<PageFormat>({ name: 'page', storageName: storage('page'), defaultValue: 'A4' });
const landscape = useQueryParamOrStorage({ name: 'landscape', storageName: storage('landscape'), defaultValue: false });
const margin = useQueryParamOrStorage({ name: 'margin', storageName: storage('margin'), defaultValue: 10 });
const scaleMode = useQueryParamOrStorage<'fit-width' | 'dpi'>({
  name: 'scale',
  storageName: storage('scale'),
  defaultValue: 'fit-width',
});
const dpi = useQueryParamOrStorage({ name: 'dpi', storageName: storage('dpi'), defaultValue: 150 });

const formatOptions = (Object.keys(PAGE_FORMATS) as PageFormat[]).map((value) => ({ label: value, value }));
const scaleOptions = computed(() => [
  { label: t('tools.image-split-to-pdf.texts.scale-fit-width'), value: 'fit-width' },
  { label: t('tools.image-split-to-pdf.texts.scale-dpi'), value: 'dpi' },
]);

async function split([file]: File[], { onProgress }: FileTaskContext) {
  const bitmap = await createImageBitmap(file);
  const [width, height] = PAGE_FORMATS[format.value];
  const [pageWidth, pageHeight] = landscape.value ? [height, width] : [width, height];
  const tiles = computeTiles(
    bitmap.width,
    bitmap.height,
    pageWidth,
    pageHeight,
    millimetresToPoints(margin.value ?? 0),
    scaleMode.value === 'dpi' ? { mode: 'dpi', dpi: dpi.value ?? 150 } : { mode: 'fit-width' },
  );
  const pdf = await PDFDocument.create();
  for (const [index, tile] of tiles.entries()) {
    const canvas = document.createElement('canvas');
    canvas.width = tile.sw;
    canvas.height = tile.sh;
    canvas.getContext('2d')!.drawImage(bitmap, tile.sx, tile.sy, tile.sw, tile.sh, 0, 0, tile.sw, tile.sh);
    const image = await pdf.embedPng(await (await canvasToBlob(canvas, 'image/png')).arrayBuffer());
    pdf
      .addPage([pageWidth, pageHeight])
      .drawImage(image, { x: tile.x, y: tile.y, width: tile.width, height: tile.height });
    onProgress((index + 1) / tiles.length);
  }
  bitmap.close();
  return new File([(await pdf.save()) as BlobPart], outputFileName(file.name, '', 'pdf'), { type: 'application/pdf' });
}
</script>

<template>
  <file-tool-layout
    accept="image/*"
    :title="t('tools.image-split-to-pdf.texts.drop')"
    :task="split"
    :button-text="t('tools.image-split-to-pdf.texts.button')"
  >
    <c-buttons-select
      v-model:value="format"
      :options="formatOptions"
      :label="t('tools.image-split-to-pdf.texts.label-page')"
      label-width="120px"
      mb-2
    />
    <n-space align="center" mb-2>
      <n-form-item
        :label="t('tools.image-split-to-pdf.texts.label-landscape')"
        label-placement="left"
        label-width="120"
        :show-feedback="false"
      >
        <n-switch v-model:value="landscape" />
      </n-form-item>
      <n-form-item
        :label="t('tools.image-split-to-pdf.texts.label-margin')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-input-number-i18n v-model:value="margin" :min="0" :max="50" />
      </n-form-item>
    </n-space>
    <c-buttons-select
      v-model:value="scaleMode"
      :options="scaleOptions"
      :label="t('tools.image-split-to-pdf.texts.label-scale')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      v-if="scaleMode === 'dpi'"
      :label="t('tools.image-split-to-pdf.texts.label-dpi')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
      mb-2
    >
      <n-input-number-i18n v-model:value="dpi" :min="20" :max="1200" :step="10" />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.image-split-to-pdf.texts.hint') }}</n-text>
  </file-tool-layout>
</template>
