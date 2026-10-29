<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, createPalindromeList, palindromeReport } from './palindrome.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const mode = useQueryParamOrStorage<'check' | 'create'>({
  name: 'mode',
  storageName: 'palindrome:mode',
  defaultValue: 'check',
});
const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: 'palindrome:split',
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: 'palindrome:sep', defaultValue: '\\n' });
const lettersOnly = useQueryParamOrStorage({ name: 'letters', storageName: 'palindrome:letters', defaultValue: true });
const lastChar = useQueryParamOrStorage({ name: 'last', storageName: 'palindrome:last', defaultValue: true });
const multiLine = useQueryParamOrStorage({ name: 'lines', storageName: 'palindrome:lines', defaultValue: true });

const modeOptions = computed(() => [
  { label: t('tools.palindrome.texts.mode-check'), value: 'check' },
  { label: t('tools.palindrome.texts.mode-create'), value: 'create' },
]);

function transformer(value: string) {
  if (mode.value === 'create') {
    return createPalindromeList(value, lastChar.value, multiLine.value);
  }
  return withDefaultOnError(
    () => palindromeReport(splitOperatorType.value, value, splitSeparator.value, lettersOnly.value),
    '',
  );
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.palindrome.texts.label-mode')"
        mb-3
      />

      <div v-if="mode === 'check'">
        <split-separator-options
          v-model:split-operator-type="splitOperatorType"
          v-model:split-separator="splitSeparator"
        />
        <n-form-item
          :label="t('tools.palindrome.texts.label-letters-only')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="lettersOnly" />
        </n-form-item>
      </div>

      <n-space v-else>
        <n-form-item :label="t('tools.palindrome.texts.label-last-char')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="lastChar" />
        </n-form-item>
        <n-form-item
          :label="t('tools.palindrome.texts.label-multi-line')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="multiLine" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.palindrome.texts.placeholder-input')"
      :input-default="'level\nhello\nА роза упала на лапу Азора'"
    />
  </div>
</template>
