<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type Weekday, findMatchingYears } from './date-weekday-calculator.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { getErrorMessageIfThrows } from '@/utils/error';

const { t, locale } = useI18n();

const storage = (name: string) => `date-weekday-calculator:${name}`;
const month = useQueryParamOrStorage({ name: 'month', storageName: storage('month'), defaultValue: 7 });
const day = useQueryParamOrStorage({ name: 'day', storageName: storage('day'), defaultValue: 23 });
const weekday = useQueryParamOrStorage<Weekday>({
  name: 'weekday',
  storageName: storage('weekday'),
  defaultValue: 'friday',
});
const startYear = useQueryParamOrStorage({
  name: 'from',
  storageName: storage('from'),
  defaultValue: new Date().getFullYear(),
});
const endYear = useQueryParamOrStorage({
  name: 'to',
  storageName: storage('to'),
  defaultValue: new Date().getFullYear() + 30,
});

const weekdays: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Intl.DateTimeFormat(locale.value, { month: 'long' }).format(new Date(2000, i, 1)),
  })),
);
// 2024-01-01 is a Monday.
const weekdayOptions = computed(() =>
  weekdays.map((value, i) => ({
    value,
    label: new Intl.DateTimeFormat(locale.value, { weekday: 'long' }).format(new Date(2024, 0, 1 + i)),
  })),
);

const input = computed(() => ({
  month: month.value ?? Number.NaN,
  day: day.value ?? Number.NaN,
  weekday: weekday.value,
  startYear: startYear.value ?? Number.NaN,
  endYear: endYear.value ?? Number.NaN,
  locale: locale.value,
}));
const error = computed(() => getErrorMessageIfThrows(() => findMatchingYears(input.value)));
const result = computed(() => (error.value ? undefined : findMatchingYears(input.value)));
const listing = computed(() => result.value?.matches.map((match) => match.formatted).join('\n') ?? '');
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center" mb-2>
        <n-form-item
          :label="t('tools.date-weekday-calculator.texts.label-day')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="day" :min="1" :max="31" />
        </n-form-item>
        <c-select
          v-model:value="month"
          :options="monthOptions"
          :label="t('tools.date-weekday-calculator.texts.label-month')"
          label-position="left"
        />
        <c-select
          v-model:value="weekday"
          :options="weekdayOptions"
          :label="t('tools.date-weekday-calculator.texts.label-weekday')"
          label-position="left"
        />
      </n-space>
      <n-space align="center">
        <n-form-item
          :label="t('tools.date-weekday-calculator.texts.label-from')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="startYear" :min="1" :max="9999" />
        </n-form-item>
        <n-form-item
          :label="t('tools.date-weekday-calculator.texts.label-to')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="endYear" :min="1" :max="9999" />
        </n-form-item>
      </n-space>
    </c-card>

    <c-alert v-if="error" type="error">{{ error }}</c-alert>
    <c-card v-else-if="result" :title="t('tools.date-weekday-calculator.texts.found', [result.count])">
      <textarea-copyable v-if="result.count > 0" :value="listing" />
      <n-text v-else depth="3">{{ t('tools.date-weekday-calculator.texts.none') }}</n-text>
    </c-card>
  </div>
</template>
