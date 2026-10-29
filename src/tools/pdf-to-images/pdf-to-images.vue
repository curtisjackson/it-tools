<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type PageImageFormat, dpiToScale, pageImageName } from './pdf-to-images.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { parsePageRanges } from '@/utils/page-ranges';
import { canvasToBlob, loadPdf } from '@/utils/pdfjs';

const { t } = useI18n();

const format = useQueryParamOrStorage<PageImageFormat>({
  name: 'fmt',
  storageName: 'pdf-to-images:fmt',
  defaultValue: 'png',
});
const dpi = useQueryParamOrStorage({ name: 'dpi', storageName: 'pdf-to-images:dpi', defaultValue: 150 });
const quality = useQueryParamOrStorage({ name: 'q', storageName: 'pdf-to-images:q', defaultValue: 90 });
const pages = useQueryParamOrStorage({ name: 'pages', storageName: 'pdf-to-images:pages', defaultValue: '' });

const formatOptions = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
];
const dpiOptions = [72, 150, 300].map((value) => ({ label: `${value} dpi`, value }));

async function render([file]: File[], { onProgress, signal }: FileTaskContext) {
  const pdf = await loadPdf(await file.arrayBuffer());
  const selected = parsePageRanges(pages.value, pdf.numPages);
  const images: File[] = [];
  for (const [index, number] of selected.entries()) {
    if (signal.aborted) {
      break;
    }
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: dpiToScale(dpi.value ?? 150) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d')!;
    if (format.value === 'jpeg') {
      // JPEG has no transparency: paint the page white first.
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: context, viewport }).promise;
    const type = format.value === 'jpeg' ? 'image/jpeg' : 'image/png';
    images.push(
      new File(
        [await canvasToBlob(canvas, type, (quality.value ?? 90) / 100)],
        pageImageName(file.name, number, pdf.numPages, format.value),
        { type },
      ),
    );
    onProgress((index + 1) / selected.length);
  }
  await pdf.destroy();
  return images;
}
</script>

<template>
  <file-tool-layout
    accept=".pdf,application/pdf"
    :title="t('tools.pdf-to-images.texts.drop')"
    :task="render"
    :button-text="t('tools.pdf-to-images.texts.button')"
  >
    <c-buttons-select
      v-model:value="format"
      :options="formatOptions"
      :label="t('tools.pdf-to-images.texts.label-format')"
      label-width="120px"
      mb-2
    />
    <c-buttons-select
      v-model:value="dpi"
      :options="dpiOptions"
      :label="t('tools.pdf-to-images.texts.label-dpi')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      v-if="format === 'jpeg'"
      :label="t('tools.pdf-to-images.texts.label-quality', [quality])"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="quality" :min="40" :max="100" :step="5" />
    </n-form-item>
    <c-input-text
      v-model:value="pages"
      :label="t('tools.pdf-to-images.texts.label-pages')"
      label-position="left"
      label-width="120px"
      :placeholder="t('tools.pdf-to-images.texts.placeholder-pages')"
      raw-text
    />
  </file-tool-layout>
</template>
