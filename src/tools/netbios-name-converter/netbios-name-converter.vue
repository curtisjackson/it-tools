<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { decodeNetbiosName, encodeNetbiosName, netbiosSuffixes } from './netbios-name-converter.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const NO_SUFFIX = -1;
const CUSTOM_SUFFIX = -2;

const storage = (name: string) => `netbios-name-converter:${name}`;
const name = useQueryParamOrStorage({ name: 'name', storageName: storage('name'), defaultValue: 'WORKGROUP' });
const suffix = useQueryParamOrStorage({ name: 'suffix', storageName: storage('suffix'), defaultValue: 0x20 });
const customSuffix = useQueryParamOrStorage({ name: 'custom', storageName: storage('custom'), defaultValue: '00' });
const offset = useQueryParamOrStorage({ name: 'offset', storageName: storage('offset'), defaultValue: 65 });
const upperCase = useQueryParamOrStorage({ name: 'upper', storageName: storage('upper'), defaultValue: true });
const encodedInput = ref('FHEPFCELEHFCEPFFFACACACACACACABN');

const hex = (value: number) => value.toString(16).toUpperCase().padStart(2, '0');
const suffixOptions = computed(() => [
  ...Object.entries(netbiosSuffixes).map(([value, service]) => ({
    label: `<${hex(Number(value))}> ${service}`,
    value: Number(value),
  })),
  { label: t('tools.netbios-name-converter.texts.suffix-none'), value: NO_SUFFIX },
  { label: t('tools.netbios-name-converter.texts.suffix-custom'), value: CUSTOM_SUFFIX },
]);

function attempt<T>(run: () => T): { value?: T; error?: string } {
  try {
    return { value: run() };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const encoded = computed(() =>
  attempt(() => {
    let byte: number | null = suffix.value === NO_SUFFIX ? null : suffix.value;
    if (suffix.value === CUSTOM_SUFFIX) {
      if (!/^[0-9a-f]{1,2}$/i.test(customSuffix.value.trim())) {
        throw new Error(t('tools.netbios-name-converter.texts.invalid-suffix'));
      }
      byte = Number.parseInt(customSuffix.value, 16);
    }
    return encodeNetbiosName(name.value, { offset: offset.value ?? 65, suffix: byte, upperCase: upperCase.value });
  }),
);
const decoded = computed(() => attempt(() => decodeNetbiosName(encodedInput.value, { offset: offset.value ?? 65 })));
const decodedSuffix = computed(() => {
  const value = decoded.value.value;
  if (value?.suffix === undefined) {
    return t('tools.netbios-name-converter.texts.suffix-none');
  }
  return `<${hex(value.suffix)}>${value.service ? ` ${value.service}` : ''}`;
});
</script>

<template>
  <div>
    <c-card mb-2>
      <n-form-item
        :label="t('tools.netbios-name-converter.texts.label-offset')"
        label-placement="left"
        :show-feedback="false"
        mb-1
      >
        <n-input-number-i18n v-model:value="offset" :min="0" :max="240" w-120px />
      </n-form-item>
      <n-text depth="3" block text-sm>{{ t('tools.netbios-name-converter.texts.hint') }}</n-text>
    </c-card>

    <c-card :title="t('tools.netbios-name-converter.texts.title-encode')" mb-2>
      <c-input-text
        v-model:value="name"
        :label="t('tools.netbios-name-converter.texts.label-name')"
        raw-text
        test-id="name"
        mb-2
      />
      <n-space align="center" mb-2>
        <c-select
          v-model:value="suffix"
          :options="suffixOptions"
          :label="t('tools.netbios-name-converter.texts.label-suffix')"
          label-position="left"
          w-340px
        />
        <c-input-text
          v-if="suffix === CUSTOM_SUFFIX"
          v-model:value="customSuffix"
          :label="t('tools.netbios-name-converter.texts.label-custom-suffix')"
          label-position="left"
          w-140px
        />
        <n-form-item
          :label="t('tools.netbios-name-converter.texts.label-upper')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="upperCase" />
        </n-form-item>
      </n-space>
      <c-alert v-if="encoded.error" type="error">{{ encoded.error }}</c-alert>
      <input-copyable v-else :value="encoded.value" readonly font-mono data-test-id="encoded" />
    </c-card>

    <c-card :title="t('tools.netbios-name-converter.texts.title-decode')">
      <c-input-text
        v-model:value="encodedInput"
        :label="t('tools.netbios-name-converter.texts.label-encoded')"
        raw-text
        monospace
        test-id="encoded-input"
        mb-2
      />
      <c-alert v-if="decoded.error" type="error">{{ decoded.error }}</c-alert>
      <template v-else>
        <input-copyable
          :value="decoded.value?.name"
          readonly
          :label="t('tools.netbios-name-converter.texts.label-name')"
          label-position="left"
          label-width="110px"
          mb-2
          data-test-id="decoded"
        />
        <input-copyable
          :value="decodedSuffix"
          readonly
          :label="t('tools.netbios-name-converter.texts.label-suffix')"
          label-position="left"
          label-width="110px"
        />
      </template>
    </c-card>
  </div>
</template>
