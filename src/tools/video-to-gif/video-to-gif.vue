<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildVideoToGifArgs } from './video-to-gif.service';
import MediaToolLayout from '@/components/media/MediaToolLayout.vue';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const width = useQueryParamOrStorage({ name: 'w', storageName: 'video-to-gif:w', defaultValue: 480 });
const fps = useQueryParamOrStorage({ name: 'fps', storageName: 'video-to-gif:fps', defaultValue: 12 });
const loop = useQueryParamOrStorage({ name: 'loop', storageName: 'video-to-gif:loop', defaultValue: true });

const widthOptions = computed(() => [
  { label: t('tools.video-to-gif.texts.width-original'), value: 0 },
  ...[640, 480, 320, 240].map((value) => ({ label: `${value}px`, value })),
]);
const fpsOptions = [5, 8, 12, 15, 20, 25].map((value) => ({ label: `${value}`, value }));

const duration = ref(0);
const start = ref(0);
const end = ref(0);
const layout = ref<InstanceType<typeof MediaToolLayout>>();

function onLoaded({ duration: loaded }: MediaMetadata) {
  duration.value = loaded;
  start.value = 0;
  // Long GIFs get huge: start with the first five seconds.
  end.value = Math.min(loaded, 5);
}

async function convert({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const input = await writeInput(source, fileExtension(source.name, 'mp4'));
  const output = tempFile('gif');
  await exec(
    buildVideoToGifArgs(input, output, {
      start: start.value,
      end: end.value,
      width: width.value ?? 0,
      fps: fps.value ?? 12,
      loop: loop.value,
    }),
  );
  return readOutput(output, outputFileName(source.name, '', 'gif'), 'image/gif');
}
</script>

<template>
  <media-tool-layout
    ref="layout"
    kind="video"
    :task="convert"
    :ready="duration > 0 && end > start"
    :button-text="t('tools.video-to-gif.texts.button')"
    @loaded="onLoaded"
    @update:file="duration = 0"
  >
    <c-buttons-select
      v-model:value="width"
      :options="widthOptions"
      :label="t('tools.video-to-gif.texts.label-width')"
      label-width="120px"
      mb-2
    />
    <c-buttons-select
      v-model:value="fps"
      :options="fpsOptions"
      :label="t('tools.video-to-gif.texts.label-fps')"
      label-width="120px"
      mb-2
    />
    <n-form-item
      :label="t('tools.video-to-gif.texts.label-loop')"
      label-placement="left"
      label-width="120"
      :show-feedback="false"
    >
      <n-switch v-model:value="loop" />
    </n-form-item>
    <n-text depth="3" text-sm>{{ t('tools.video-to-gif.texts.hint') }}</n-text>

    <template #below-input>
      <media-trim-range
        v-if="duration > 0"
        v-model:start="start"
        v-model:end="end"
        :duration="duration"
        @seek="(time: number) => layout?.seek(time)"
      />
    </template>
  </media-tool-layout>
</template>
