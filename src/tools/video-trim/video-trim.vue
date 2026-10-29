<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type TrimMode, buildTrimArgs, getTrimOutput } from './video-trim.service';
import MediaToolLayout from '@/components/media/MediaToolLayout.vue';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { fileExtension } from '@/composable/media/video-encode';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const mode = useQueryParamOrStorage<TrimMode>({ name: 'mode', storageName: 'video-trim:mode', defaultValue: 'fast' });
const modeOptions = computed(() => [
  { label: t('tools.video-trim.texts.mode-fast'), value: 'fast' },
  { label: t('tools.video-trim.texts.mode-precise'), value: 'precise' },
]);

const duration = ref(0);
const start = ref(0);
const end = ref(0);
const layout = ref<InstanceType<typeof MediaToolLayout>>();

function onLoaded({ duration: loadedDuration }: MediaMetadata) {
  duration.value = loadedDuration;
  start.value = 0;
  end.value = loadedDuration;
}

async function trim({ writeInput, tempFile, exec, readOutput }: FfmpegTaskContext, source: File) {
  const output = getTrimOutput(source.name, mode.value);
  const inputName = await writeInput(source, fileExtension(source.name, 'mp4'));
  const outputName = tempFile(output.extension);
  await exec(
    buildTrimArgs({ input: inputName, output: outputName, start: start.value, end: end.value, mode: mode.value }),
  );
  return readOutput(outputName, output.fileName, mode.value === 'fast' && source.type ? source.type : 'video/mp4');
}
</script>

<template>
  <media-tool-layout
    ref="layout"
    kind="video"
    :task="trim"
    :ready="duration > 0 && end > start"
    :button-text="t('tools.video-trim.texts.button-trim')"
    @loaded="onLoaded"
    @update:file="duration = 0"
  >
    <template #default="{ running }">
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.video-trim.texts.label-mode')"
        label-width="150px"
        label-align="right"
        :disabled="running"
      />
      <n-text depth="3" text-sm>
        {{
          mode === 'fast' ? t('tools.video-trim.texts.mode-fast-hint') : t('tools.video-trim.texts.mode-precise-hint')
        }}
      </n-text>
    </template>

    <template #below-input="{ running }">
      <media-trim-range
        v-if="duration > 0"
        v-model:start="start"
        v-model:end="end"
        :duration="duration"
        :disabled="running"
        @seek="(time: number) => layout?.seek(time)"
      />
    </template>
  </media-tool-layout>
</template>
