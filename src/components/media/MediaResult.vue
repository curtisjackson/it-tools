<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatBytes } from '@/utils/convert';
import { downloadFile } from '@/utils/file-output';

const props = withDefaults(
  defineProps<{
    running: boolean;
    progress: number;
    logs: string[];
    error?: string;
    result?: File;
    sourceSize?: number;
  }>(),
  { error: undefined, result: undefined, sourceSize: undefined },
);
defineEmits<{ (event: 'cancel'): void }>();

const { t } = useI18n();

const url = useObjectUrl(toRef(props, 'result'));
const kind = computed(() => props.result?.type.split('/')[0]);
const sizeChange = computed(() => {
  if (!props.result || !props.sourceSize) {
    return undefined;
  }
  return Math.round(((props.result.size - props.sourceSize) / props.sourceSize) * 100);
});
</script>

<template>
  <div>
    <div v-if="running" mx-auto mt-3 max-w-600px flex items-center gap-3>
      <n-progress type="line" :percentage="Math.round(progress * 100)" flex-1 />
      <c-button size="small" @click="$emit('cancel')">{{ t('shared.media.cancel') }}</c-button>
    </div>

    <div v-if="error" mt-3 flex justify-center>
      <c-alert type="error">{{ error }}</c-alert>
    </div>

    <c-card v-if="result && !running" :title="t('shared.media.result')" mx-auto mt-3 max-w-600px>
      <video v-if="kind === 'video'" :src="url" controls w-full max-h-360px />
      <audio v-else-if="kind === 'audio'" :src="url" controls w-full />
      <img v-else-if="kind === 'image'" :src="url" alt="" mx-auto block max-h-360px max-w-full />

      <div mt-2 flex flex-wrap items-center justify-between gap-2>
        <div text-sm op-70 data-test-id="result-info">
          {{ result.name }} · {{ formatBytes(result.size) }}
          <template v-if="sourceSize">
            ({{ t('shared.media.size-change', [`${sizeChange! > 0 ? '+' : ''}${sizeChange}%`]) }})
          </template>
        </div>
        <c-button @click="downloadFile(result)">{{ t('shared.media.download') }}</c-button>
      </div>
    </c-card>

    <c-collapse v-if="logs.length > 0" :title="t('shared.media.logs')" mx-auto mt-3 max-w-600px>
      <pre max-h-300px overflow-auto text-xs>{{ logs.join('\n') }}</pre>
    </c-collapse>
  </div>
</template>
