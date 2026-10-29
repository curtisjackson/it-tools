<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import libraryUrl from 'browser-image-compression/dist/browser-image-compression.js?url';
import { useI18n } from 'vue-i18n';
import { type CompressOptions, libraryOptions, pickResult } from './image-compressor.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const options = useQueryParamOrStorage<CompressOptions>({
  name: 'options',
  storageName: 'image-compressor:options',
  defaultValue: { maxSizeMB: 1, quality: 80, maxDimension: 0, format: 'keep', keepExif: true },
});

const formatOptions = computed(() => [
  { label: t('tools.image-compressor.texts.format-keep'), value: 'keep' },
  { label: 'JPEG', value: 'image/jpeg' },
  { label: 'WebP', value: 'image/webp' },
  { label: 'PNG', value: 'image/png' },
]);

// The worker of the library loads the library with `importScripts`, which needs an absolute URL.
const libURL = new URL(libraryUrl, window.location.href).href;

async function compress(files: File[], { onProgress, signal }: FileTaskContext) {
  const results: File[] = [];
  for (const [index, file] of files.entries()) {
    const compressed = await imageCompression(file, {
      ...libraryOptions(file, options.value),
      useWebWorker: true,
      libURL,
      signal,
      onProgress: (progress) => onProgress((index + progress / 100) / files.length),
    });
    results.push(pickResult(file, compressed, options.value));
  }
  return results;
}
</script>

<template>
  <file-tool-layout
    accept="image/jpeg,image/png,image/webp,image/bmp"
    :title="t('tools.image-compressor.texts.drop-images')"
    :task="compress"
    :button-text="t('tools.image-compressor.texts.button')"
    multiple
    compare-sizes
  >
    <n-form-item
      :label="t('tools.image-compressor.texts.label-quality', [options.quality])"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="options.quality" :min="10" :max="100" />
    </n-form-item>
    <n-form-item
      :label="t('tools.image-compressor.texts.label-max-size')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-input-number v-model:value="options.maxSizeMB" :min="0" :step="0.1" :precision="2" w-full>
        <template #suffix>MB</template>
      </n-input-number>
    </n-form-item>
    <n-form-item
      :label="t('tools.image-compressor.texts.label-max-dimension')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
      mb-2
    >
      <n-input-number v-model:value="options.maxDimension" :min="0" :step="100" w-full>
        <template #suffix>px</template>
      </n-input-number>
    </n-form-item>
    <n-text depth="3" mb-3 block text-sm>{{ t('tools.image-compressor.texts.hint-zero') }}</n-text>
    <c-buttons-select
      v-model:value="options.format"
      :options="formatOptions"
      :label="t('tools.image-compressor.texts.label-format')"
      label-width="160px"
      mb-2
    />
    <n-form-item
      :label="t('tools.image-compressor.texts.label-keep-exif')"
      label-placement="left"
      label-width="160"
      :show-feedback="false"
    >
      <n-switch v-model:value="options.keepExif" />
    </n-form-item>
  </file-tool-layout>
</template>
