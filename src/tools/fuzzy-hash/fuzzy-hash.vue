<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { compareCtph, ctph } from './ctph';
import { compareSsdeep, ssdeep } from './ssdeep';
import type { BytesInputFormat } from '@/components/BytesInput.vue';

const { t } = useI18n();

const text = ref('The quick brown fox jumps over the lazy dog. '.repeat(20));
const format = ref<BytesInputFormat>('utf8');
const bytes = ref<Uint8Array>();
const hashes = computed(() => (bytes.value ? { ssdeep: ssdeep(bytes.value), ctph: ctph(bytes.value) } : undefined));

const hash1 = ref('');
const hash2 = ref('');
const comparison = computed(() => {
  if (!hash1.value.trim() || !hash2.value.trim()) {
    return {};
  }
  try {
    const isSsdeep = /^\d/.test(hash1.value.trim());
    const score = isSsdeep ? compareSsdeep(hash1.value, hash2.value) : compareCtph(hash1.value, hash2.value);
    return { score: Math.round(score), kind: isSsdeep ? 'SSDEEP' : 'CTPH' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
});

function useAsHash(target: 'hash1' | 'hash2') {
  const value = hashes.value?.ssdeep ?? '';
  if (target === 'hash1') {
    hash1.value = value;
  } else {
    hash2.value = value;
  }
}
</script>

<template>
  <div>
    <c-card :title="t('tools.fuzzy-hash.texts.title-hash')" mb-2>
      <bytes-input
        v-model:value="text"
        v-model:format="format"
        :formats="['utf8', 'hex', 'base64', 'latin1', 'file']"
        :label="t('tools.fuzzy-hash.texts.label-input')"
        :rows="4"
        @update:bytes="bytes = $event"
      />
      <n-divider />
      <n-input-group mb-2>
        <n-input-group-label style="flex: 0 0 90px">SSDEEP</n-input-group-label>
        <input-copyable :value="hashes?.ssdeep ?? ''" readonly font-mono data-test-id="ssdeep" />
      </n-input-group>
      <n-input-group>
        <n-input-group-label style="flex: 0 0 90px">CTPH</n-input-group-label>
        <input-copyable :value="hashes?.ctph ?? ''" readonly font-mono data-test-id="ctph" />
      </n-input-group>
      <div mt-3 flex flex-wrap gap-2>
        <c-button size="small" :disabled="!hashes" @click="useAsHash('hash1')">
          {{ t('tools.fuzzy-hash.texts.use-as', [1]) }}
        </c-button>
        <c-button size="small" :disabled="!hashes" @click="useAsHash('hash2')">
          {{ t('tools.fuzzy-hash.texts.use-as', [2]) }}
        </c-button>
      </div>
      <n-text depth="3" mt-2 block text-sm>{{ t('tools.fuzzy-hash.texts.hint-hash') }}</n-text>
    </c-card>

    <c-card :title="t('tools.fuzzy-hash.texts.title-compare')">
      <c-input-text
        v-model:value="hash1"
        :label="t('tools.fuzzy-hash.texts.label-hash', [1])"
        placeholder="96:...:..."
        raw-text
        monospace
        mb-2
        test-id="hash1"
      />
      <c-input-text
        v-model:value="hash2"
        :label="t('tools.fuzzy-hash.texts.label-hash', [2])"
        placeholder="96:...:..."
        raw-text
        monospace
        test-id="hash2"
      />
      <c-alert v-if="comparison.error" type="error" mt-3>{{ comparison.error }}</c-alert>
      <div v-else-if="comparison.score !== undefined" mt-3 data-test-id="score">
        <div mb-1>{{ t('tools.fuzzy-hash.texts.score', [comparison.kind, comparison.score]) }}</div>
        <n-progress type="line" :percentage="comparison.score" :show-indicator="false" />
      </div>
      <n-text depth="3" mt-2 block text-sm>{{ t('tools.fuzzy-hash.texts.hint-compare') }}</n-text>
    </c-card>
  </div>
</template>
