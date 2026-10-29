<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type NumberExtractionType, compute } from './numbers-sum.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const extraction = useQueryParamOrStorage<NumberExtractionType>({
  name: 'mode',
  storageName: 'numbers-sum:mode',
  defaultValue: 'smart',
});
const separator = useQueryParamOrStorage({ name: 'sep', storageName: 'numbers-sum:sep', defaultValue: '\\n' });
const runningSum = useQueryParamOrStorage({ name: 'running', storageName: 'numbers-sum:running', defaultValue: false });

const extractionOptions = computed(() => [
  { label: t('tools.numbers-sum.texts.mode-smart'), value: 'smart' },
  { label: t('tools.numbers-sum.texts.mode-delimiter'), value: 'delimiter' },
]);

function transformer(value: string) {
  return compute(value, extraction.value, runningSum.value, separator.value);
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="extraction"
        :options="extractionOptions"
        :label="t('tools.numbers-sum.texts.label-mode')"
        mb-2
      />
      <n-text depth="3" block mb-2 text-sm>
        {{
          extraction === 'smart' ? t('tools.numbers-sum.texts.hint-smart') : t('tools.numbers-sum.texts.hint-delimiter')
        }}
      </n-text>
      <n-space align="center">
        <c-input-text
          v-if="extraction === 'delimiter'"
          v-model:value="separator"
          :label="t('tools.numbers-sum.texts.label-separator')"
          label-position="left"
          raw-text
        />
        <n-form-item
          :label="t('tools.numbers-sum.texts.label-running-sum')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="runningSum" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.numbers-sum.texts.placeholder-input')"
      input-default="Coffee 3.50, sandwich 6.20, tip 1.30"
    />
  </div>
</template>
