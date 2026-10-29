<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { checkLeapYears } from './leap-year-checker.service';

const { t } = useI18n();

function transformer(value: string) {
  return checkLeapYears(value)
    .map((line) =>
      line.kind === 'invalid'
        ? `❌ ${line.text}: ${t('tools.leap-year-checker.texts.invalid')}`
        : `${line.leap ? '✅' : '➖'} ${line.year}: ${t(line.leap ? 'tools.leap-year-checker.texts.leap' : 'tools.leap-year-checker.texts.not-leap')}`,
    )
    .join('\n');
}
</script>

<template>
  <div>
    <n-text depth="3" block mb-2 text-sm>{{ t('tools.leap-year-checker.texts.hint') }}</n-text>
    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.leap-year-checker.texts.placeholder-input')"
      :input-default="'2024\n1900\n2000\n2025-2028'"
    />
  </div>
</template>
