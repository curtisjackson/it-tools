<script setup lang="ts">
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { useFfmpeg } from '@/composable/media/useFfmpeg';

// The layout of the ffmpeg tools that combine several files: options, ordered file list, action button, result.
const props = withDefaults(
  defineProps<{
    accept?: string;
    buttonText: string;
    task: (context: FfmpegTaskContext, files: File[]) => Promise<File>;
    minFiles?: number;
  }>(),
  { accept: undefined, minFiles: 2 },
);

const { running, progress, logs, error, run, cancel } = useFfmpeg();

const files = ref<File[]>([]);
const result = ref<File>();
const totalSize = computed(() => files.value.reduce((sum, file) => sum + file.size, 0));

watch(files, () => {
  result.value = undefined;
});

async function process() {
  const sources = [...files.value];
  result.value = await run((context) => props.task(context, sources));
}
</script>

<template>
  <div>
    <div v-if="$slots.default" mx-auto mb-4 max-w-600px>
      <slot :files="files" :running="running" />
    </div>

    <multi-file-list v-model:files="files" :accept="accept" :disabled="running" />

    <div mt-3 flex justify-center>
      <c-button :disabled="files.length < minFiles || running" data-test-id="process" @click="process">
        {{ buttonText }}
      </c-button>
    </div>

    <media-result
      :running="running"
      :progress="progress"
      :logs="logs"
      :error="error"
      :result="result"
      :source-size="totalSize"
      @cancel="cancel"
    />
  </div>
</template>
