<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useValidation } from '@/composable/validation';
import { type BytesFormat, parseBytes } from '@/utils/bytes';
import { getErrorMessageIfThrows } from '@/utils/error';

export type BytesInputFormat = BytesFormat | 'file';

const props = withDefaults(
  defineProps<{
    value: string;
    format: BytesInputFormat;
    formats?: BytesInputFormat[];
    label?: string;
    placeholder?: string;
    rows?: number;
  }>(),
  {
    formats: () => ['utf8', 'hex', 'base64', 'latin1', 'file'],
    label: undefined,
    placeholder: undefined,
    rows: 5,
  },
);
const emit = defineEmits<{
  (event: 'update:value', value: string): void;
  (event: 'update:format', format: BytesInputFormat): void;
  (event: 'update:bytes', bytes: Uint8Array | undefined): void;
}>();

const { t } = useI18n();

const text = useVModel(props, 'value', emit);
const format = useVModel(props, 'format', emit);
const file = ref<File>();
const fileBytes = ref<Uint8Array>();

const formatOptions = computed(() =>
  props.formats.map((value) => ({ value, label: t(`shared.bytes-input.format-${value}`) })),
);

async function onFileUpload(uploaded: File) {
  file.value = uploaded;
  fileBytes.value = new Uint8Array(await uploaded.arrayBuffer());
}

const textBytes = computed(() => {
  if (format.value === 'file') {
    return undefined;
  }
  try {
    return parseBytes(text.value, format.value);
  } catch {
    return undefined;
  }
});

const validation = useValidation({
  source: text,
  rules: [
    {
      message: t('shared.bytes-input.invalid', ['{0}']),
      getErrorMessage: (value: string) =>
        getErrorMessageIfThrows(() => parseBytes(value, format.value as BytesFormat)) ?? '',
      validator: (value: string) => format.value === 'file' || parseBytes(value, format.value),
    },
  ],
  watch: [format],
});

watch(
  [format, textBytes, fileBytes],
  () => emit('update:bytes', format.value === 'file' ? fileBytes.value : textBytes.value),
  { immediate: true },
);
</script>

<template>
  <div>
    <c-buttons-select
      v-model:value="format"
      :options="formatOptions"
      :label="label ?? t('shared.bytes-input.label')"
      size="small"
      mb-2
    />
    <div v-if="format === 'file'">
      <c-file-upload :title="t('shared.bytes-input.file-title')" @file-upload="onFileUpload" />
      <div v-if="file" mt-2 text-center op-70>{{ file.name }} — {{ fileBytes?.length ?? 0 }} B</div>
    </div>
    <c-input-text
      v-else
      v-model:value="text"
      :placeholder="placeholder ?? t('shared.bytes-input.placeholder')"
      :rows="rows"
      :validation="validation"
      :monospace="format === 'hex' || format === 'base64'"
      multiline
      raw-text
    />
  </div>
</template>
