<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { CsvOptions } from '@/utils/csv';

const props = defineProps<{
  value: CsvOptions;
}>();
const emit = defineEmits(['update:value']);

const { t } = useI18n();

const options = useVModel(props, 'value', emit, { passive: true, deep: true });
</script>

<template>
  <div>
    <c-input-text
      v-model:value="options.delimiter"
      :label="t('shared.csv.delimiter')"
      label-position="left"
      label-width="160px"
      label-align="right"
      placeholder=","
      raw-text
      mb-2
    />
    <c-input-text
      v-model:value="options.quoteChar"
      :label="t('shared.csv.quote-char')"
      label-position="left"
      label-width="160px"
      label-align="right"
      placeholder='"'
      raw-text
      mb-2
    />
    <c-input-text
      v-model:value="options.commentCharacter"
      :label="t('shared.csv.comment-character')"
      label-position="left"
      label-width="160px"
      label-align="right"
      placeholder="#"
      raw-text
      mb-2
    />
    <n-form-item
      :label="t('shared.csv.delete-comment')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-switch v-model:value="options.deleteComment" />
    </n-form-item>
    <n-form-item
      :label="t('shared.csv.delete-empty-lines')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-switch v-model:value="options.deleteEmptyLines" />
    </n-form-item>
  </div>
</template>
