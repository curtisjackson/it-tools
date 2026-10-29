<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Rgba } from '@/utils/image-pixels';
import { loadImageData } from '@/utils/canvas-image';

// Shows an image and reports the colour of the pixel clicked (an eyedropper).
const props = defineProps<{ file: File }>();
const emit = defineEmits<{ (event: 'pick', color: Rgba): void }>();

const { t } = useI18n();

const url = useObjectUrl(toRef(props, 'file'));
const pixels = shallowRef<ImageData>();

watch(
  () => props.file,
  async (file) => {
    pixels.value = undefined;
    pixels.value = await loadImageData(file);
  },
  { immediate: true },
);

function onClick(event: MouseEvent) {
  const image = event.currentTarget as HTMLImageElement;
  const data = pixels.value;
  if (!data) {
    return;
  }
  const x = Math.min(data.width - 1, Math.floor((event.offsetX / image.clientWidth) * data.width));
  const y = Math.min(data.height - 1, Math.floor((event.offsetY / image.clientHeight) * data.height));
  const i = (y * data.width + x) * 4;
  emit('pick', [data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]]);
}
</script>

<template>
  <div text-center>
    <img
      :src="url"
      alt=""
      class="pixel-picker"
      mx-auto
      block
      max-h-360px
      max-w-full
      data-test-id="pixel-picker"
      @click="onClick"
    />
    <n-text depth="3" text-sm>{{ t('shared.media.pick-color') }}</n-text>
  </div>
</template>

<style scoped>
.pixel-picker {
  cursor: crosshair;
  background: repeating-conic-gradient(#8884 0% 25%, transparent 0% 50%) 50% / 16px 16px;
}
</style>
