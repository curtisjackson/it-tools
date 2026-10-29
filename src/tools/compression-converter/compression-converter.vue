<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  type ByteAlgorithm,
  type CompressionAlgorithm,
  compressBytes,
  compressedExtensions,
  compressionAlgorithms,
  decompressBytes,
  detectCompression,
  lzStringCompress,
  lzStringDecompress,
  type LzStringFormat,
  lzStringFormats,
} from './compression-converter.service';
import BytesInput, { type BytesInputFormat } from '@/components/BytesInput.vue';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import type { LzmaMode } from '@/libs/lzma/lzma.mjs';
import { type BytesFormat, stringifyBytes } from '@/utils/bytes';
import { formatBytes } from '@/utils/convert';
import { downloadBlob, replaceExtension } from '@/utils/file-output';

const { t } = useI18n();

type Mode = 'compress' | 'decompress';

// Bigger results are only offered for download: a textarea with megabytes of hex is unusable.
const MAX_SHOWN_BYTES = 256 << 10;

const algorithm = ref<CompressionAlgorithm>('lz4');
const mode = ref<Mode>('compress');
const lzStringFormat = ref<LzStringFormat>('base64');
const lzmaLevel = ref<LzmaMode>(6);
const bzip2BlockSize = ref(9);
const bzip2WorkFactor = ref(30);

const text = ref('');
const bytesText = ref('');
const bytesFormat = ref<BytesInputFormat>('utf8');
const bytes = ref<Uint8Array>();
const file = ref<File>();
const outputFormat = ref<BytesFormat>('base64');

