<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type DayMonthOrder, extractDates } from './extract-dates.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const order = useQueryParamOrStorage<DayMonthOrder>({
  name: 'order',
  storageName: 'extract-dates:order',
  defaultValue: 'dmy',
});
const output = useQueryParamOrStorage<'text' | 'iso'>({
  name: 'out',
  storageName: 'extract-dates:out',
  defaultValue: 'text',
});
const unique = useQueryParamOrStorage({ name: 'unique', storageName: 'extract-dates:unique', defaultValue: false });
const showTotal = useQueryParamOrStorage({ name: 'total', storageName: 'extract-dates:total', defaultValue: false });

const orderOptions = computed(() => [
  { label: t('tools.extract-dates.texts.order-dmy'), value: 'dmy' },
  { label: t('tools.extract-dates.texts.order-mdy'), value: 'mdy' },
]);
const outputOptions = computed(() => [
  { label: t('tools.extract-dates.texts.output-text'), value: 'text' },
  { label: 'ISO 8601', value: 'iso' },
]);

function transformer(value: string) {
  const dates = extractDates(value, { order: order.value, unique: unique.value }).map((date) =>
    output.value === 'iso' ? date.iso : date.text,
  );
  const list = dates.join('\n');
  return showTotal.value ? `${t('tools.extract-dates.texts.total', [dates.length])}\n\n${list}` : list;
}
</script>

<template>
  <div>
    <c-card mb-2>
      <c-buttons-select
        v-model:value="order"
        :options="orderOptions"
        :label="t('tools.extract-dates.texts.label-order')"
        label-width="120px"
        mb-2
      />
      <c-buttons-select
        v-model:value="output"
        :options="outputOptions"
        :label="t('tools.extract-dates.texts.label-output')"
        label-width="120px"
        mb-2
      />
      <n-space>
        <n-form-item :label="t('tools.extract-dates.texts.label-unique')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="unique" />
        </n-form-item>
        <n-form-item :label="t('tools.extract-dates.texts.label-total')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="showTotal" />
        </n-form-item>
      </n-space>
      <n-text depth="3" text-sm>{{ t('tools.extract-dates.texts.hint') }}</n-text>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.extract-dates.texts.placeholder-input')"
      input-default="Signed on 12.03.2024, updated 2024-03-15T10:30Z. Not a date: 31.02.2024."
    />
  </div>
</template>
