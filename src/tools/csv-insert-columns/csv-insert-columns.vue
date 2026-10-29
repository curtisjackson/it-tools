<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { main } from './csv-insert-columns.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type CsvOptions, defaultCsvOptions } from '@/utils/csv';
import { unescapeSeparator } from '@/utils/text-split';

const { t } = useI18n();

type Position = 'prepend' | 'append' | 'header' | 'index';

const storage = (name: string) => `csv-insert-columns:${name}`;
const csv = useQueryParamOrStorage<CsvOptions>({
  name: 'csv',
  storageName: storage('csv'),
  defaultValue: { ...defaultCsvOptions },
});
const columns = useQueryParamOrStorage({
  name: 'insert',
  storageName: storage('insert'),
  defaultValue: 'email\nann@example.com\nbob@example.com',
});
const position = useQueryParamOrStorage<Position>({ name: 'pos', storageName: storage('pos'), defaultValue: 'append' });
const headerName = useQueryParamOrStorage({ name: 'after', storageName: storage('after'), defaultValue: 'name' });
const index = useQueryParamOrStorage({ name: 'index', storageName: storage('index'), defaultValue: 1 });
const fillValue = useQueryParamOrStorage({ name: 'fill', storageName: storage('fill'), defaultValue: '' });

const positionOptions = computed(() => [
  { label: t('tools.csv-insert-columns.texts.position-prepend'), value: 'prepend' },
  { label: t('tools.csv-insert-columns.texts.position-append'), value: 'append' },
  { label: t('tools.csv-insert-columns.texts.position-header'), value: 'header' },
  { label: t('tools.csv-insert-columns.texts.position-index'), value: 'index' },
]);

function transformer(value: string) {
  return main(value, {
    csvToInsert: columns.value,
    separator: unescapeSeparator(csv.value.delimiter),
    quoteChar: csv.value.quoteChar,
    commentCharacter: csv.value.deleteComment ? csv.value.commentCharacter : '',
    customFill: fillValue.value !== '',
    customFillValue: fillValue.value,
    insertingPosition: position.value === 'prepend' || position.value === 'append' ? position.value : 'custom',
    customPostionOptions: position.value === 'header' ? 'headerName' : 'rowNumber',
    headerName: headerName.value,
    rowNumber: index.value ?? 0,
  });
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="columns"
        :label="t('tools.csv-insert-columns.texts.label-columns')"
        :placeholder="t('tools.csv-insert-columns.texts.placeholder-columns')"
        multiline
        rows="4"
        raw-text
        monospace
        mb-3
      />
      <c-buttons-select
        v-model:value="position"
        :options="positionOptions"
        :label="t('tools.csv-insert-columns.texts.label-position')"
        mb-2
      />
      <n-space align="center" mb-2>
        <c-input-text
          v-if="position === 'header'"
          v-model:value="headerName"
          :label="t('tools.csv-insert-columns.texts.label-header')"
          label-position="left"
          raw-text
        />
        <n-form-item
          v-if="position === 'index'"
          :label="t('tools.csv-insert-columns.texts.label-index')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="index" :min="0" />
        </n-form-item>
        <c-input-text
          v-model:value="fillValue"
          :label="t('tools.csv-insert-columns.texts.label-fill')"
          label-position="left"
          :placeholder="t('tools.csv-insert-columns.texts.placeholder-fill')"
          raw-text
        />
      </n-space>
      <n-collapse>
        <n-collapse-item :title="t('tools.csv-insert-columns.texts.title-format')">
          <csv-options v-model:value="csv" />
        </n-collapse-item>
      </n-collapse>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.csv-insert-columns.texts.placeholder-input')"
      :input-default="'name,age\nAnn,30\nBob,25'"
    />
  </div>
</template>
