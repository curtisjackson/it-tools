<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { convertTimeToDecimal } from './time-to-decimal.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const decimalPlaces = useQueryParamOrStorage({ name: 'dp', storageName: 'time-to-decimal:dp', defaultValue: 2 });

function transformer(value: string) {
  return convertTimeToDecimal(
    value,
    { decimalPlaces: String(decimalPlaces.value ?? 2) },
    `❌ ${t('tools.time-to-decimal.texts.invalid')}`,
  );
}
</script>

<template>
  <div>
    <c-card mb-2>
      <n-form-item
        :label="t('tools.time-to-decimal.texts.label-decimal-places')"
        label-placement="left"
        :show-feedback="false"
      >
        <n-input-number-i18n v-model:value="decimalPlaces" :min="0" :max="10" />
      </n-form-item>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.time-to-decimal.texts.placeholder-input')"
      :input-default="'1:30\n7:45\n13:25:30'"
    />
  </div>
</template>
