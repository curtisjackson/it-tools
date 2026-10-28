<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { repeatText } from './text-repeat.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const count = useQueryParamOrStorage({ name: 'count', storageName: 'text-repeat:count', defaultValue: 5 });
const delimiter = useQueryParamOrStorage({ name: 'delim', storageName: 'text-repeat:delim', defaultValue: ' ' });

function transformer(value: string) {
  return repeatText(value, count.value ?? 0, delimiter.value);
}
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center">
        <n-form-item :label="t('tools.text-repeat.texts.label-count')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="count" :min="0" :max="100000" />
        </n-form-item>
        <c-input-text
          v-model:value="delimiter"
          :label="t('tools.text-repeat.texts.label-delimiter')"
          label-position="left"
          :placeholder="t('tools.text-repeat.texts.placeholder-delimiter')"
          raw-text
        />
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.text-repeat.texts.placeholder-input')"
      input-default="Hello"
    />
  </div>
</template>
