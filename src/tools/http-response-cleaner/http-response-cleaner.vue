<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  type DechunkMode,
  type HttpCleanResult,
  bodyCharset,
  bodyText,
  cleanHttpResponse,
} from './http-response-cleaner.service';
import type { BytesInputFormat } from '@/components/BytesInput.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { formatBytes } from '@/utils/convert';
import { downloadBlob } from '@/utils/file-output';

const { t } = useI18n();

const dechunkMode = useQueryParamOrStorage<DechunkMode>({
  name: 'dechunk',
  storageName: 'http-response-cleaner:dechunk',
  defaultValue: 'auto',
});
const decompress = useQueryParamOrStorage({
  name: 'decompress',
  storageName: 'http-response-cleaner:decompress',
  defaultValue: true,
});

const text = ref(
  'HTTP/1.1 200 OK\r\nContent-Type: text/plain; charset=utf-8\r\nTransfer-Encoding: chunked\r\n\r\n7\r\nMozilla\r\n9\r\nDeveloper\r\n7\r\nNetwork\r\n0\r\n\r\n',
);
const format = ref<BytesInputFormat>('utf8');
const bytes = ref<Uint8Array>();

const dechunkOptions = computed(() => [
  { label: t('tools.http-response-cleaner.texts.dechunk-auto'), value: 'auto' },
  { label: t('tools.http-response-cleaner.texts.dechunk-always'), value: 'always' },
  { label: t('tools.http-response-cleaner.texts.dechunk-never'), value: 'never' },
]);

const outcome = computed<{ cleaned?: HttpCleanResult & { text?: string }; error?: string }>(() => {
  if (!bytes.value) {
    return {};
  }
  try {
    const cleaned = cleanHttpResponse(bytes.value, { dechunk: dechunkMode.value, decompress: decompress.value });
    return { cleaned: { ...cleaned, text: bodyText(cleaned.body, bodyCharset(cleaned.headers)) } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
});
const result = computed(() => outcome.value.cleaned);

const extensions: Record<string, string> = {
  'application/json': 'json',
  'application/javascript': 'js',
  'application/pdf': 'pdf',
  'application/xml': 'xml',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
  'text/css': 'css',
  'text/html': 'html',
  'text/plain': 'txt',
  'text/xml': 'xml',
};
const contentType = computed(
  () =>
    result.value?.headers
      .find(([key]) => key.toLowerCase() === 'content-type')?.[1]
      .split(';')[0]
      .trim()
      .toLowerCase() ?? '',
);

function download() {
  const body = result.value?.body;
  if (body) {
    downloadBlob(
      new Blob([body as Uint8Array<ArrayBuffer>], { type: contentType.value || 'application/octet-stream' }),
      `body.${extensions[contentType.value] ?? 'bin'}`,
    );
  }
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="dechunkMode"
        :options="dechunkOptions"
        :label="t('tools.http-response-cleaner.texts.label-dechunk')"
        label-width="140px"
        mb-2
      />
      <n-form-item
        :label="t('tools.http-response-cleaner.texts.label-decompress')"
        label-placement="left"
        label-width="140"
        :show-feedback="false"
      >
        <n-switch v-model:value="decompress" />
      </n-form-item>
      <n-text depth="3" block text-sm>{{ t('tools.http-response-cleaner.texts.hint') }}</n-text>
    </c-card>

    <c-card mb-2>
      <bytes-input
        v-model:value="text"
        v-model:format="format"
        :formats="['utf8', 'latin1', 'hex', 'base64', 'file']"
        :label="t('tools.http-response-cleaner.texts.label-input')"
        :rows="8"
        @update:bytes="bytes = $event"
      />
    </c-card>

    <c-alert v-if="outcome.error" type="error" data-test-id="error">{{ outcome.error }}</c-alert>
    <template v-else-if="result">
      <c-card v-if="result.startLine" :title="t('tools.http-response-cleaner.texts.title-headers')" mb-2>
        <div mb-2 font-mono data-test-id="start-line">{{ result.startLine }}</div>
        <n-table v-if="result.headers.length" size="small">
          <tbody>
            <tr v-for="([name, value], index) in result.headers" :key="index">
              <td font-mono>{{ name }}</td>
              <td break-all font-mono>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
      </c-card>

      <c-card :title="t('tools.http-response-cleaner.texts.title-body')">
        <div mb-2 flex flex-wrap items-center justify-between gap-2>
          <n-space size="small" align="center">
            <span text-sm op-70 data-test-id="body-size">{{ formatBytes(result.body.length) }}</span>
            <n-tag v-for="step in result.steps" :key="step" size="small" type="success" data-test-id="step">
              {{ t(`tools.http-response-cleaner.texts.step-${step}`) }}
            </n-tag>
          </n-space>
          <c-button :disabled="!result.body.length" @click="download">
            {{ t('tools.http-response-cleaner.texts.download') }}
          </c-button>
        </div>
        <textarea-copyable v-if="result.text !== undefined" :value="result.text" word-wrap data-test-id="body" />
        <n-text v-else depth="3">{{ t('tools.http-response-cleaner.texts.binary') }}</n-text>
      </c-card>
    </template>
  </div>
</template>
