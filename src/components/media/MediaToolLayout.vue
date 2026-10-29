<script setup lang="ts">
import MediaFileInput from './MediaFileInput.vue';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { useFfmpeg } from '@/composable/media/useFfmpeg';

// The layout of the single-file ffmpeg tools, as in video-trim: options, file input, action button, result.
const props = withDefaults(
  defineProps<{
    kind: 'video' | 'audio' | 'image';
    accept?: string;
    buttonText: string;
    task: (context: FfmpegTaskContext, file: File, metadata: MediaMetadata | undefined) => Promise<File>;
    /** Extra condition for the button, e.g. a valid range. */
    ready?: boolean;
    warnIfLarger?: boolean;
  }>(),
  { accept: undefined, ready: true, warnIfLarger: false },
);
const emit = defineEmits<{
  (event: 'loaded', metadata: MediaMetadata): void;
  (event: 'update:file', file?: File): void;
}>();

const { running, progress, logs, error, run, cancel } = useFfmpeg();

const file = ref<File>();
const metadata = ref<MediaMetadata>();
const result = ref<File>();
const input = ref<InstanceType<typeof MediaFileInput>>();

watch(file, (value) => {
  metadata.value = undefined;
  result.value = undefined;
  emit('update:file', value);
});

function onLoaded(loaded: MediaMetadata) {
  metadata.value = loaded;
  emit('loaded', loaded);
}

async function process() {
  const source = file.value;
  if (!source) {
    return;
  }
  result.value = await run((context) => props.task(context, source, metadata.value));
}

defineExpose({ seek: (time: number) => input.value?.seek(time) });
</script>

<template>
  <div>
    <div v-if="$slots.default" mx-auto mb-4 max-w-600px>
      <slot :file="file" :metadata="metadata" :running="running" />
    </div>

    <media-file-input
      ref="input"
      v-model:file="file"
      :kind="kind"
      :accept="accept"
      :disabled="running"
      @loaded="onLoaded"
    />

    <div v-if="file && $slots['below-input']" mx-auto mt-3 max-w-600px>
      <slot name="below-input" :file="file" :metadata="metadata" :running="running" />
    </div>

    <div mt-3 flex justify-center>
      <c-button :disabled="!file || !ready || running" data-test-id="process" @click="process">
        {{ buttonText }}
      </c-button>
    </div>

    <media-result
      :running="running"
      :progress="progress"
      :logs="logs"
      :error="error"
      :result="result"
      :source-size="file?.size"
      :warn-if-larger="warnIfLarger"
      @cancel="cancel"
    />
  </div>
</template>
