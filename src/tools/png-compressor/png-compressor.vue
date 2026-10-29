<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { PngCompressOptions, PngCompressResult } from './png-compressor.service';
import PngCompressorWorker from './png-compressor.worker?worker';
import type { PngCompressRequest } from './png-compressor.worker';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { loadImageData } from '@/utils/canvas-image';

const { t } = useI18n();

const options = useQueryParamOrStorage<PngCompressOptions>({
  name: 'options',
  storageName: 'png-compressor:options',
  defaultValue: { quality: 60, dithering: false, maxOutputSizeInKB: 0 },
});
const missedTarget = ref<string[]>([]);

function compressInWorker(worker: Worker, request: PngCompressRequest, signal: AbortSignal) {
  return new Promise<PngCompressResult>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<PngCompressResult | { error: string }>) => {
      signal.removeEventListener('abort', onAbort);
      if ('error' in data) {
        reject(new Error(data.error));
      } else {
        resolve(data);
      }
    };
    worker.postMessage(request, { transfer: [request.pixels.buffer] });
  });
}

async function compress(files: File[], { onProgress, signal }: FileTaskContext) {
  missedTarget.value = [];
  // One worker for the whole batch: the images are decoded at full size, one at a time.
  const worker = new PngCompressorWorker();
  signal.addEventListener('abort', () => worker.terminate(), { once: true });
  try {
    const results: File[] = [];
    for (const [index, file] of files.entries()) {
      const { data, width, height } = await loadImageData(file);
      const result = await compressInWorker(
        worker,
        { pixels: data, width, height, options: { ...options.value } },
        signal,
      );
      // An already optimised PNG can be smaller than the best attempt.
      const kept = result.data.length >= file.size;
      results.push(kept ? file : new File([result.data], file.name, { type: 'image/png' }));
      const budget = options.value.maxOutputSizeInKB * 1024;
      if (!result.targetReached && !(kept && budget > 0 && file.size <= budget)) {
        missedTarget.value.push(file.name);
      }
      onProgress((index + 1) / files.length);
    }
    return results;
  } finally {
    worker.terminate();
  }
}
</script>

<template>
  <file-tool-layout
    accept="image/png"
    :title="t('tools.png-compressor.texts.drop-pngs')"
    :task="compress"
    :button-text="t('tools.png-compressor.texts.button')"
    multiple
    compare-sizes
    @update:files="missedTarget = []"
  >
    <n-form-item
      :label="t('tools.png-compressor.texts.label-quality', [options.quality])"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="options.quality" :min="1" :max="100" />
    </n-form-item>
    <n-form-item
      :label="t('tools.png-compressor.texts.label-max-size')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-input-number v-model:value="options.maxOutputSizeInKB" :min="0" :step="10" w-full>
        <template #suffix>KB</template>
      </n-input-number>
    </n-form-item>
    <n-form-item
      :label="t('tools.png-compressor.texts.label-dithering')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
    >
      <n-switch v-model:value="options.dithering" />
    </n-form-item>
    <n-text depth="3" block text-sm>{{ t('tools.png-compressor.texts.hint') }}</n-text>
    <c-alert v-if="missedTarget.length > 0" type="warning" mt-3 data-test-id="missed-target">
      {{ t('tools.png-compressor.texts.missed-target', [missedTarget.join(', ')]) }}
    </c-alert>
  </file-tool-layout>
</template>
