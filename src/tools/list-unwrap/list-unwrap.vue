<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, unwrapList } from './list-unwrap.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const storage = (name: string) => `list-unwrap:${name}`;
const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: storage('split'),
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: storage('sep'), defaultValue: '\\n' });
const joinSeparator = useQueryParamOrStorage({ name: 'join', storageName: storage('join'), defaultValue: '\\n' });
const left = useQueryParamOrStorage({ name: 'left', storageName: storage('left'), defaultValue: '"' });
const right = useQueryParamOrStorage({ name: 'right', storageName: storage('right'), defaultValue: '"' });
const multiLevel = useQueryParamOrStorage({ name: 'multi', storageName: storage('multi'), defaultValue: true });
const trimItems = useQueryParamOrStorage({ name: 'trim', storageName: storage('trim'), defaultValue: true });
const deleteEmptyItems = useQueryParamOrStorage({ name: 'skip', storageName: storage('skip'), defaultValue: true });

const example = ['"apple"', '""banana""', '"cherry"'].join('\n');

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      unwrapList(
        splitOperatorType.value,
        value,
        splitSeparator.value,
        joinSeparator.value,
        deleteEmptyItems.value,
        multiLevel.value,
        trimItems.value,
        left.value,
        right.value,
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
          v-model:value="left"
          :label="t('tools.list-unwrap.texts.label-left')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="right"
          :label="t('tools.list-unwrap.texts.label-right')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="joinSeparator"
          :label="t('tools.list-unwrap.texts.label-join-separator')"
          label-position="left"
          raw-text
        />
      </n-space>
      <n-space>
        <n-form-item
          :label="t('tools.list-unwrap.texts.label-multi-level')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="multiLevel" />
        </n-form-item>
        <n-form-item :label="t('tools.list-unwrap.texts.label-trim')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="trimItems" />
        </n-form-item>
        <n-form-item
          :label="t('tools.list-unwrap.texts.label-skip-empty')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="deleteEmptyItems" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-unwrap.texts.placeholder-input')"
      :input-default="example"
    />
  </div>
</template>
