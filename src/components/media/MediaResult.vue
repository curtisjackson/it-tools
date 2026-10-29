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
    /** Warn when the result is larger than the source, for tools meant to shrink files. */
    warnIfLarger?: boolean;
  }>(),
  { error: undefined, result: undefined, sourceSize: undefined, warnIfLarger: false },
);
defineEmits<{ (event: 'cancel'): void }>();

const { t } = useI18n();

const url = useObjectUrl(toRef(props, 'result'));
const kind = computed(() => props.result?.type.split('/')[0]);
const info = computed(() => {
  if (!props.result) {
    return '';
  }
  const parts = [props.result.name, formatBytes(props.result.size)];
  if (props.sourceSize) {
    const change = Math.round(((props.result.size - props.sourceSize) / props.sourceSize) * 100);
    parts.push(t('shared.media.size-change', [`${change > 0 ? '+' : ''}${change}%`]));
  }
  return parts.join(' · ');
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
      <img v-else-if="kind === 'image'" :src="url" alt="" class="checkerboard" mx-auto block max-h-360px max-w-full />

      <div mt-2 flex flex-wrap items-center justify-between gap-2>
        <div text-sm op-70 data-test-id="result-info">{{ info }}</div>
        <c-button @click="downloadFile(result)">{{ t('shared.media.download') }}</c-button>
      </div>
      <c-alert v-if="warnIfLarger && sourceSize && result.size >= sourceSize" type="warning" mt-2>
        {{ t('shared.media.result-larger') }}
      </c-alert>
    </c-card>

    <c-collapse v-if="logs.length > 0" :title="t('shared.media.logs')" mx-auto mt-3 max-w-600px>
      <pre max-h-300px overflow-auto text-xs>{{ logs.join('\n') }}</pre>
    </c-collapse>
  </div>
</template>

<style scoped>
/* Shows transparent pixels. */
.checkerboard {
  background: repeating-conic-gradient(#8884 0% 25%, transparent 0% 50%) 50% / 16px 16px;
}
</style>
