<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { censorText } from './text-censor.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { getErrorMessageIfThrows } from '@/utils/error';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const wordsToCensor = useQueryParamOrStorage({
  name: 'words',
  storageName: 'text-censor:words',
  defaultValue: 'spam\nспам',
});
const replaceBy = useQueryParamOrStorage<'symbol' | 'word'>({
  name: 'by',
  storageName: 'text-censor:by',
  defaultValue: 'symbol',
});
const censorSymbol = useQueryParamOrStorage({ name: 'sym', storageName: 'text-censor:sym', defaultValue: '█' });
const eachLetter = useQueryParamOrStorage({ name: 'each', storageName: 'text-censor:each', defaultValue: true });
const censorWord = useQueryParamOrStorage({
  name: 'word',
  storageName: 'text-censor:word',
  defaultValue: '[CENSORED]',
});

const replaceByOptions = computed(() => [
  { label: t('tools.text-censor.texts.by-symbol'), value: 'symbol' },
  { label: t('tools.text-censor.texts.by-word'), value: 'word' },
]);

const options = computed(() => ({
  wordsToCensor: wordsToCensor.value,
  censoredBySymbol: replaceBy.value === 'symbol',
  censorSymbol: censorSymbol.value,
  eachLetter: eachLetter.value,
  censorWord: censorWord.value,
}));

const symbolError = computed(() =>
  replaceBy.value === 'symbol'
    ? getErrorMessageIfThrows(() => censorText('x', { ...options.value, wordsToCensor: 'x' }))
    : undefined,
);

function transformer(value: string) {
  return withDefaultOnError(() => censorText(value, options.value), value);
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="wordsToCensor"
        :label="t('tools.text-censor.texts.label-words')"
        :placeholder="t('tools.text-censor.texts.placeholder-words')"
        multiline
        rows="3"
        raw-text
        mb-3
      />
      <c-buttons-select
        v-model:value="replaceBy"
        :options="replaceByOptions"
        :label="t('tools.text-censor.texts.label-replace-by')"
        mb-2
      />
      <n-space v-if="replaceBy === 'symbol'" align="center">
        <c-input-text
          v-model:value="censorSymbol"
          :label="t('tools.text-censor.texts.label-symbol')"
          label-position="left"
          raw-text
        />
        <n-form-item
          :label="t('tools.text-censor.texts.label-each-letter')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="eachLetter" />
        </n-form-item>
      </n-space>
      <c-input-text
        v-else
        v-model:value="censorWord"
        :label="t('tools.text-censor.texts.label-word')"
        label-position="left"
        raw-text
      />
      <c-alert v-if="symbolError" type="warning" mt-2>{{ t('tools.text-censor.texts.warning-symbol') }}</c-alert>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.text-censor.texts.placeholder-input')"
      input-default="Buy now! This is not spam. Это не спам, честно."
    />
  </div>
</template>
