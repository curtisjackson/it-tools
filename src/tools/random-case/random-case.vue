<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { alternateCase, randomizeCase } from './random-case.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const mode = useQueryParamOrStorage<'random' | 'alternate'>({
  name: 'mode',
  storageName: 'random-case:mode',
  defaultValue: 'random',
});
const modeOptions = computed(() => [
  { label: t('tools.random-case.texts.mode-random'), value: 'random' },
  { label: t('tools.random-case.texts.mode-alternate'), value: 'alternate' },
]);

// Read by the transformer so that "Shuffle again" recomputes the output.
const seed = ref(0);

function transformer(value: string) {
  void seed.value;
  return mode.value === 'alternate' ? alternateCase(value) : randomizeCase(value);
}
</script>

<template>
  <div>
    <c-card mb-2>
      <div flex flex-wrap items-center justify-between gap-2>
        <c-buttons-select
          v-model:value="mode"
          :options="modeOptions"
          :label="t('tools.random-case.texts.label-mode')"
        />
        <c-button v-if="mode === 'random'" @click="seed++">{{ t('tools.random-case.texts.button-again') }}</c-button>
      </div>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.random-case.texts.placeholder-input')"
      input-default="The quick brown fox jumps over the lazy dog."
    />
  </div>
</template>
