<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type LegacyAlgorithm, legacyAlgorithms, legacyHash } from './legacy-hashes.service';
import { murmurHash3, toSigned } from './murmurhash3';
import type { BytesInputFormat } from '@/components/BytesInput.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { bytesToBase64, bytesToHex } from '@/utils/bytes';

const { t } = useI18n();

const text = ref('Hello, World!');
const format = ref<BytesInputFormat>('utf8');
const bytes = ref<Uint8Array>();
const encoding = useQueryParamOrStorage<'hex' | 'base64'>({
  name: 'enc',
  storageName: 'legacy-hashes:enc',
  defaultValue: 'hex',
});
const settings = useQueryParamOrStorage({
  name: 'settings',
  storageName: 'legacy-hashes:settings',
  defaultValue: {
    md2Rounds: 18,
    md6Size: 256,
    md6Levels: 64,
    md6Key: '',
    sha0Rounds: 80,
    has160Rounds: 80,
    snefruSize: 128,
    snefruRounds: 8,
    shake128Size: 256,
    shake256Size: 512,
    murmurSeed: 0,
    murmurSigned: false,
  },
});

const labels: Record<LegacyAlgorithm, string> = {
  md2: 'MD2',
  md6: 'MD6',
  sha0: 'SHA-0',
  has160: 'HAS-160',
  snefru: 'Snefru',
  shake128: 'SHAKE128',
  shake256: 'SHAKE256',
  murmur3: 'MurmurHash3',
};

const encodingOptions = [
  { label: 'Hex', value: 'hex' },
  { label: 'Base64', value: 'base64' },
];
const snefruSizeOptions = [128, 256].map((value) => ({ label: `${value}`, value }));
const snefruRoundOptions = [2, 4, 8].map((value) => ({ label: `${value}`, value }));

function options(algorithm: LegacyAlgorithm) {
  const s = settings.value;
  switch (algorithm) {
    case 'md2':
      return { rounds: s.md2Rounds };
    case 'md6':
      return { size: s.md6Size, levels: s.md6Levels, key: new TextEncoder().encode(s.md6Key) };
    case 'sha0':
      return { rounds: s.sha0Rounds };
    case 'has160':
      return { rounds: s.has160Rounds };
    case 'snefru':
      return { size: s.snefruSize, rounds: s.snefruRounds };
    case 'shake128':
      return { size: s.shake128Size };
    case 'shake256':
      return { size: s.shake256Size };
    default:
      return {};
  }
}

const results = computed(() =>
  legacyAlgorithms.map((algorithm) => {
    if (!bytes.value) {
      return { algorithm, value: '' };
    }
    try {
      if (algorithm === 'murmur3') {
        const hash = murmurHash3(bytes.value, settings.value.murmurSeed ?? 0);
        return { algorithm, value: String(settings.value.murmurSigned ? toSigned(hash) : hash) };
      }
      const digest = legacyHash(algorithm, bytes.value, options(algorithm));
      return { algorithm, value: encoding.value === 'hex' ? bytesToHex(digest) : bytesToBase64(digest) };
    } catch (error) {
      return { algorithm, value: '', error: error instanceof Error ? error.message : String(error) };
    }
  }),
);
</script>

<template>
  <div>
    <c-card mb-2>
      <bytes-input
        v-model:value="text"
        v-model:format="format"
        :formats="['utf8', 'hex', 'base64', 'latin1', 'file']"
        :label="t('tools.legacy-hashes.texts.label-input')"
        :rows="3"
        @update:bytes="bytes = $event"
      />
      <c-buttons-select
        v-model:value="encoding"
        :options="encodingOptions"
        :label="t('tools.legacy-hashes.texts.label-encoding')"
        mt-3
      />
    </c-card>

    <c-card mb-2>
      <div v-for="{ algorithm, value, error } in results" :key="algorithm" my-1 :data-test-id="`hash-${algorithm}`">
        <n-input-group>
          <n-input-group-label style="flex: 0 0 130px">{{ labels[algorithm] }}</n-input-group-label>
          <input-copyable :value="error ?? value" readonly :status="error ? 'error' : undefined" />
        </n-input-group>
      </div>
    </c-card>

    <c-card>
      <n-collapse>
        <n-collapse-item :title="t('tools.legacy-hashes.texts.title-settings')" name="settings">
          <n-space vertical>
            <n-space align="center">
              <span w-130px>MD6</span>
              <n-form-item
                :label="t('tools.legacy-hashes.texts.label-size')"
                label-placement="left"
                :show-feedback="false"
              >
                <n-input-number-i18n v-model:value="settings.md6Size" :min="1" :max="512" w-110px />
              </n-form-item>
              <n-form-item
                :label="t('tools.legacy-hashes.texts.label-levels')"
                label-placement="left"
                :show-feedback="false"
              >
                <n-input-number-i18n v-model:value="settings.md6Levels" :min="0" :max="255" w-100px />
              </n-form-item>
              <c-input-text
                v-model:value="settings.md6Key"
                :label="t('tools.legacy-hashes.texts.label-key')"
                label-position="left"
                raw-text
                w-200px
              />
            </n-space>
            <n-space align="center">
              <span w-130px>Snefru</span>
              <c-buttons-select
                v-model:value="settings.snefruSize"
                :options="snefruSizeOptions"
                :label="t('tools.legacy-hashes.texts.label-size')"
              />
              <c-buttons-select
                v-model:value="settings.snefruRounds"
                :options="snefruRoundOptions"
                :label="t('tools.legacy-hashes.texts.label-rounds')"
              />
            </n-space>
            <n-space align="center">
              <span w-130px>SHAKE</span>
              <n-form-item label="128" label-placement="left" :show-feedback="false">
                <n-input-number-i18n v-model:value="settings.shake128Size" :min="8" :step="8" w-120px />
              </n-form-item>
              <n-form-item label="256" label-placement="left" :show-feedback="false">
                <n-input-number-i18n v-model:value="settings.shake256Size" :min="8" :step="8" w-120px />
              </n-form-item>
              <n-text depth="3" text-sm>{{ t('tools.legacy-hashes.texts.hint-bits') }}</n-text>
            </n-space>
            <n-space align="center">
              <span w-130px>MurmurHash3</span>
              <n-form-item
                :label="t('tools.legacy-hashes.texts.label-seed')"
                label-placement="left"
                :show-feedback="false"
              >
                <n-input-number-i18n v-model:value="settings.murmurSeed" :min="0" :max="4294967295" w-150px />
              </n-form-item>
              <n-form-item
                :label="t('tools.legacy-hashes.texts.label-signed')"
                label-placement="left"
                :show-feedback="false"
              >
                <n-switch v-model:value="settings.murmurSigned" />
              </n-form-item>
            </n-space>
            <n-space align="center">
              <span w-130px>{{ t('tools.legacy-hashes.texts.label-rounds') }}</span>
              <n-form-item label="MD2" label-placement="left" :show-feedback="false">
                <n-input-number-i18n v-model:value="settings.md2Rounds" :min="0" :max="1000" w-100px />
              </n-form-item>
              <n-form-item label="SHA-0" label-placement="left" :show-feedback="false">
                <n-input-number-i18n v-model:value="settings.sha0Rounds" :min="16" :max="80" w-100px />
              </n-form-item>
              <n-form-item label="HAS-160" label-placement="left" :show-feedback="false">
                <n-input-number-i18n v-model:value="settings.has160Rounds" :min="1" :max="80" w-100px />
              </n-form-item>
            </n-space>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </c-card>
  </div>
</template>
