<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { reverseText } from './text-reverse.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const multiLine = useQueryParamOrStorage({ name: 'lines', storageName: 'text-reverse:lines', defaultValue: true });
const skipEmptyLines = useQueryParamOrStorage({ name: 'skip', storageName: 'text-reverse:skip', defaultValue: false });
const trim = useQueryParamOrStorage({ name: 'trim', storageName: 'text-reverse:trim', defaultValue: false });

function transformer(value: string) {
  return reverseText(value, {
    multiLine: multiLine.value,
    skipEmptyLines: skipEmptyLines.value,
    trim: trim.value,
  });
}
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space>
        <n-form-item
          :label="t('tools.text-reverse.texts.label-multi-line')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="multiLine" />
        </n-form-item>
        <n-form-item
          :label="t('tools.text-reverse.texts.label-skip-empty-lines')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="skipEmptyLines" />
        </n-form-item>
        <n-form-item :label="t('tools.text-reverse.texts.label-trim')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="trim" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.text-reverse.texts.placeholder-input')"
      input-default="Hello World"
    />
  </div>
</template>
