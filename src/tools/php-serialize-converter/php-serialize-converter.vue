<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { jsonToPhp, phpToJson } from './php-serialize-converter.service';
import type { UseValidationRule } from '@/composable/validation';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

type Mode = 'serialize' | 'unserialize';

const mode = useQueryParamOrStorage<Mode>({
  name: 'mode',
  storageName: 'php-serialize-converter:mode',
  defaultValue: 'unserialize',
});
const indent = useQueryParamOrStorage({
  name: 'indent',
  storageName: 'php-serialize-converter:indent',
  defaultValue: '2',
});

const modeOptions = computed(() => [
  { label: t('tools.php-serialize-converter.texts.mode-unserialize'), value: 'unserialize' },
  { label: t('tools.php-serialize-converter.texts.mode-serialize'), value: 'serialize' },
]);
const indentOptions = computed(() => [
  { label: '2', value: '2' },
  { label: '4', value: '4' },
  { label: 'Tab', value: 'tab' },
  { label: t('tools.php-serialize-converter.texts.indent-none'), value: 'none' },
]);
const indentation = computed(() => ({ 2: '  ', 4: '    ', tab: '\t', none: '' })[indent.value] ?? '  ');

function convert(value: string) {
  return mode.value === 'serialize' ? jsonToPhp(value) : phpToJson(value, indentation.value);
}

function transformer(value: string) {
  try {
    return convert(value);
  } catch {
    return '';
  }
}

const rules: UseValidationRule<string>[] = [
  {
    validator: (value) => {
      convert(value);
      return true;
    },
    getErrorMessage: (value) => {
      try {
        convert(value);
        return '';
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    message: '{0}',
  },
];

const jsonExample =
  '{\n  "name": "Сергей",\n  "roles": ["admin", "editor"],\n  "user": { "__class": "App\\\\User", "id": 42 }\n}';
const examples: Record<Mode, string> = { serialize: jsonExample, unserialize: jsonToPhp(jsonExample) };
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.php-serialize-converter.texts.label-mode')"
        mb-2
      />
      <c-buttons-select
        v-if="mode === 'unserialize'"
        v-model:value="indent"
        :options="indentOptions"
        :label="t('tools.php-serialize-converter.texts.label-indent')"
        mb-2
      />
      <n-text depth="3" block text-sm>{{ t('tools.php-serialize-converter.texts.hint') }}</n-text>
    </c-card>

    <format-transformer
      :key="mode"
      :input-label="t(`tools.php-serialize-converter.texts.input-${mode}`)"
      :output-label="t(`tools.php-serialize-converter.texts.output-${mode}`)"
      :output-language="mode === 'unserialize' ? 'json' : ''"
      :input-default="examples[mode]"
      :input-validation-rules="rules"
      :transformer="transformer"
    />
  </div>
</template>
