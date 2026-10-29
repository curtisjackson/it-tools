<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, rotateList } from './list-rotate.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: 'list-rotate:split',
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: 'list-rotate:sep', defaultValue: ',' });
const joinSeparator = useQueryParamOrStorage({ name: 'join', storageName: 'list-rotate:join', defaultValue: ',' });
const direction = useQueryParamOrStorage<'right' | 'left'>({
  name: 'dir',
  storageName: 'list-rotate:dir',
  defaultValue: 'right',
});
const step = useQueryParamOrStorage({ name: 'step', storageName: 'list-rotate:step', defaultValue: 1 });

const directionOptions = computed(() => [
  { label: t('tools.list-rotate.texts.direction-left'), value: 'left' },
  { label: t('tools.list-rotate.texts.direction-right'), value: 'right' },
]);

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      rotateList(
        splitOperatorType.value,
        value,
        splitSeparator.value,
        joinSeparator.value,
        direction.value === 'right',
        step.value ?? undefined,
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
          :label="t('tools.list-rotate.texts.label-join-separator')"
          label-position="left"
          raw-text
        />
        <c-buttons-select
          v-model:value="direction"
          :options="directionOptions"
          :label="t('tools.list-rotate.texts.label-direction')"
        />
        <n-form-item :label="t('tools.list-rotate.texts.label-step')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="step" :min="1" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-rotate.texts.placeholder-input')"
      input-default="1,2,3,4,5"
    />
  </div>
</template>
