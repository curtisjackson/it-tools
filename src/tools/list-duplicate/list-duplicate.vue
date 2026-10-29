<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, duplicateList } from './list-duplicate.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: 'list-duplicate:split',
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: 'list-duplicate:sep', defaultValue: ' ' });
const joinSeparator = useQueryParamOrStorage({ name: 'join', storageName: 'list-duplicate:join', defaultValue: ' ' });
const copies = useQueryParamOrStorage({ name: 'copies', storageName: 'list-duplicate:copies', defaultValue: 2 });
const concatenate = useQueryParamOrStorage({
  name: 'concat',
  storageName: 'list-duplicate:concat',
  defaultValue: true,
});
const reverse = useQueryParamOrStorage({ name: 'rev', storageName: 'list-duplicate:rev', defaultValue: false });

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      duplicateList(
        splitOperatorType.value,
        splitSeparator.value,
        joinSeparator.value,
        value,
        concatenate.value,
        reverse.value,
        copies.value ?? undefined,
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
      <n-space align="center" mb-2>
        <c-input-text
          v-model:value="joinSeparator"
          :label="t('tools.list-duplicate.texts.label-join-separator')"
          label-position="left"
          raw-text
        />
        <n-form-item
          :label="t('tools.list-duplicate.texts.label-copies')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-input-number-i18n v-model:value="copies" :min="0.1" :step="0.5" />
        </n-form-item>
      </n-space>
      <n-space align="center">
        <n-form-item
          :label="t('tools.list-duplicate.texts.label-concatenate')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="concatenate" />
        </n-form-item>
        <n-form-item
          :label="t('tools.list-duplicate.texts.label-reverse')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="reverse" />
        </n-form-item>
      </n-space>
      <n-text depth="3" text-sm>{{ t('tools.list-duplicate.texts.hint') }}</n-text>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-duplicate.texts.placeholder-input')"
      input-default="Hello World"
    />
  </div>
</template>
