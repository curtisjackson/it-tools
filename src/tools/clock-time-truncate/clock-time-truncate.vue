<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { truncateClockTime } from './clock-time-truncate.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { getErrorMessageIfThrows } from '@/utils/error';

const { t } = useI18n();

const precision = useQueryParamOrStorage<'minutes' | 'hours'>({
  name: 'to',
  storageName: 'clock-time-truncate:to',
  defaultValue: 'minutes',
});
const zeroPrint = useQueryParamOrStorage({
  name: 'zeros',
  storageName: 'clock-time-truncate:zeros',
  defaultValue: false,
});
const zeroPadding = useQueryParamOrStorage({ name: 'pad', storageName: 'clock-time-truncate:pad', defaultValue: true });

const precisionOptions = computed(() => [
  { label: t('tools.clock-time-truncate.texts.to-minutes'), value: 'minutes' },
  { label: t('tools.clock-time-truncate.texts.to-hours'), value: 'hours' },
]);

function transformer(value: string) {
  let output = '';
  const error = getErrorMessageIfThrows(() => {
    output = truncateClockTime(value, precision.value === 'minutes', zeroPrint.value, zeroPadding.value);
  });
  return error ? `❌ ${error}` : output;
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="precision"
        :options="precisionOptions"
        :label="t('tools.clock-time-truncate.texts.label-to')"
        mb-2
      />
      <n-space>
        <n-form-item
          :label="t('tools.clock-time-truncate.texts.label-zeros')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="zeroPrint" />
        </n-form-item>
        <n-form-item
          :label="t('tools.clock-time-truncate.texts.label-pad')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="zeroPadding" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.clock-time-truncate.texts.placeholder-input')"
      :input-default="'09:15:42\n13:05:07\n7:30:59'"
    />
  </div>
</template>
