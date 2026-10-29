<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatBytes } from '@/utils/convert';
import { downloadFile, downloadFiles } from '@/utils/file-output';

// `originals`, when given, are the source files in the same order: each row then shows the size before and after.
const props = defineProps<{ files: File[]; zipName: string; originals?: File[] }>();

const { t } = useI18n();

function sizeOf(index: number, file: File) {
  const original = props.originals?.[index];
  if (!original) {
    return formatBytes(file.size);
  }
  const change = original.size ? Math.round(((file.size - original.size) / original.size) * 100) : 0;
  return `${formatBytes(original.size)} → ${formatBytes(file.size)} (${change > 0 ? '+' : ''}${change}%)`;
}
</script>

<template>
  <c-card :title="t('shared.media.results')" mx-auto mt-3 max-w-600px>
    <div
      v-for="(file, index) in files"
      :key="`${index}-${file.name}`"
      mb-1
      flex
      items-center
      gap-2
      data-test-id="result-item"
    >
      <span flex-1 truncate>{{ file.name }}</span>
      <span text-sm op-70>{{ sizeOf(index, file) }}</span>
      <c-button size="small" @click="downloadFile(file)">{{ t('shared.media.download') }}</c-button>
    </div>
    <div mt-3 flex justify-center>
      <c-button data-test-id="download-all" @click="downloadFiles(files, zipName)">{{
        t('shared.media.download-all')
      }}</c-button>
    </div>
  </c-card>
</template>