const algorithmOptions = computed(() =>
  compressionAlgorithms.map((value) => ({ value, label: t(`tools.compression-converter.texts.algorithm-${value}`) })),
);
const modeOptions = computed(() =>
  (['compress', 'decompress'] as const).map((value) => ({
    value,
    label: t(`tools.compression-converter.texts.mode-${value}`),
  })),
);
const lzStringFormatOptions = computed(() =>
  lzStringFormats.map((value) => ({ value, label: t(`tools.compression-converter.texts.format-${value}`) })),
);
const levelOptions = Array.from({ length: 9 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
const blockSizeOptions = computed(() =>
  levelOptions.map(({ value }) => ({ value, label: t('tools.compression-converter.texts.block-size', [value]) })),
);
const outputFormatOptions = computed(() =>
  (['base64', 'hex', 'utf8', 'latin1'] as const).map((value) => ({
    value,
    label: t(`shared.bytes-input.format-${value}`),
  })),
);

const isLzString = computed(() => algorithm.value === 'lz-string');

watch(
  mode,
  (value) => {
    outputFormat.value = value === 'compress' ? 'base64' : 'utf8';
  },
  { immediate: true },
);

interface Outcome {
  text?: string;
  bytes?: Uint8Array;
  error?: string;
}

const outcome = ref<Outcome>({});
const running = ref(false);
const progress = ref(0);
let runId = 0;

async function run() {
  const id = ++runId;
  const current = () => id === runId;
  running.value = false;
  try {
    if (algorithm.value === 'lz-string') {
      outcome.value = {
        text:
          mode.value === 'compress'
            ? lzStringCompress(text.value, lzStringFormat.value)
            : lzStringDecompress(text.value, lzStringFormat.value),
      };
      return;
    }
    const input = bytes.value;
    if (!input?.length) {
      outcome.value = {};
      return;
    }
    running.value = true;
    progress.value = 0;
    const onProgress = (fraction: number) => current() && (progress.value = fraction);
    const result =
      mode.value === 'compress'
        ? await compressBytes(
            algorithm.value,
            input,
            {
              lzmaLevel: lzmaLevel.value,
              bzip2BlockSize: bzip2BlockSize.value,
              bzip2WorkFactor: bzip2WorkFactor.value,
            },
            onProgress,
          )
        : await decompressBytes(algorithm.value, input, onProgress);
    if (current()) {
      outcome.value = { bytes: result };
    }
  } catch (error) {
    if (current()) {
      outcome.value = { error: error instanceof Error ? error.message : String(error) };
    }
  } finally {
    if (current()) {
      running.value = false;
    }
  }
}

watchDebounced([algorithm, mode, lzStringFormat, lzmaLevel, bzip2BlockSize, bzip2WorkFactor, text, bytes], run, {
  debounce: 200,
  immediate: true,
});

const detected = computed(() => {
  if (mode.value !== 'decompress' || isLzString.value || !bytes.value) {
    return undefined;
  }
  const format = detectCompression(bytes.value);
  return format === algorithm.value ? undefined : format;
});

const shownBytes = computed(() => {
  const result = outcome.value.bytes;
  return result && result.length <= MAX_SHOWN_BYTES ? stringifyBytes(result, outputFormat.value) : undefined;
});

const sizes = computed(() => {
  const result = outcome.value.bytes;
  const input = bytes.value;
  if (!result || !input?.length) {
    return '';
  }
  const ratio = `${((result.length / input.length) * 100).toFixed(1)} %`;
  return t('tools.compression-converter.texts.sizes', [formatBytes(input.length), formatBytes(result.length), ratio]);
});

function resultName() {
  const extension = compressedExtensions[algorithm.value as ByteAlgorithm];
  const name = file.value?.name;
  if (mode.value === 'compress') {
    return `${name ?? 'data'}.${extension}`;
  }
  if (name?.toLowerCase().endsWith(`.${extension}`)) {
    return name.slice(0, -extension.length - 1);
  }
  return name ? replaceExtension(name, 'bin') : 'data.bin';
}

function download() {
  const result = outcome.value.bytes;
  if (result) {
    downloadBlob(new Blob([result as Uint8Array<ArrayBuffer>], { type: 'application/octet-stream' }), resultName());
  }
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="algorithm"
        :options="algorithmOptions"
        :label="t('tools.compression-converter.texts.label-algorithm')"
        label-width="150px"
        mb-2
      />
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.compression-converter.texts.label-mode')"
        label-width="150px"
        mb-2
      />
      <c-select
        v-if="isLzString"
        v-model:value="lzStringFormat"
        :options="lzStringFormatOptions"
        :label="t('tools.compression-converter.texts.label-format')"
        label-position="left"
        label-width="150px"
        mb-2
      />
      <c-select
        v-if="algorithm === 'lzma' && mode === 'compress'"
        v-model:value="lzmaLevel"
        :options="levelOptions"
        :label="t('tools.compression-converter.texts.label-level')"
        label-position="left"
        label-width="150px"
        mb-2
      />
      <template v-if="algorithm === 'bzip2' && mode === 'compress'">
        <c-select
          v-model:value="bzip2BlockSize"
          :options="blockSizeOptions"
          :label="t('tools.compression-converter.texts.label-block-size')"
          label-position="left"
          label-width="150px"
          mb-2
        />
        <n-form-item
          :label="t('tools.compression-converter.texts.label-work-factor')"
          label-placement="left"
          label-align="left"
          label-width="150"
          :show-feedback="false"
          mb-2
        >
          <n-input-number v-model:value="bzip2WorkFactor" :min="0" :max="250" :precision="0" w-full />
        </n-form-item>
      </template>
      <n-text depth="3" block text-sm>{{ t(`tools.compression-converter.texts.hint-${algorithm}`) }}</n-text>
    </c-card>

    <c-card mb-2>
      <c-input-text
        v-if="isLzString"
        v-model:value="text"
        :label="t('tools.compression-converter.texts.label-input')"
        :placeholder="t(`tools.compression-converter.texts.placeholder-${mode === 'compress' ? 'text' : 'compressed'}`)"
        rows="6"
        multiline
        raw-text
        :monospace="mode === 'decompress'"
      />
      <BytesInput
        v-else
        v-model:value="bytesText"
        v-model:format="bytesFormat"
        :rows="6"
        @update:bytes="bytes = $event"
        @update:file="file = $event"
      />
    </c-card>

    <c-alert v-if="detected" type="warning" mb-2 data-test-id="detected">
      <div flex flex-wrap items-center justify-between gap-2>
        <span>{{ t(`tools.compression-converter.texts.detected-${detected}`) }}</span>
        <c-button
          v-if="detected === 'lz4' || detected === 'lzma' || detected === 'bzip2'"
          size="small"
          @click="algorithm = detected"
        >
          {{
            t('tools.compression-converter.texts.switch', [
              t(`tools.compression-converter.texts.algorithm-${detected}`),
            ])
          }}
        </c-button>
      </div>
    </c-alert>

    <c-card :title="t('tools.compression-converter.texts.title-result')">
      <n-progress v-if="running" type="line" :percentage="Math.round(progress * 100)" mb-2 />
      <c-alert v-if="outcome.error" type="error" data-test-id="error">{{ outcome.error }}</c-alert>
      <template v-else-if="isLzString">
        <TextareaCopyable :value="outcome.text ?? ''" word-wrap scrollable />
        <n-text v-if="lzStringFormat === 'default' || lzStringFormat === 'utf16'" depth="3" block text-sm mt-2>
          {{ t('tools.compression-converter.texts.hint-raw-output') }}
        </n-text>
      </template>
      <template v-else-if="outcome.bytes">
        <div mb-2 flex flex-wrap items-center justify-between gap-2>
          <span text-sm op-70 data-test-id="sizes">{{ sizes }}</span>
          <c-button @click="download">{{ t('tools.compression-converter.texts.download') }}</c-button>
        </div>
        <template v-if="shownBytes !== undefined">
          <c-buttons-select
            v-model:value="outputFormat"
            :options="outputFormatOptions"
            :label="t('tools.compression-converter.texts.label-output-format')"
            size="small"
            mb-2
          />
          <TextareaCopyable :value="shownBytes" word-wrap scrollable />
        </template>
        <n-text v-else depth="3" block>{{ t('tools.compression-converter.texts.too-large') }}</n-text>
      </template>
      <n-text v-else-if="!running" depth="3" block>{{ t('tools.compression-converter.texts.empty') }}</n-text>
    </c-card>
  </div>
</template>
