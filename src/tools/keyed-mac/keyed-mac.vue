<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type MacAlgorithm, keyedMac } from './keyed-mac.service';
import type { BytesInputFormat } from '@/components/BytesInput.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { type BytesFormat, bytesToBase64, bytesToHex, parseBytes } from '@/utils/bytes';

const { t } = useI18n();

const algorithm = useQueryParamOrStorage<MacAlgorithm>({
  name: 'algo',
  storageName: 'keyed-mac:algo',
  defaultValue: 'cmac-aes',
});
const keyFormat = useQueryParamOrStorage<BytesFormat>({
  name: 'keyfmt',
  storageName: 'keyed-mac:keyfmt',
  defaultValue: 'hex',
});
const key = ref('2b7e151628aed2a6abf7158809cf4f3c');
const text = ref('6bc1bee22e409f96e93d7e117393172a');
const format = ref<BytesInputFormat>('hex');
const message = ref<Uint8Array>();

const algorithmOptions = [
  { label: 'CMAC-AES', value: 'cmac-aes' },
  { label: 'CMAC-3DES', value: 'cmac-3des' },
  { label: 'Ascon-Mac', value: 'ascon-mac' },
];
const keyFormatOptions = computed(() =>
  (['hex', 'utf8', 'base64', 'latin1'] as BytesFormat[]).map((value) => ({
    label: t(`shared.bytes-input.format-${value}`),
    value,
  })),
);
const keySizes: Record<MacAlgorithm, string> = {
  'cmac-aes': '16, 24, 32',
  'cmac-3des': '16, 24',
  'ascon-mac': '16',
};

const outcome = computed(() => {
  if (!message.value) {
    return {};
  }
  try {
    const keyBytes = parseBytes(key.value, keyFormat.value);
    return { mac: keyedMac(algorithm.value, keyBytes, message.value), keyLength: keyBytes.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
});
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="algorithm"
        :options="algorithmOptions"
        :label="t('tools.keyed-mac.texts.label-algorithm')"
        label-width="110px"
        mb-3
      />
      <c-buttons-select
        v-model:value="keyFormat"
        :options="keyFormatOptions"
        :label="t('tools.keyed-mac.texts.label-key')"
        label-width="110px"
        size="small"
        mb-2
      />
      <c-input-text v-model:value="key" raw-text monospace test-id="key" />
      <n-text depth="3" mt-1 block text-sm>
        {{ t('tools.keyed-mac.texts.hint-key', [keySizes[algorithm]]) }}
      </n-text>
    </c-card>

    <c-card mb-2>
      <bytes-input
        v-model:value="text"
        v-model:format="format"
        :formats="['utf8', 'hex', 'base64', 'latin1', 'file']"
        :label="t('tools.keyed-mac.texts.label-message')"
        :rows="4"
        @update:bytes="message = $event"
      />
    </c-card>

    <c-card>
      <c-alert v-if="outcome.error" type="error" data-test-id="error">{{ outcome.error }}</c-alert>
      <template v-else>
        <input-copyable
          :value="outcome.mac ? bytesToHex(outcome.mac) : ''"
          readonly
          label="Hex"
          label-position="left"
          label-width="80px"
          font-mono
          mb-2
          data-test-id="mac-hex"
        />
        <input-copyable
          :value="outcome.mac ? bytesToBase64(outcome.mac) : ''"
          readonly
          label="Base64"
          label-position="left"
          label-width="80px"
          font-mono
        />
      </template>
    </c-card>
  </div>
</template>
