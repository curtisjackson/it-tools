<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type CaesarAlphabet, caesarShift, rot13, rotateString } from './rot-cipher.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

type Mode = 'rot13' | 'caesar' | 'rotate';

const mode = useQueryParamOrStorage<Mode>({ name: 'mode', storageName: 'rot-cipher:mode', defaultValue: 'rot13' });
const shift = useQueryParamOrStorage({ name: 'shift', storageName: 'rot-cipher:shift', defaultValue: 3 });
const alphabet = useQueryParamOrStorage<CaesarAlphabet>({
  name: 'abc',
  storageName: 'rot-cipher:abc',
  defaultValue: 'latin',
});
const step = useQueryParamOrStorage({ name: 'step', storageName: 'rot-cipher:step', defaultValue: 1 });
const direction = useQueryParamOrStorage<'right' | 'left'>({
  name: 'dir',
  storageName: 'rot-cipher:dir',
  defaultValue: 'right',
});
const multiLine = useQueryParamOrStorage({ name: 'lines', storageName: 'rot-cipher:lines', defaultValue: true });

const modeOptions = computed(() => [
  { label: 'ROT13', value: 'rot13' },
  { label: t('tools.rot-cipher.texts.mode-caesar'), value: 'caesar' },
  { label: t('tools.rot-cipher.texts.mode-rotate'), value: 'rotate' },
]);
const alphabetOptions = computed(() => [
  { label: t('tools.rot-cipher.texts.alphabet-latin'), value: 'latin' },
  { label: t('tools.rot-cipher.texts.alphabet-cyrillic'), value: 'cyrillic' },
  { label: t('tools.rot-cipher.texts.alphabet-both'), value: 'both' },
]);
const directionOptions = computed(() => [
  { label: t('tools.rot-cipher.texts.direction-left'), value: 'left' },
  { label: t('tools.rot-cipher.texts.direction-right'), value: 'right' },
]);
const hint = computed(() => t(`tools.rot-cipher.texts.hint-${mode.value}`));

function transformer(value: string) {
  switch (mode.value) {
    case 'caesar':
      return caesarShift(value, shift.value ?? 0, alphabet.value);
    case 'rotate':
      return rotateString(value, step.value ?? 0, direction.value === 'right', multiLine.value);
    default:
      return rot13(value);
  }
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.rot-cipher.texts.label-mode')"
        mb-2
      />
      <n-text depth="3" block mb-2 text-sm>{{ hint }}</n-text>

      <n-space v-if="mode === 'caesar'" align="center">
        <n-form-item :label="t('tools.rot-cipher.texts.label-shift')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="shift" :min="-100" :max="100" />
        </n-form-item>
        <c-buttons-select
          v-model:value="alphabet"
          :options="alphabetOptions"
          :label="t('tools.rot-cipher.texts.label-alphabet')"
        />
      </n-space>

      <n-space v-if="mode === 'rotate'" align="center">
        <n-form-item :label="t('tools.rot-cipher.texts.label-step')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="step" :min="0" />
        </n-form-item>
        <c-buttons-select
          v-model:value="direction"
          :options="directionOptions"
          :label="t('tools.rot-cipher.texts.label-direction')"
        />
        <n-form-item
          :label="t('tools.rot-cipher.texts.label-multi-line')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="multiLine" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.rot-cipher.texts.placeholder-input')"
      input-default="Hello, World!"
    />
  </div>
</template>
