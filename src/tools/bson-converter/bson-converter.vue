<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type JsonMode, bsonToJson, jsonToBson } from './bson-converter.service';
import type { BytesInputFormat } from '@/components/BytesInput.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { useValidation } from '@/composable/validation';
import { bytesToBase64, bytesToHex } from '@/utils/bytes';
import { getErrorMessageIfThrows } from '@/utils/error';
import { downloadBlob } from '@/utils/file-output';

const { t } = useI18n();

type Mode = 'deserialize' | 'serialize';

const storage = (name: string) => `bson-converter:${name}`;
const mode = useQueryParamOrStorage<Mode>({ name: 'mode', storageName: storage('mode'), defaultValue: 'deserialize' });
const jsonMode = useQueryParamOrStorage<JsonMode>({
  name: 'json',
  storageName: storage('json'),
  defaultValue: 'relaxed',
});
const indent = useQueryParamOrStorage({ name: 'indent', storageName: storage('indent'), defaultValue: 2 });
const outputFormat = useQueryParamOrStorage<'hex' | 'base64'>({
  name: 'out',
  storageName: storage('out'),
  defaultValue: 'hex',
});

const modeOptions = computed(() => [
  { label: 'BSON → JSON', value: 'deserialize' },
  { label: 'JSON → BSON', value: 'serialize' },
]);
const jsonModeOptions = computed(() => [
  { label: t('tools.bson-converter.texts.json-relaxed'), value: 'relaxed' },
  { label: t('tools.bson-converter.texts.json-canonical'), value: 'canonical' },
]);
const indentOptions = computed(() => [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: t('tools.bson-converter.texts.indent-none'), value: 0 },
]);
const outputFormatOptions = computed(() => [
  { label: 'Hex', value: 'hex' },
  { label: 'Base64', value: 'base64' },
]);

// BSON → JSON
const bytesText = ref('160000000268656c6c6f0006000000776f726c640000');
const bytesFormat = ref<BytesInputFormat>('hex');
const bytes = ref<Uint8Array>();
const deserialized = computed(() => {
  if (!bytes.value) {
    return { json: '', error: undefined };
  }
  try {
    return { json: bsonToJson(bytes.value, { mode: jsonMode.value, indent: indent.value }), error: undefined };
  } catch (error) {
    return { json: '', error: error instanceof Error ? error.message : String(error) };
  }
});

// JSON → BSON
const json = ref(
  '{\n  "_id": { "$oid": "64b7f0c2a1b2c3d4e5f60718" },\n  "name": "Ada",\n  "createdAt": { "$date": "2024-01-02T03:04:05Z" }\n}',
);
const serialized = computed(() => {
  try {
    return jsonToBson(json.value);
  } catch {
    return undefined;
  }
});
const jsonValidation = useValidation({
  source: json,
  rules: [
    {
      validator: (value: string) => jsonToBson(value),
      getErrorMessage: (value: string) => getErrorMessageIfThrows(() => jsonToBson(value)) ?? '',
      message: t('tools.bson-converter.texts.invalid-json', ['{0}']),
    },
  ],
});
const encoded = computed(() =>
  serialized.value
    ? outputFormat.value === 'hex'
      ? bytesToHex(serialized.value)
      : bytesToBase64(serialized.value)
    : '',
);

function download() {
  if (serialized.value) {
    downloadBlob(
      new Blob([serialized.value as Uint8Array<ArrayBuffer>], { type: 'application/bson' }),
      'document.bson',
    );
  }
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.bson-converter.texts.label-mode')"
        label-width="120px"
        mb-2
      />
      <template v-if="mode === 'deserialize'">
        <c-buttons-select
          v-model:value="jsonMode"
          :options="jsonModeOptions"
          :label="t('tools.bson-converter.texts.label-json')"
          label-width="120px"
          mb-2
        />
        <c-buttons-select
          v-model:value="indent"
          :options="indentOptions"
          :label="t('tools.bson-converter.texts.label-indent')"
          label-width="120px"
          mb-2
        />
      </template>
      <c-buttons-select
        v-else
        v-model:value="outputFormat"
        :options="outputFormatOptions"
        :label="t('tools.bson-converter.texts.label-output')"
        label-width="120px"
        mb-2
      />
      <n-text depth="3" block text-sm>{{ t('tools.bson-converter.texts.hint') }}</n-text>
    </c-card>

    <c-card v-if="mode === 'deserialize'">
      <bytes-input
        v-model:value="bytesText"
        v-model:format="bytesFormat"
        :formats="['hex', 'base64', 'file']"
        :label="t('tools.bson-converter.texts.label-bson')"
        @update:bytes="bytes = $event"
      />
      <c-alert v-if="deserialized.error" type="error" mt-3 data-test-id="error">{{ deserialized.error }}</c-alert>
      <n-divider />
      <textarea-copyable
        :value="deserialized.json"
        language="json"
        download-file-name="document.json"
        data-test-id="json-output"
      />
    </c-card>

    <c-card v-else>
      <c-input-text
        v-model:value="json"
        :label="t('tools.bson-converter.texts.label-json-input')"
        :validation="jsonValidation"
        :rows="8"
        multiline
        raw-text
        monospace
        test-id="json-input"
      />
      <n-divider />
      <div mb-2 flex items-center justify-between gap-2>
        <n-text depth="3" text-sm data-test-id="bson-size">{{
          t('tools.bson-converter.texts.size', [serialized?.length ?? 0])
        }}</n-text>
        <c-button :disabled="!serialized?.length" @click="download">{{
          t('tools.bson-converter.texts.download')
        }}</c-button>
      </div>
      <textarea-copyable :value="encoded" word-wrap data-test-id="bson-output" />
    </c-card>
  </div>
</template>
