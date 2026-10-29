<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { type CropArea, buildCropArgs, captureVideoFrame, normalizeCropArea } from './video-crop.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const aspect = useQueryParamOrStorage({ name: 'ratio', storageName: 'video-crop:ratio', defaultValue: 'free' });
const aspectOptions = computed(() => [
  { label: t('tools.video-crop.texts.ratio-free'), value: 'free' },
  ...['16:9', '9:16', '4:3', '1:1'].map((value) => ({ label: value, value })),
]);
const aspectRatio = computed(() => {
  const [w, h] = aspect.value.split(':').map(Number);
  return w && h ? w / h : Number.NaN;
});

const file = ref<File>();
const frame = ref<MediaMetadata>();
const frameImage = ref<string>();
const frameError = ref(false);
const area = ref<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
const image = ref<HTMLImageElement>();
let cropper: Cropper | undefined;

function destroyCropper() {
  cropper?.destroy();
  cropper = undefined;
}

async function onLoaded(metadata: MediaMetadata) {
  frame.value = metadata;
  area.value = { x: 0, y: 0, width: metadata.width, height: metadata.height };
  destroyCropper();
  frameImage.value = undefined;
  frameError.value = false;
  try {
    frameImage.value = await captureVideoFrame(file.value!);
  } catch {
    frameError.value = true;
  }
}

watch(file, () => {
  frame.value = undefined;
  destroyCropper();
  frameImage.value = undefined;
});

function onImageLoaded() {
  destroyCropper();
  cropper = new Cropper(image.value!, {
    viewMode: 1,
    autoCropArea: 1,
    zoomable: false,
    aspectRatio: aspectRatio.value,
    crop: ({ detail }) => {
      area.value = {
        x: Math.round(detail.x),
        y: Math.round(detail.y),
        width: Math.round(detail.width),
        height: Math.round(detail.height),
      };
    },
  });
}

watch(aspectRatio, (ratio) => cropper?.setAspectRatio(ratio));

function setField(key: keyof CropArea, value: number | null) {
  area.value = { ...area.value, [key]: value ?? 0 };
  cropper?.setData({ ...area.value });
}

const normalized = computed(() =>
  frame.value ? normalizeCropArea(area.value, frame.value.width, frame.value.height) : area.value,
);

async function crop({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('mp4');
  await exec(buildCropArgs(input, output, normalized.value));
  return readOutput(output, outputFileName(source.name, '_cropped', 'mp4'), 'video/mp4');
}

onBeforeUnmount(destroyCropper);
</script>

<template>
  <media-tool-layout
    kind="video"
    :task="crop"
    :ready="!!frame && frame.width > 0"
    :button-text="t('tools.video-crop.texts.button')"
    @loaded="onLoaded"
    @update:file="(value?: File) => (file = value)"
  >
    <c-buttons-select
      v-model:value="aspect"
      :options="aspectOptions"
      :label="t('tools.video-crop.texts.label-ratio')"
      label-width="120px"
    />

    <template #below-input>
      <c-card v-if="frame && frame.width > 0" :title="t('tools.video-crop.texts.title-area')">
        <div v-if="frameImage" mb-3 max-h-400px>
          <img ref="image" :src="frameImage" alt="" block max-w-full @load="onImageLoaded" />
        </div>
        <n-text v-else-if="frameError" depth="3" block mb-2 text-sm>{{ t('tools.video-crop.texts.no-frame') }}</n-text>
        <n-space align="center">
          <n-form-item
            v-for="key in ['x', 'y', 'width', 'height'] as const"
            :key="key"
            :label="t(`tools.video-crop.texts.label-${key}`)"
            label-placement="left"
            :show-feedback="false"
          >
            <n-input-number-i18n
              :value="area[key]"
              :min="0"
              :max="key === 'x' || key === 'width' ? frame.width : frame.height"
              :step="2"
              w-110px
              @update:value="(value: number | null) => setField(key, value)"
            />
          </n-form-item>
        </n-space>
        <n-text depth="3" text-sm data-test-id="crop-size">{{
          t('tools.video-crop.texts.result-size', [`${normalized.width}×${normalized.height}`])
        }}</n-text>
      </c-card>
    </template>
  </media-tool-layout>
</template>
