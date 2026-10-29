<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, truncateList } from './list-truncate.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: 'list-truncate:split',
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: 'list-truncate:sep', defaultValue: ',' });
const joinSeparator = useQueryParamOrStorage({ name: 'join', storageName: 'list-truncate:join', defaultValue: ',' });
const keep = useQueryParamOrStorage<'first' | 'last'>({
  name: 'keep',
  storageName: 'list-truncate:keep',
  defaultValue: 'first',
});
const length = useQueryParamOrStorage({ name: 'len', storageName: 'list-truncate:len', defaultValue: 3 });

const keepOptions = computed(() => [
  { label: t('tools.list-truncate.texts.keep-first'), value: 'first' },
  { label: t('tools.list-truncate.texts.keep-last'), value: 'last' },
]);

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      truncateList(
        splitOperatorType.value,
        value,
        splitSeparator.value,
        joinSeparator.value,
        keep.value === 'first',
        length.value ?? undefined,
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
      <n-space align="center">
        <c-input-text
          v-model:value="joinSeparator"
          :label="t('tools.list-truncate.texts.label-join-separator')"
          label-position="left"
          raw-text
        />
        <c-buttons-select
          v-model:value="keep"
          :options="keepOptions"
          :label="t('tools.list-truncate.texts.label-keep')"
        />
        <n-form-item :label="t('tools.list-truncate.texts.label-length')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="length" :min="0" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-truncate.texts.placeholder-input')"
      input-default="a,b,c,d,e,f"
    />
  </div>
</template>
