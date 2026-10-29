<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { changeCsvSeparator } from './csv-separator-converter.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type CsvOptions, defaultCsvOptions } from '@/utils/csv';

const { t } = useI18n();

const csv = useQueryParamOrStorage<CsvOptions>({
  name: 'csv',
  storageName: 'csv-separator-converter:csv',
  defaultValue: { ...defaultCsvOptions },
});
const outputSeparator = useQueryParamOrStorage({
  name: 'out',
  storageName: 'csv-separator-converter:out',
  defaultValue: ';',
});
const outputQuote = useQueryParamOrStorage({
  name: 'quote',
  storageName: 'csv-separator-converter:quote',
  defaultValue: '"',
});
const quoteAll = useQueryParamOrStorage({
  name: 'all',
  storageName: 'csv-separator-converter:all',
  defaultValue: false,
});

const example = ['name,city', 'Ann,"Paris; France"', 'Bob,Berlin'].join('\n');

function transformer(value: string) {
  return changeCsvSeparator(value, {
    inputSeparator: csv.value.delimiter,
    inputQuoteCharacter: csv.value.quoteChar,
    commentCharacter: csv.value.deleteComment ? csv.value.commentCharacter : '',
    emptyLines: csv.value.deleteEmptyLines,
    outputSeparator: outputSeparator.value,
    outputQuoteAll: quoteAll.value,
    OutputQuoteCharacter: outputQuote.value,
  });
}
</script>

<template>
  <div>
    <n-space :wrap="true" mb-2 justify="center">
      <c-card :title="t('tools.csv-separator-converter.texts.title-input')">
        <csv-options v-model:value="csv" />
      </c-card>
      <c-card :title="t('tools.csv-separator-converter.texts.title-output')">
        <c-input-text
          v-model:value="outputSeparator"
          :label="t('tools.csv-separator-converter.texts.label-separator')"
          label-position="left"
          label-width="160px"
          label-align="right"
          raw-text
          mb-2
        />
        <c-input-text
          v-model:value="outputQuote"
          :label="t('tools.csv-separator-converter.texts.label-quote')"
          label-position="left"
          label-width="160px"
          label-align="right"
          raw-text
          mb-2
        />
        <n-form-item
          :label="t('tools.csv-separator-converter.texts.label-quote-all')"
          label-placement="left"
          label-width="160"
          :show-feedback="false"
        >
          <n-switch v-model:value="quoteAll" />
        </n-form-item>
        <n-text depth="3" text-sm>{{ t('tools.csv-separator-converter.texts.hint') }}</n-text>
      </c-card>
    </n-space>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.csv-separator-converter.texts.placeholder-input')"
      :input-default="example"
    />
  </div>
</template>
