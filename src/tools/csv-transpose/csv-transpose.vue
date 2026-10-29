<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { transposeCSV } from './csv-transpose.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type CsvOptions, defaultCsvOptions } from '@/utils/csv';
import { unescapeSeparator } from '@/utils/text-split';

const { t } = useI18n();

const csv = useQueryParamOrStorage<CsvOptions>({
  name: 'csv',
  storageName: 'csv-transpose:csv',
  defaultValue: { ...defaultCsvOptions },
});
const fillEmpty = useQueryParamOrStorage({ name: 'fill', storageName: 'csv-transpose:fill', defaultValue: false });
const fillValue = useQueryParamOrStorage({
  name: 'fillwith',
  storageName: 'csv-transpose:fillwith',
  defaultValue: '-',
});

function transformer(value: string) {
  return transposeCSV(value, {
    separator: unescapeSeparator(csv.value.delimiter),
    quoteChar: csv.value.quoteChar,
    commentCharacter: csv.value.deleteComment ? csv.value.commentCharacter : '',
    customFill: fillEmpty.value,
    customFillValue: fillValue.value,
  });
}
</script>

<template>
  <div>
    <c-card mb-2>
      <csv-options v-model:value="csv" />
      <n-space align="center">
        <n-form-item
          :label="t('tools.csv-transpose.texts.label-fill')"
          label-placement="left"
          label-width="160"
          :show-feedback="false"
        >
          <n-switch v-model:value="fillEmpty" />
        </n-form-item>
        <c-input-text
          v-if="fillEmpty"
          v-model:value="fillValue"
          :label="t('tools.csv-transpose.texts.label-fill-with')"
          label-position="left"
          raw-text
        />
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.csv-transpose.texts.placeholder-input')"
      :input-default="'name,age,city\nAnn,30,Paris\nBob,25'"
    />
  </div>
</template>
