<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  type DisplayFormat,
  type SortingMethod,
  type SplitOperatorType,
  TopItemsList,
} from './list-most-popular.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const storage = (name: string) => `list-most-popular:${name}`;
const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: storage('split'),
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: storage('sep'), defaultValue: '\\n' });
const sortingMethod = useQueryParamOrStorage<SortingMethod>({
  name: 'sort',
  storageName: storage('sort'),
  defaultValue: 'count',
});
const displayFormat = useQueryParamOrStorage<DisplayFormat>({
  name: 'fmt',
  storageName: storage('fmt'),
  defaultValue: 'percentage',
});
const deleteEmptyItems = useQueryParamOrStorage({ name: 'skip', storageName: storage('skip'), defaultValue: true });
const ignoreCase = useQueryParamOrStorage({ name: 'icase', storageName: storage('icase'), defaultValue: false });
const trimItems = useQueryParamOrStorage({ name: 'trim', storageName: storage('trim'), defaultValue: true });

const sortOptions = computed(() => [
  { label: t('tools.list-most-popular.texts.sort-count'), value: 'count' },
  { label: t('tools.list-most-popular.texts.sort-alphabetic'), value: 'alphabetic' },
]);
const formatOptions = computed(() => [
  { label: t('tools.list-most-popular.texts.format-count'), value: 'count' },
  { label: t('tools.list-most-popular.texts.format-percentage'), value: 'percentage' },
  { label: t('tools.list-most-popular.texts.format-total'), value: 'total' },
]);

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      TopItemsList(
        splitOperatorType.value,
        sortingMethod.value,
        displayFormat.value,
        splitSeparator.value,
        value,
        deleteEmptyItems.value,
        ignoreCase.value,
        trimItems.value,
      ),
    '',
  );
}
</script>

<template>
  <div>
    <c-card mb-2>
      <split-separator-options
        v-model:split-operator-type="splitOperatorType"
        v-model:split-separator="splitSeparator"
      />
      <c-buttons-select
        v-model:value="sortingMethod"
        :options="sortOptions"
        :label="t('tools.list-most-popular.texts.label-sort')"
        mb-2
      />
      <c-buttons-select
        v-model:value="displayFormat"
        :options="formatOptions"
        :label="t('tools.list-most-popular.texts.label-format')"
        mb-2
      />
      <n-space>
        <n-form-item
          :label="t('tools.list-most-popular.texts.label-trim')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="trimItems" />
        </n-form-item>
        <n-form-item
          :label="t('tools.list-most-popular.texts.label-skip-empty')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="deleteEmptyItems" />
        </n-form-item>
        <n-form-item
          :label="t('tools.list-most-popular.texts.label-ignore-case')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="ignoreCase" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-most-popular.texts.placeholder-input')"
      :input-default="'apple\nbanana\napple\ncherry\napple\nbanana'"
    />
  </div>
</template>
