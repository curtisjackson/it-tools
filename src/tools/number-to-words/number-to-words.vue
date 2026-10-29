<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type LetterCase, languageForLocale, numberToWords } from './number-to-words.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t, locale } = useI18n();

const language = useQueryParamOrStorage({ name: 'lang', storageName: 'number-to-words:lang', defaultValue: '' });
const currency = useQueryParamOrStorage({ name: 'money', storageName: 'number-to-words:money', defaultValue: false });
const kopecksInDigits = useQueryParamOrStorage({
  name: 'kop',
  storageName: 'number-to-words:kop',
  defaultValue: false,
});
const letterCase = useQueryParamOrStorage<LetterCase>({
  name: 'case',
  storageName: 'number-to-words:case',
  defaultValue: 'sentence',
});

const effectiveLanguage = computed(() => language.value || languageForLocale(locale.value));

const languageOptions = [
  { label: 'Русский', value: 'ru' },
  { label: 'English (US)', value: 'en-US' },
  { label: 'English (UK)', value: 'en-GB' },
  { label: 'Українська', value: 'uk-UA' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Português (BR)', value: 'pt-BR' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Türkçe', value: 'tr-TR' },
  { label: '中文', value: 'zh-CN' },
  { label: '한국어', value: 'ko-KR' },
  { label: 'हिन्दी', value: 'hi-IN' },
];
const caseOptions = computed(() => [
  { label: t('tools.number-to-words.texts.case-sentence'), value: 'sentence' },
  { label: t('tools.number-to-words.texts.case-lower'), value: 'lower' },
  { label: t('tools.number-to-words.texts.case-upper'), value: 'upper' },
  { label: t('tools.number-to-words.texts.case-title'), value: 'title' },
]);

function transformer(value: string) {
  return numberToWords(value, {
    language: effectiveLanguage.value,
    currency: currency.value,
    kopecksInDigits: kopecksInDigits.value,
    letterCase: letterCase.value,
  });
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-select
        :value="effectiveLanguage"
        :options="languageOptions"
        :label="t('tools.number-to-words.texts.label-language')"
        label-position="left"
        label-width="120px"
        mb-2
        @update:value="(value: string) => (language = value)"
      />
      <c-buttons-select
        v-model:value="letterCase"
        :options="caseOptions"
        :label="t('tools.number-to-words.texts.label-case')"
        label-width="120px"
        mb-2
      />
      <n-space>
        <n-form-item
          :label="t('tools.number-to-words.texts.label-currency')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="currency" />
        </n-form-item>
        <n-form-item
          v-if="currency && effectiveLanguage === 'ru'"
          :label="t('tools.number-to-words.texts.label-kopecks-in-digits')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="kopecksInDigits" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.number-to-words.texts.placeholder-input')"
      :input-default="'1234.5\n2021\n1000000'"
    />
  </div>
</template>
