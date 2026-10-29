<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SshSide, fingerprint } from './tls-ssh-fingerprint.service';
import { JA4_VECTORS } from './tls-ssh-fingerprint.vectors';
import type { BytesInputFormat } from '@/components/BytesInput.vue';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t, te } = useI18n();

const sshSide = useQueryParamOrStorage<SshSide>({
  name: 'ssh',
  storageName: 'tls-ssh-fingerprint:ssh',
  defaultValue: 'client',
});
const sshSideOptions = computed(() => [
  { label: t('tools.tls-ssh-fingerprint.texts.ssh-client'), value: 'client' },
  { label: t('tools.tls-ssh-fingerprint.texts.ssh-server'), value: 'server' },
]);

// A TLS 1.3 ClientHello from the CyberChef tests.
const text = ref(JA4_VECTORS[0][1]);
const format = ref<BytesInputFormat>('hex');
const bytes = ref<Uint8Array>();

const outcome = computed(() => {
  if (!bytes.value?.length) {
    return {};
  }
  try {
    return { report: fingerprint(bytes.value, { sshSide: sshSide.value }) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
});
const report = computed(() => outcome.value.report);
const detailLabel = (key: string) =>
  te(`tools.tls-ssh-fingerprint.texts.detail-${key}`) ? t(`tools.tls-ssh-fingerprint.texts.detail-${key}`) : key;
</script>

<template>
  <div>
    <c-card mb-2>
      <bytes-input
        v-model:value="text"
        v-model:format="format"
        :formats="['hex', 'base64', 'latin1', 'file']"
        :label="t('tools.tls-ssh-fingerprint.texts.label-input')"
        :rows="6"
        @update:bytes="bytes = $event"
      />
      <c-buttons-select
        v-model:value="sshSide"
        :options="sshSideOptions"
        :label="t('tools.tls-ssh-fingerprint.texts.label-ssh-side')"
        mt-3
      />
      <n-text depth="3" mt-2 block text-sm>{{ t('tools.tls-ssh-fingerprint.texts.hint') }}</n-text>
    </c-card>

    <c-alert v-if="outcome.error" type="error" data-test-id="error">{{ outcome.error }}</c-alert>
    <template v-if="report">
      <c-card :title="report.message" mb-2>
        <div v-for="item in report.fingerprints" :key="item.name" mb-4 :data-test-id="`fingerprint-${item.name}`">
          <div mb-1 font-bold>{{ item.name }}</div>
          <input-copyable :value="item.hash" readonly mb-1 data-test-id="hash" />
          <input-copyable :value="item.text" readonly multiline autosize />
        </div>
      </c-card>
      <c-card :title="t('tools.tls-ssh-fingerprint.texts.title-details')">
        <n-table size="small" :single-line="false">
          <tbody>
            <tr v-for="[key, value] in report.details" :key="key">
              <td w-180px>{{ detailLabel(key) }}</td>
              <td break-all font-mono text-sm>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
      </c-card>
    </template>
  </div>
</template>
