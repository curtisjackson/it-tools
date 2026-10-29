<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { csvColumnsSwap } from './csv-swap-columns.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type CsvOptions, defaultCsvOptions } from '@/utils/csv';
import { getErrorMessageIfThrows } from '@/utils/error';
import { unescapeSeparator } from '@/utils/text-split';

const { t } = useI18n();

const storage = (name: string) => `csv-swap-columns:${name}`;
const csv = useQueryParamOrStorage<CsvOptions>({
  name: 'csv',
  storageName: storage('csv'),
  defaultValue: { ...defaultCsvOptions },
});
const by = useQueryParamOrStorage<'position' | 'header'>({
  name: 'by',
  storageName: storage('by'),
  defaultValue: 'position',
});
const fromPosition = useQueryParamOrStorage({ name: 'from', storageName: storage('from'), defaultValue: 1 });
const toPosition = useQueryParamOrStorage({ name: 'to', storageName: storage('to'), defaultValue: 2 });
const fromHeader = useQueryParamOrStorage({ name: 'fromh', storageName: storage('fromh'), defaultValue: '' });
const toHeader = useQueryParamOrStorage({ name: 'toh', storageName: storage('toh'), defaultValue: '' });

const byOptions = computed(() => [
  { label: t('tools.csv-swap-columns.texts.by-position'), value: 'position' },
  { label: t('tools.csv-swap-columns.texts.by-header'), value: 'header' },
]);

function transformer(value: string) {
  let output = '';
  const error = getErrorMessageIfThrows(() => {
    output = csvColumnsSwap(value, {
      fromPositionStatus: by.value === 'position',
      fromPosition: String(fromPosition.value ?? ''),
      toPositionStatus: by.value === 'position',
      toPosition: String(toPosition.value ?? ''),
      fromHeader: fromHeader.value,
      toHeader: toHeader.value,
      emptyValuesFilling: true,
      customFiller: '',
      deleteComment: csv.value.deleteComment,
      commentCharacter: csv.value.commentCharacter,
      emptyLines: csv.value.deleteEmptyLines,
      separator: unescapeSeparator(csv.value.delimiter),
      quoteChar: csv.value.quoteChar,
    });
  });
  return error ? `❌ ${error}` : output;
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="by"
        :options="byOptions"
        :label="t('tools.csv-swap-columns.texts.label-by')"
        mb-2
      />
      <n-space v-if="by === 'position'" align="center" mb-2>
        <n-form-item
          :label="t('tools.csv-swap-columns.texts.label-from')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="fromPosition" :min="1" />
        </n-form-item>
        <n-form-item :label="t('tools.csv-swap-columns.texts.label-to')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="toPosition" :min="1" />
        </n-form-item>
      </n-space>
      <n-space v-else align="center" mb-2>
        <c-input-text
          v-model:value="fromHeader"
          :label="t('tools.csv-swap-columns.texts.label-from')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="toHeader"
          :label="t('tools.csv-swap-columns.texts.label-to')"
          label-position="left"
          raw-text
        />
      </n-space>
      <n-collapse>
        <n-collapse-item :title="t('tools.csv-swap-columns.texts.title-format')">
          <csv-options v-model:value="csv" />
        </n-collapse-item>
      </n-collapse>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.csv-swap-columns.texts.placeholder-input')"
      :input-default="'id,name,age\n1,Ann,30\n2,Bob,25'"
    />
  </div>
</template>
