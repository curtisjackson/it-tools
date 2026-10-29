<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type InitialValuesType, convertTsvToJson } from './tsv-to-json.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const storage = (name: string) => `tsv-to-json:${name}`;
const delimiter = useQueryParamOrStorage({ name: 'delim', storageName: storage('delim'), defaultValue: '\\t' });
const quote = useQueryParamOrStorage({ name: 'quote', storageName: storage('quote'), defaultValue: '"' });
const comment = useQueryParamOrStorage({ name: 'comment', storageName: storage('comment'), defaultValue: '#' });
const useHeaders = useQueryParamOrStorage({ name: 'headers', storageName: storage('headers'), defaultValue: true });
const skipEmptyLines = useQueryParamOrStorage({ name: 'skip', storageName: storage('skip'), defaultValue: true });
const dynamicTypes = useQueryParamOrStorage({ name: 'types', storageName: storage('types'), defaultValue: true });
const indentation = useQueryParamOrStorage<InitialValuesType['indentationType']>({
  name: 'indent',
  storageName: storage('indent'),
  defaultValue: 'space',
});
const spaces = useQueryParamOrStorage({ name: 'spaces', storageName: storage('spaces'), defaultValue: 2 });

const indentationOptions = computed(() => [
  { label: t('tools.tsv-to-json.texts.indent-space'), value: 'space' },
  { label: t('tools.tsv-to-json.texts.indent-tab'), value: 'tab' },
  { label: t('tools.tsv-to-json.texts.indent-none'), value: 'none' },
]);

function transformer(value: string) {
  return convertTsvToJson(value, {
    delimiter: delimiter.value,
    quote: quote.value,
    comment: comment.value,
    useHeaders: useHeaders.value,
    skipEmptyLines: skipEmptyLines.value,
    dynamicTypes: dynamicTypes.value,
    indentationType: indentation.value,
    spacesCount: spaces.value ?? 2,
  });
}
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center" mb-2>
        <c-input-text
          v-model:value="delimiter"
          :label="t('tools.tsv-to-json.texts.label-delimiter')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="quote"
          :label="t('tools.tsv-to-json.texts.label-quote')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="comment"
          :label="t('tools.tsv-to-json.texts.label-comment')"
          label-position="left"
          raw-text
        />
      </n-space>
      <n-space mb-2>
        <n-form-item :label="t('tools.tsv-to-json.texts.label-headers')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="useHeaders" />
        </n-form-item>
        <n-form-item :label="t('tools.tsv-to-json.texts.label-types')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="dynamicTypes" />
        </n-form-item>
        <n-form-item
          :label="t('tools.tsv-to-json.texts.label-skip-empty')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="skipEmptyLines" />
        </n-form-item>
      </n-space>
      <n-space align="center">
        <c-buttons-select
          v-model:value="indentation"
          :options="indentationOptions"
          :label="t('tools.tsv-to-json.texts.label-indent')"
        />
        <n-input-number-i18n v-if="indentation === 'space'" v-model:value="spaces" :min="1" :max="8" />
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.tsv-to-json.texts.placeholder-input')"
      :input-default="'name\tage\tadmin\nAnn\t30\ttrue\nBob\t25\tfalse'"
      output-language="json"
    />
  </div>
</template>
