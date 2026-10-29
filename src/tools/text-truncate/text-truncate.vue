<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { extractSubstring, truncateText, type truncationSideType } from './text-truncate.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const mode = useQueryParamOrStorage<'truncate' | 'substring'>({
  name: 'mode',
  storageName: 'text-truncate:mode',
  defaultValue: 'truncate',
});
const side = useQueryParamOrStorage<truncationSideType>({
  name: 'side',
  storageName: 'text-truncate:side',
  defaultValue: 'right',
});
const maxLength = useQueryParamOrStorage({ name: 'max', storageName: 'text-truncate:max', defaultValue: 15 });
const lineByLine = useQueryParamOrStorage({ name: 'lines', storageName: 'text-truncate:lines', defaultValue: false });
const addIndicator = useQueryParamOrStorage({ name: 'ind', storageName: 'text-truncate:ind', defaultValue: true });
const indicator = useQueryParamOrStorage({ name: 'indtext', storageName: 'text-truncate:indtext', defaultValue: '…' });
const start = useQueryParamOrStorage({ name: 'start', storageName: 'text-truncate:start', defaultValue: 1 });
const length = useQueryParamOrStorage({ name: 'len', storageName: 'text-truncate:len', defaultValue: 5 });
const reverse = useQueryParamOrStorage({ name: 'rev', storageName: 'text-truncate:rev', defaultValue: false });

const modeOptions = computed(() => [
  { label: t('tools.text-truncate.texts.mode-truncate'), value: 'truncate' },
  { label: t('tools.text-truncate.texts.mode-substring'), value: 'substring' },
]);
const sideOptions = computed(() => [
  { label: t('tools.text-truncate.texts.side-right'), value: 'right' },
  { label: t('tools.text-truncate.texts.side-left'), value: 'left' },
]);

const indicatorTooLong = computed(
  () => mode.value === 'truncate' && addIndicator.value && indicator.value.length > (maxLength.value ?? 0),
);

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      mode.value === 'substring'
        ? extractSubstring(value, start.value ?? 1, length.value ?? 0, lineByLine.value, reverse.value)
        : truncateText(
            {
              truncationSide: side.value,
              maxLength: String(maxLength.value ?? 0),
              lineByLine: lineByLine.value,
              addIndicator: addIndicator.value,
              indicator: indicator.value,
            },
            value,
          ),
    '',
  );
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="mode"
        :options="modeOptions"
        :label="t('tools.text-truncate.texts.label-mode')"
        mb-3
      />

      <template v-if="mode === 'truncate'">
        <n-space align="center" mb-2>
          <c-buttons-select
            v-model:value="side"
            :options="sideOptions"
            :label="t('tools.text-truncate.texts.label-side')"
          />
          <n-form-item
            :label="t('tools.text-truncate.texts.label-max-length')"
            label-placement="left"
            :show-feedback="false"
          >
            <n-input-number-i18n v-model:value="maxLength" :min="0" />
          </n-form-item>
        </n-space>
        <n-space align="center">
          <n-form-item
            :label="t('tools.text-truncate.texts.label-add-indicator')"
            label-placement="left"
            :show-feedback="false"
          >
            <n-switch v-model:value="addIndicator" />
          </n-form-item>
          <c-input-text
            v-if="addIndicator"
            v-model:value="indicator"
            :label="t('tools.text-truncate.texts.label-indicator')"
            label-position="left"
            raw-text
          />
        </n-space>
        <c-alert v-if="indicatorTooLong" type="warning" mt-2>{{
          t('tools.text-truncate.texts.warning-indicator')
        }}</c-alert>
      </template>

      <n-space v-else align="center">
        <n-form-item :label="t('tools.text-truncate.texts.label-start')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="start" :min="1" />
        </n-form-item>
        <n-form-item :label="t('tools.text-truncate.texts.label-length')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="length" :min="0" />
        </n-form-item>
        <n-form-item
          :label="t('tools.text-truncate.texts.label-reverse')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="reverse" />
        </n-form-item>
      </n-space>

      <n-form-item
        :label="t('tools.text-truncate.texts.label-line-by-line')"
        label-placement="left"
        :show-feedback="false"
        mt-2
      >
        <n-switch v-model:value="lineByLine" />
      </n-form-item>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.text-truncate.texts.placeholder-input')"
      input-default="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    />
  </div>
</template>
