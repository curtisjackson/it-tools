<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { lmHash, ntHash } from './windows-password-hashes.service';

const { t } = useI18n();

const password = ref('Password123');
const nt = computedAsync(() => ntHash(password.value), '');
const lm = computed(() => lmHash(password.value));
const combined = computed(() => (nt.value ? `${lm.value.hash}:${nt.value}` : ''));
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="password"
        :label="t('tools.windows-password-hashes.texts.label-password')"
        raw-text
        test-id="password"
      />
    </c-card>

    <c-card>
      <input-copyable
        :value="nt"
        readonly
        :label="t('tools.windows-password-hashes.texts.label-nt')"
        label-position="left"
        label-width="120px"
        font-mono
        mb-2
        data-test-id="nt"
      />
      <input-copyable
        :value="lm.hash"
        readonly
        :label="t('tools.windows-password-hashes.texts.label-lm')"
        label-position="left"
        label-width="120px"
        font-mono
        mb-2
        data-test-id="lm"
      />
      <input-copyable
        :value="combined"
        readonly
        :label="t('tools.windows-password-hashes.texts.label-combined')"
        label-position="left"
        label-width="120px"
        font-mono
      />
      <c-alert v-if="lm.truncated" type="warning" mt-3>{{
        t('tools.windows-password-hashes.texts.lm-truncated')
      }}</c-alert>
      <c-alert v-if="lm.replaced" type="warning" mt-3>{{
        t('tools.windows-password-hashes.texts.lm-replaced')
      }}</c-alert>
      <n-text depth="3" mt-3 block text-sm>{{ t('tools.windows-password-hashes.texts.hint') }}</n-text>
    </c-card>
  </div>
</template>
