<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type CsvIssue, findIncompleteCsvRecords } from './csv-incomplete-records.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type CsvOptions, defaultCsvOptions } from '@/utils/csv';
import { unescapeSeparator } from '@/utils/text-split';

const { t } = useI18n();

const input = ref('name,surname,dob\nJohn,Warner,1990-05-15\nLily,,1993-08-22\nJake,Hall');
const csv = useQueryParamOrStorage<CsvOptions>({
  name: 'csv',
  storageName: 'csv-incomplete-records:csv',
  defaultValue: { ...defaultCsvOptions },
});
const emptyValues = useQueryParamOrStorage({
  name: 'cells',
  storageName: 'csv-incomplete-records:cells',
  defaultValue: true,
});

const issues = computed(() =>
  findIncompleteCsvRecords(input.value, {
    csvSeparator: unescapeSeparator(csv.value.delimiter),
    quoteCharacter: csv.value.quoteChar,
    commentCharacter: csv.value.deleteComment ? csv.value.commentCharacter : '',
    emptyLines: csv.value.deleteEmptyLines,
    emptyValues: emptyValues.value,
  }),
);

function describe(issue: CsvIssue) {
  if (issue.kind === 'empty-line') {
    return t('tools.csv-incomplete-records.texts.issue-empty-line');
  }
  if (issue.kind === 'missing-columns') {
    return t('tools.csv-incomplete-records.texts.issue-missing-columns', [issue.missing]);
  }
  return t('tools.csv-incomplete-records.texts.issue-empty-values', [issue.columns.join(', ')]);
}

const headers = computed(() => [
  { key: 'line', label: t('tools.csv-incomplete-records.texts.header-line') },
  { key: 'problem', label: t('tools.csv-incomplete-records.texts.header-problem') },
]);
const rows = computed(() => issues.value.map((issue) => ({ line: issue.line, problem: describe(issue) })));
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="input"
        :label="t('tools.csv-incomplete-records.texts.label-input')"
        :placeholder="t('tools.csv-incomplete-records.texts.placeholder-input')"
        multiline
        rows="8"
        raw-text
        monospace
        mb-3
      />
      <n-form-item
        :label="t('tools.csv-incomplete-records.texts.label-empty-values')"
        label-placement="left"
        label-width="160"
        :show-feedback="false"
        mb-2
      >
        <n-switch v-model:value="emptyValues" />
      </n-form-item>
      <n-collapse>
        <n-collapse-item :title="t('tools.csv-incomplete-records.texts.title-format')">
          <csv-options v-model:value="csv" />
        </n-collapse-item>
      </n-collapse>
    </c-card>

    <template v-if="input.trim()">
      <n-alert v-if="issues.length === 0" type="success">{{
        t('tools.csv-incomplete-records.texts.complete')
      }}</n-alert>
      <c-card v-else :title="t('tools.csv-incomplete-records.texts.found', [issues.length])">
        <c-table :data="rows" :headers="headers" />
      </c-card>
    </template>
  </div>
</template>
