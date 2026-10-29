<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { replaceExtension } from '@/utils/file-output';

export interface FileTaskContext {
  /** Progress from 0 to 1. */
  onProgress: (progress: number) => void;
  /** Aborted by the "Cancel" button. */
  signal: AbortSignal;
}

// The layout of the browser-side file tools that do not use ffmpeg (PDF, images...): options, file input, action
// button, result — one file, or a list with a zip download.
const props = withDefaults(
  defineProps<{
    accept?: string;
    title?: string;
    buttonText: string;
    task: (input: File[], context: FileTaskContext) => Promise<File | File[]>;
    multiple?: boolean;
    minFiles?: number;
    ready?: boolean;
    /** For tools that turn each file into a smaller one: show the size of each result next to its source. */
    compareSizes?: boolean;
  }>(),
  { accept: undefined, title: undefined, multiple: false, minFiles: 1, ready: true, compareSizes: false },
);
const emit = defineEmits<{ (event: 'update:files', files: File[]): void }>();

const { t } = useI18n();

const file = ref<File>();
const files = ref<File[]>([]);
const inputs = computed(() => (props.multiple ? files.value : file.value ? [file.value] : []));
const running = ref(false);
const progress = ref(0);
const error = ref<string>();
const results = ref<File[]>([]);
const processed = ref<File[]>([]);
let controller: AbortController | undefined;

watch(inputs, (value) => {
  results.value = [];
  error.value = undefined;
  emit('update:files', value);
});

async function process() {
  const sources = [...inputs.value];
  controller = new AbortController();
  running.value = true;
  progress.value = 0;
  error.value = undefined;
  results.value = [];
  try {
    const output = await props.task(sources, {
      onProgress: (value) => {
        progress.value = Math.min(1, Math.max(0, value));
      },
      signal: controller.signal,
    });
    if (!controller.signal.aborted) {
      results.value = Array.isArray(output) ? output : [output];
      processed.value = sources;
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      error.value = err instanceof Error ? err.message : String(err);
    }
  } finally {
    running.value = false;
  }
}

const sourceSize = computed(() => inputs.value.reduce((sum, input) => sum + input.size, 0));
const zipName = computed(() => replaceExtension(inputs.value[0]?.name ?? 'files', 'zip'));
</script>

<template>
  <div>
    <div v-if="$slots.default" mx-auto mb-4 max-w-600px>
      <slot :files="inputs" :running="running" />
    </div>

    <multi-file-list v-if="multiple" v-model:files="files" :accept="accept" :title="title" :disabled="running" />
    <media-file-input
      v-else
      v-model:file="file"
      kind="file"
      :accept="accept"
      :title="title ?? t('shared.media.drop-file')"
      :disabled="running"
    />

    <div v-if="inputs.length > 0 && $slots['below-input']" mx-auto mt-3 max-w-600px>
      <slot name="below-input" :files="inputs" :running="running" />
    </div>

    <div mt-3 flex justify-center>
      <c-button :disabled="inputs.length < minFiles || !ready || running" data-test-id="process" @click="process">
        {{ buttonText }}
      </c-button>
    </div>

    <media-result
      :running="running"
      :progress="progress"
      :logs="[]"
      :error="error"
      :result="results.length === 1 ? results[0] : undefined"
      :source-size="sourceSize"
      @cancel="controller?.abort()"
    />
    <file-result-list
      v-if="results.length > 1"
      :files="results"
      :zip-name="zipName"
      :originals="compareSizes && processed.length === results.length ? processed : undefined"
    />
  </div>
</template>
