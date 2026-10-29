<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { inspectHash } from './hash-inspector.service';

const { t, te } = useI18n();

const hash = ref('$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$RdescudvJCsgt3ub+b+dWRWJTmaaJObG');
const password = ref('');
const checking = ref(false);
const match = ref<boolean>();
const checkError = ref<string>();

const outcome = computed(() => {
  try {
    return { info: inspectHash(hash.value) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
});
watch([hash, password], () => {
  match.value = undefined;
  checkError.value = undefined;
});

const label = (key: string) =>
  te(`tools.hash-inspector.texts.field-${key}`) ? t(`tools.hash-inspector.texts.field-${key}`) : key;

async function check() {
  const verify = outcome.value.info?.verify;
  if (!verify) {
    return;
  }
  checking.value = true;
  try {
    match.value = await verify(password.value);
  } catch (error) {
    checkError.value = error instanceof Error ? error.message : String(error);
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="hash"
        :label="t('tools.hash-inspector.texts.label-hash')"
        :placeholder="t('tools.hash-inspector.texts.placeholder-hash')"
        raw-text
        monospace
        test-id="hash"
      />
      <n-text depth="3" mt-2 block text-sm>{{ t('tools.hash-inspector.texts.hint') }}</n-text>
    </c-card>

    <c-alert v-if="outcome.error" type="error" data-test-id="error">{{
      t('tools.hash-inspector.texts.unrecognised')
    }}</c-alert>
    <template v-else-if="outcome.info">
      <c-card :title="outcome.info.scheme" mb-2 data-test-id="scheme">
        <n-table size="small" :single-line="false">
          <tbody>
            <tr v-for="[key, value] in outcome.info.fields" :key="key">
              <td w-160px>{{ label(key) }}</td>
              <td break-all font-mono text-sm>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
      </c-card>

      <c-card v-if="outcome.info.verify" :title="t('tools.hash-inspector.texts.title-check')">
        <div flex flex-wrap items-end gap-2>
          <c-input-text
            v-model:value="password"
            :label="t('tools.hash-inspector.texts.label-password')"
            type="password"
            raw-text
            flex-1
            test-id="password"
          />
          <c-button :loading="checking" data-test-id="check" @click="check">
            {{ t('tools.hash-inspector.texts.button-check') }}
          </c-button>
        </div>
        <c-alert v-if="checkError" type="error" mt-2>{{ checkError }}</c-alert>
        <n-alert
          v-else-if="match !== undefined"
          :type="match ? 'success' : 'error'"
          :show-icon="false"
          mt-2
          data-test-id="match"
        >
          {{ t(match ? 'tools.hash-inspector.texts.match' : 'tools.hash-inspector.texts.no-match') }}
        </n-alert>
      </c-card>
    </template>
  </div>
</template>
