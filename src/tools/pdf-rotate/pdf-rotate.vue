<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type RotationAngle, rotatePdf } from './pdf-rotate.service';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const angle = useQueryParamOrStorage<RotationAngle>({
  name: 'angle',
  storageName: 'pdf-rotate:angle',
  defaultValue: 90,
});
const pages = useQueryParamOrStorage({ name: 'pages', storageName: 'pdf-rotate:pages', defaultValue: '' });
const angleOptions = [
  { label: '90° ↻', value: 90 },
  { label: '180°', value: 180 },
  { label: '90° ↺', value: 270 },
];

async function rotate([file]: File[]) {
  const bytes = await rotatePdf(await file.arrayBuffer(), Number(angle.value) as RotationAngle, pages.value);
  return new File([bytes as BlobPart], outputFileName(file.name, '_rotated', 'pdf'), { type: 'application/pdf' });
}
</script>

<template>
  <file-tool-layout
    accept=".pdf,application/pdf"
    :title="t('tools.pdf-rotate.texts.drop')"
    :task="rotate"
    :button-text="t('tools.pdf-rotate.texts.button')"
  >
    <c-buttons-select
      v-model:value="angle"
      :options="angleOptions"
      :label="t('tools.pdf-rotate.texts.label-angle')"
      label-width="120px"
      mb-2
    />
    <c-input-text
      v-model:value="pages"
      :label="t('tools.pdf-rotate.texts.label-pages')"
      label-position="left"
      label-width="120px"
      :placeholder="t('tools.pdf-rotate.texts.placeholder-pages')"
      raw-text
    />
  </file-tool-layout>
</template>
