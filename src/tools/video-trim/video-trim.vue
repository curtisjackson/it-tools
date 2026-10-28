<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type TrimMode, buildTrimArgs, getTrimOutput } from './video-trim.service';
import { useFfmpeg } from '@/composable/media/useFfmpeg';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import type { MediaMetadata } from '@/composable/media/probe-media';
import MediaFileInput from '@/components/media/MediaFileInput.vue';

const { t } = useI18n();

const mode = useQueryParamOrStorage<TrimMode>({ name: 'mode', storageName: 'video-trim:mode', defaultValue: 'fast' });
const modeOptions = computed(() => [
  { label: t('tools.video-trim.texts.mode-fast'), value: 'fast' },
  { label: t('tools.video-trim.texts.mode-precise'), value: 'precise' },
]);

const file = ref<File>();
const duration = ref(0);
const start = ref(0);
const end = ref(0);
const result = ref<File>();
const input = ref<InstanceType<typeof MediaFileInput>>();

const { running, progress, logs, error, run, cancel } = useFfmpeg();

watch(file, () => {
  duration.value = 0;
  result.value = undefined;
});

function onLoaded({ duration: loadedDuration }: MediaMetadata) {
  duration.value = loadedDuration;
  start.value = 0;
  end.value = loadedDuration;
}

async function trim() {
  const source = file.value;
  if (!source) {
    return;
  }
  const output = getTrimOutput(source.name, mode.value);
  result.value = await run(async ({ writeInput, tempFile, exec, readOutput }) => {
    const inputName = await writeInput(source, source.name.split('.').pop() || 'mp4');
    const outputName = tempFile(output.extension);
    await exec(
      buildTrimArgs({ input: inputName, output: outputName, start: start.value, end: end.value, mode: mode.value }),
    );
    return readOutput(outputName, output.fileName, mode.value === 'fast' && source.type ? source.type : 'video/mp4');
  });
}
</script>

<template>
  <div>
    <div mx-auto mb-4 max-w-600px>
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
    </div>

    <media-file-input ref="input" v-model:file="file" kind="video" :disabled="running" @loaded="onLoaded" />

    <div v-if="file && duration > 0" mx-auto mt-3 max-w-600px>
      <media-trim-range
        v-model:start="start"
        v-model:end="end"
        :duration="duration"
        :disabled="running"
        @seek="(time: number) => input?.seek(time)"
      />
    </div>

    <div mt-3 flex justify-center>
      <c-button :disabled="!file || duration <= 0 || end <= start || running" @click="trim">
        {{ t('tools.video-trim.texts.button-trim') }}
      </c-button>
    </div>

    <media-result
      :running="running"
      :progress="progress"
      :logs="logs"
      :error="error"
      :result="result"
      :source-size="file?.size"
      @cancel="cancel"
    />
  </div>
</template>
