<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { arithmeticSeriesSum, generateArithmeticSequence } from './arithmetic-sequence.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const firstTerm = useQueryParamOrStorage({ name: 'first', storageName: 'arithmetic-sequence:first', defaultValue: 1 });
const difference = useQueryParamOrStorage({ name: 'diff', storageName: 'arithmetic-sequence:diff', defaultValue: 2 });
const count = useQueryParamOrStorage({ name: 'count', storageName: 'arithmetic-sequence:count', defaultValue: 10 });
const separator = useQueryParamOrStorage({ name: 'sep', storageName: 'arithmetic-sequence:sep', defaultValue: ', ' });

const sequence = computed(() =>
  generateArithmeticSequence(firstTerm.value ?? 0, difference.value ?? 0, count.value ?? 0, separator.value),
);
const sum = computed(() => arithmeticSeriesSum(firstTerm.value ?? 0, difference.value ?? 0, count.value ?? 0));
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center">
        <n-form-item
          :label="t('tools.arithmetic-sequence.texts.label-first')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="firstTerm" />
        </n-form-item>
        <n-form-item
          :label="t('tools.arithmetic-sequence.texts.label-difference')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="difference" />
        </n-form-item>
        <n-form-item
          :label="t('tools.arithmetic-sequence.texts.label-count')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="count" :min="0" :max="100000" />
        </n-form-item>
        <c-input-text
          v-model:value="separator"
          :label="t('tools.arithmetic-sequence.texts.label-separator')"
          label-position="left"
          raw-text
        />
      </n-space>
    </c-card>

    <c-card :title="t('tools.arithmetic-sequence.texts.title-sequence')" mb-2>
      <textarea-copyable :value="sequence" word-wrap />
    </c-card>
    <input-copyable
      :value="sum"
      :label="t('tools.arithmetic-sequence.texts.label-sum')"
      label-position="left"
      readonly
    />
  </div>
</template>
