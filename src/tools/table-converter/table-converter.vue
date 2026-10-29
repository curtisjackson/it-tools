<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type TableFormat, convertTable } from './table-converter.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { getErrorMessageIfThrows } from '@/utils/error';

const { t } = useI18n();

const inputFormat = useQueryParamOrStorage<TableFormat | 'auto'>({
  name: 'from',
  storageName: 'table-converter:from',
  defaultValue: 'auto',
});
const outputFormat = useQueryParamOrStorage<TableFormat>({
  name: 'to',
  storageName: 'table-converter:to',
  defaultValue: 'markdown',
});

const formats: { label: string; value: TableFormat }[] = [
  { label: 'Markdown', value: 'markdown' },
  { label: 'CSV', value: 'csv' },
  { label: 'TSV', value: 'tsv' },
  { label: 'HTML', value: 'html' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'JSON', value: 'json' },
];
const inputOptions = computed(() => [{ label: t('tools.table-converter.texts.auto'), value: 'auto' }, ...formats]);
const outputLanguage = computed(
  () => ({ markdown: 'markdown', html: 'html', json: 'json' })[outputFormat.value as string] ?? '',
);

function transformer(value: string) {
  let output = '';
  const error = getErrorMessageIfThrows(() => {
    output = convertTable(value, {
      autodetect: inputFormat.value === 'auto',
      inputFormat: inputFormat.value === 'auto' ? 'csv' : inputFormat.value,
      outputFormat: outputFormat.value,
    });
  });
  return error ? `❌ ${error}` : output;
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="inputFormat"
        :options="inputOptions"
        :label="t('tools.table-converter.texts.label-from')"
        label-width="80px"
        mb-2
      />
      <c-buttons-select
        v-model:value="outputFormat"
        :options="formats"
        :label="t('tools.table-converter.texts.label-to')"
        label-width="80px"
      />
    </c-card>

    <format-transformer
      :transformer="transformer"
      :output-language="outputLanguage"
      :input-placeholder="t('tools.table-converter.texts.placeholder-input')"
      :input-default="'name,age,city\nAnn,30,Paris\nBob,25,Berlin'"
    />
  </div>
</template>
