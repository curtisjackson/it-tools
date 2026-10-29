<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatIpGroups, groupIps } from './ip-grouper.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const storage = (name: string) => `ip-grouper:${name}`;
const ipv4Prefix = useQueryParamOrStorage({ name: 'v4', storageName: storage('v4'), defaultValue: 24 });
const ipv6Prefix = useQueryParamOrStorage({ name: 'v6', storageName: storage('v6'), defaultValue: 64 });
const unique = useQueryParamOrStorage({ name: 'unique', storageName: storage('unique'), defaultValue: true });
const onlySubnets = useQueryParamOrStorage({ name: 'subnets', storageName: storage('subnets'), defaultValue: false });
const counts = useQueryParamOrStorage({ name: 'counts', storageName: storage('counts'), defaultValue: true });

const input = ref(`192.168.1.20
192.168.1.3
10.0.0.15
192.168.2.1
10.0.0.15
2001:db8::5
2001:db8:0:1::1
2001:db8::1`);

const result = computed(() => {
  try {
    const { groups, invalid } = groupIps(input.value, {
      ipv4Prefix: ipv4Prefix.value ?? 24,
      ipv6Prefix: ipv6Prefix.value ?? 64,
      unique: unique.value,
    });
    return {
      output: formatIpGroups(groups, { onlySubnets: onlySubnets.value, counts: counts.value }),
      groups: groups.length,
      invalid,
      error: undefined,
    };
  } catch (error) {
    return { output: '', groups: 0, invalid: [], error: error instanceof Error ? error.message : String(error) };
  }
});
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center" mb-2>
        <n-form-item
          :label="t('tools.ip-grouper.texts.label-ipv4-prefix')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="ipv4Prefix" :min="0" :max="32" w-110px>
            <template #prefix>/</template>
          </n-input-number-i18n>
        </n-form-item>
        <n-form-item
          :label="t('tools.ip-grouper.texts.label-ipv6-prefix')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="ipv6Prefix" :min="0" :max="128" w-110px>
            <template #prefix>/</template>
          </n-input-number-i18n>
        </n-form-item>
      </n-space>
      <n-space>
        <n-form-item :label="t('tools.ip-grouper.texts.label-unique')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="unique" />
        </n-form-item>
        <n-form-item :label="t('tools.ip-grouper.texts.label-counts')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="counts" />
        </n-form-item>
        <n-form-item
          :label="t('tools.ip-grouper.texts.label-only-subnets')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="onlySubnets" />
        </n-form-item>
      </n-space>
    </c-card>

    <n-grid cols="1 m:2" x-gap="12" y-gap="12" responsive="screen">
      <n-gi>
        <c-input-text
          v-model:value="input"
          :label="t('tools.ip-grouper.texts.label-input')"
          :placeholder="t('tools.ip-grouper.texts.placeholder-input')"
          :rows="14"
          multiline
          raw-text
          monospace
          test-id="input"
        />
      </n-gi>
      <n-gi>
        <div mb-1 text-sm op-70 data-test-id="summary">
          {{ t('tools.ip-grouper.texts.summary', [result.groups]) }}
        </div>
        <c-alert v-if="result.error" type="error" mb-2>{{ result.error }}</c-alert>
        <textarea-copyable :value="result.output" data-test-id="output" />
        <c-alert v-if="result.invalid.length > 0" type="warning" mt-2 data-test-id="invalid">
          {{ t('tools.ip-grouper.texts.invalid', [result.invalid.join(', ')]) }}
        </c-alert>
      </n-gi>
    </n-grid>
  </div>
</template>
