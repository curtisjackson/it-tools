<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useValidation } from '@/composable/validation';
import type { SplitOperatorType } from '@/utils/text-split';

const props = defineProps<{
  splitOperatorType: SplitOperatorType;
  splitSeparator: string;
  label?: string;
}>();
const emit = defineEmits(['update:splitOperatorType', 'update:splitSeparator']);

const { t } = useI18n();

const splitOperatorType = useVModel(props, 'splitOperatorType', emit);
const splitSeparator = useVModel(props, 'splitSeparator', emit);

const operatorOptions = computed(() => [
  { label: t('shared.split-separator.symbol'), value: 'symbol' },
  { label: t('shared.split-separator.regex'), value: 'regex' },
]);

const separatorValidation = useValidation({
  source: splitSeparator,
  rules: [
    {
      message: t('shared.split-separator.invalid-regex'),
      validator: (value: string) => {
        if (splitOperatorType.value !== 'regex') {
          return true;
        }
        new RegExp(value);
        return true;
      },
    },
  ],
  watch: [splitOperatorType],
});
</script>

<template>
  <div>
    <c-buttons-select
      v-model:value="splitOperatorType"
      :options="operatorOptions"
      :label="label ?? t('shared.split-separator.label')"
      label-width="120px"
      size="small"
      mb-2
    />
    <c-input-text
      v-model:value="splitSeparator"
      :label="
        t(splitOperatorType === 'regex' ? 'shared.split-separator.regex-label' : 'shared.split-separator.symbol-label')
      "
      label-position="left"
      label-width="120px"
      label-align="right"
      :placeholder="splitOperatorType === 'regex' ? '\\s*,\\s*' : '\\n'"
      :validation="separatorValidation"
      raw-text
      mb-2
    />
  </div>
</template>
