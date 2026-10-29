<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type Orientation, type PageSize, type PdfImage, imagesToPdf } from './images-to-pdf.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const pageSize = useQueryParamOrStorage<PageSize>({
  name: 'size',
  storageName: 'images-to-pdf:size',
  defaultValue: 'a4',
});
const orientation = useQueryParamOrStorage<Orientation>({
  name: 'orient',
  storageName: 'images-to-pdf:orient',
  defaultValue: 'auto',
});
const margin = useQueryParamOrStorage({ name: 'margin', storageName: 'images-to-pdf:margin', defaultValue: 10 });

const sizeOptions = computed(() => [
  { label: 'A4', value: 'a4' },
  { label: 'Letter', value: 'letter' },
  { label: t('tools.images-to-pdf.texts.size-fit'), value: 'fit' },
]);
const orientationOptions = computed(() => [
  { label: t('tools.images-to-pdf.texts.orientation-auto'), value: 'auto' },
  { label: t('tools.images-to-pdf.texts.orientation-portrait'), value: 'portrait' },
  { label: t('tools.images-to-pdf.texts.orientation-landscape'), value: 'landscape' },
]);

/** JPEG and PNG are embedded as they are; HEIC and the other formats the browser decodes are converted to PNG. */
async function toPdfImage(file: File): Promise<PdfImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (/jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name)) {
    return { kind: 'jpg', bytes };
  }
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
    return { kind: 'png', bytes };
  }
  if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    const { default: heicConvert } = await import('heic-convert/browser');
    return { kind: 'png', bytes: new Uint8Array(await heicConvert({ buffer: bytes as never, format: 'PNG' })) };
  }
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  return {
    kind: 'png',
    bytes: new Uint8Array(await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer()),
  };
}

async function convert(files: File[], { onProgress }: FileTaskContext) {
  const images: PdfImage[] = [];
  for (const [index, file] of files.entries()) {
    images.push(await toPdfImage(file));
    onProgress((index + 1) / (files.length + 1));
  }
  const bytes = await imagesToPdf(images, {
    pageSize: pageSize.value,
    orientation: orientation.value,
    margin: margin.value ?? 0,
  });
  return new File([bytes as BlobPart], 'images.pdf', { type: 'application/pdf' });
}
</script>

<template>
  <file-tool-layout
    accept="image/*,.heic,.heif"
    multiple
    :task="convert"
    :button-text="t('tools.images-to-pdf.texts.button')"
  >
    <c-buttons-select
      v-model:value="pageSize"
      :options="sizeOptions"
      :label="t('tools.images-to-pdf.texts.label-size')"
      label-width="120px"
      mb-2
    />
    <c-buttons-select
      v-if="pageSize !== 'fit'"
      v-model:value="orientation"
      :options="orientationOptions"
      :label="t('tools.images-to-pdf.texts.label-orientation')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      :label="t('tools.images-to-pdf.texts.label-margin')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-input-number-i18n v-model:value="margin" :min="0" :max="100" />
    </n-form-item>
  </file-tool-layout>
</template>
