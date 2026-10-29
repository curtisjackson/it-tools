<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, chunkList } from './list-chunk.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const storage = (name: string) => `list-chunk:${name}`;
const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: storage('split'),
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: storage('sep'), defaultValue: ',' });
const chunkSize = useQueryParamOrStorage({ name: 'size', storageName: storage('size'), defaultValue: 2 });
const itemSeparator = useQueryParamOrStorage({ name: 'itemsep', storageName: storage('itemsep'), defaultValue: ',' });
const leftWrap = useQueryParamOrStorage({ name: 'left', storageName: storage('left'), defaultValue: '[' });
const rightWrap = useQueryParamOrStorage({ name: 'right', storageName: storage('right'), defaultValue: ']' });
const chunkSeparator = useQueryParamOrStorage({
  name: 'chunksep',
  storageName: storage('chunksep'),
  defaultValue: '\\n',
});
const deleteEmptyItems = useQueryParamOrStorage({ name: 'skip', storageName: storage('skip'), defaultValue: true });
const padLastChunk = useQueryParamOrStorage({ name: 'pad', storageName: storage('pad'), defaultValue: false });
const paddingItem = useQueryParamOrStorage({ name: 'padwith', storageName: storage('padwith'), defaultValue: '-' });

function transformer(value: string) {
  return withDefaultOnError(
    () =>
      chunkList(
        splitOperatorType.value,
        splitSeparator.value,
        value,
        chunkSize.value ?? 1,
        itemSeparator.value,
        leftWrap.value,
        rightWrap.value,
        chunkSeparator.value,
        deleteEmptyItems.value,
        padLastChunk.value,
        paddingItem.value,
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
        <n-form-item :label="t('tools.list-chunk.texts.label-size')" label-placement="left" :show-feedback="false">
          <n-input-number-i18n v-model:value="chunkSize" :min="1" />
        </n-form-item>
        <c-input-text
          v-model:value="itemSeparator"
          :label="t('tools.list-chunk.texts.label-item-separator')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="chunkSeparator"
          :label="t('tools.list-chunk.texts.label-chunk-separator')"
          label-position="left"
          raw-text
        />
      </n-space>
      <n-space align="center" mb-2>
        <c-input-text
          v-model:value="leftWrap"
          :label="t('tools.list-chunk.texts.label-left-wrap')"
          label-position="left"
          raw-text
        />
        <c-input-text
          v-model:value="rightWrap"
          :label="t('tools.list-chunk.texts.label-right-wrap')"
          label-position="left"
          raw-text
        />
      </n-space>
      <n-space align="center">
        <n-form-item
          :label="t('tools.list-chunk.texts.label-skip-empty')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="deleteEmptyItems" />
        </n-form-item>
        <n-form-item :label="t('tools.list-chunk.texts.label-pad')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="padLastChunk" />
        </n-form-item>
        <c-input-text
          v-if="padLastChunk"
          v-model:value="paddingItem"
          :label="t('tools.list-chunk.texts.label-pad-with')"
          label-position="left"
          raw-text
        />
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-chunk.texts.placeholder-input')"
      input-default="a,b,c,d,e,f,g"
    />
  </div>
</template>
