<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type FadeDirection, type OpacityMode, applyOpacity } from './image-opacity.service';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { imageDataToFile, loadImageData } from '@/utils/canvas-image';
import { hexToRgba } from '@/utils/image-pixels';

const { t } = useI18n();

const storage = (name: string) => `image-opacity:${name}`;
const mode = useQueryParamOrStorage<OpacityMode>({ name: 'mode', storageName: storage('mode'), defaultValue: 'solid' });
const opacity = useQueryParamOrStorage({ name: 'opacity', storageName: storage('opacity'), defaultValue: 50 });
const direction = useQueryParamOrStorage<FadeDirection>({
  name: 'dir',
  storageName: storage('dir'),
  defaultValue: 'right',
});
const flatten = useQueryParamOrStorage({ name: 'flatten', storageName: storage('flatten'), defaultValue: false });
const background = useQueryParamOrStorage({ name: 'bg', storageName: storage('bg'), defaultValue: '#ffffff' });

const modeOptions = computed(() => [
  { label: t('tools.image-opacity.texts.mode-solid'), value: 'solid' },
  { label: t('tools.image-opacity.texts.mode-linear'), value: 'linear' },
  { label: t('tools.image-opacity.texts.mode-radial'), value: 'radial' },
]);
const directionOptions = computed(() =>
  (mode.value === 'radial' ? ['edges', 'center'] : ['right', 'left', 'down', 'up']).map((value) => ({
    label: t(`tools.image-opacity.texts.direction-${value}`),
    value,
  })),
);
watch(mode, (value) => {
  if (value === 'radial' && !['edges', 'center'].includes(direction.value)) {
    direction.value = 'edges';
  } else if (value === 'linear' && ['edges', 'center'].includes(direction.value)) {
    direction.value = 'right';
  }
});

async function process([file]: File[]) {
  const image = await loadImageData(file);
  applyOpacity(image.data, image.width, image.height, {
    mode: mode.value,
    opacity: (opacity.value ?? 50) / 100,
    direction: direction.value,
    background: flatten.value ? hexToRgba(background.value) : undefined,
  });
  return imageDataToFile(image, outputFileName(file.name, '_opacity', 'png'));
}
</script>

<template>
  <file-tool-layout
    accept="image/*"
    :title="t('shared.media.drop-image')"
    :task="process"
    :button-text="t('tools.image-opacity.texts.button')"
  >
    <c-buttons-select
      v-model:value="mode"
      :options="modeOptions"
      :label="t('tools.image-opacity.texts.label-mode')"
      label-width="140px"
      mb-2
    />
    <c-buttons-select
      v-if="mode !== 'solid'"
      v-model:value="direction"
      :options="directionOptions"
      :label="t('tools.image-opacity.texts.label-direction')"
      label-width="140px"
      mb-2
    />
    <n-form-item
      :label="
        t(
          mode === 'solid' ? 'tools.image-opacity.texts.label-opacity' : 'tools.image-opacity.texts.label-end-opacity',
          [opacity],
        )
      "
      label-placement="left"
      label-width="140"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="opacity" :min="0" :max="100" />
    </n-form-item>
    <n-space align="center">
      <n-form-item
        :label="t('tools.image-opacity.texts.label-flatten')"
        label-placement="left"
        label-width="140"
        :show-feedback="false"
      >
        <n-switch v-model:value="flatten" />
      </n-form-item>
      <n-color-picker v-if="flatten" v-model:value="background" :show-alpha="false" :modes="['hex']" w-160px />
    </n-space>
  </file-tool-layout>
</template>
