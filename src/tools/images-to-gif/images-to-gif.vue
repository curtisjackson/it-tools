<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildImagesToGifArgs } from './images-to-gif.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { probeInput } from '@/composable/media/probe-inputs';
import { fileExtension } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const delay = useQueryParamOrStorage({ name: 'delay', storageName: 'images-to-gif:delay', defaultValue: 500 });
const width = useQueryParamOrStorage({ name: 'w', storageName: 'images-to-gif:w', defaultValue: 0 });
const background = useQueryParamOrStorage({ name: 'bg', storageName: 'images-to-gif:bg', defaultValue: '#ffffff' });
const loop = useQueryParamOrStorage({ name: 'loop', storageName: 'images-to-gif:loop', defaultValue: true });

const widthOptions = computed(() => [
  { label: t('tools.images-to-gif.texts.width-first'), value: 0 },
  ...[800, 640, 480, 320].map((value) => ({ label: `${value}px`, value })),
]);

async function build(context: FfmpegTaskContext, files: File[]) {
  // Every image is first saved as a PNG frame: `-loop 1` below only works with the image demuxer, not with GIF or
  // other container inputs.
  const inputs = [];
  for (const file of files) {
    const original = await context.writeInput(file, fileExtension(file.name, 'png'));
    const frame = context.tempFile('png');
    await context.exec(['-i', original, '-frames:v', '1', frame]);
    inputs.push(frame);
  }
  const first = await probeInput(context, inputs[0]);
  const targetWidth = width.value || first.width || 480;
  const targetHeight = Math.round((targetWidth * (first.height || targetWidth)) / (first.width || targetWidth));
  const output = context.tempFile('gif');
  await context.exec(
    buildImagesToGifArgs(inputs, output, {
      delay: delay.value ?? 500,
      width: targetWidth,
      height: targetHeight,
      background: background.value,
      loop: loop.value,
    }),
  );
  return context.readOutput(output, 'animation.gif', 'image/gif');
}
</script>

<template>
  <multi-media-tool-layout
    accept="image/*"
    :min-files="1"
    :task="build"
    :button-text="t('tools.images-to-gif.texts.button')"
  >
    <n-space align="center" mb-2>
      <n-form-item :label="t('tools.images-to-gif.texts.label-delay')" label-placement="left" :show-feedback="false">
        <n-input-number-i18n v-model:value="delay" :min="20" :max="60000" :step="100" />
      </n-form-item>
      <n-form-item :label="t('tools.images-to-gif.texts.label-loop')" label-placement="left" :show-feedback="false">
        <n-switch v-model:value="loop" />
      </n-form-item>
    </n-space>
    <c-buttons-select
      v-model:value="width"
      :options="widthOptions"
      :label="t('tools.images-to-gif.texts.label-width')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      :label="t('tools.images-to-gif.texts.label-background')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-color-picker v-model:value="background" :show-alpha="false" :modes="['hex']" w-160px />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.images-to-gif.texts.hint') }}</n-text>
  </multi-media-tool-layout>
</template>
