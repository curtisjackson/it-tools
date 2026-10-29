<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type SplitOperatorType, shuffleList } from './list-shuffle.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { withDefaultOnError } from '@/utils/defaults';

const { t } = useI18n();

const splitOperatorType = useQueryParamOrStorage<SplitOperatorType>({
  name: 'split',
  storageName: 'list-shuffle:split',
  defaultValue: 'symbol',
});
const splitSeparator = useQueryParamOrStorage({ name: 'sep', storageName: 'list-shuffle:sep', defaultValue: '\\n' });
const joinSeparator = useQueryParamOrStorage({ name: 'join', storageName: 'list-shuffle:join', defaultValue: '\\n' });
const limit = useQueryParamOrStorage({ name: 'limit', storageName: 'list-shuffle:limit', defaultValue: false });
const length = useQueryParamOrStorage({ name: 'len', storageName: 'list-shuffle:len', defaultValue: 3 });

// Read by the transformer so that "Shuffle again" recomputes the output.
const seed = ref(0);

function transformer(value: string) {
  void seed.value;
  return withDefaultOnError(
    () =>
      shuffleList(
        splitOperatorType.value,
        value,
        splitSeparator.value,
        joinSeparator.value,
        limit.value ? (length.value ?? 1) : undefined,
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
          :label="t('tools.list-shuffle.texts.label-join-separator')"
          label-position="left"
          raw-text
        />
        <n-form-item :label="t('tools.list-shuffle.texts.label-limit')" label-placement="left" :show-feedback="false">
          <n-switch v-model:value="limit" />
        </n-form-item>
        <n-input-number-i18n v-if="limit" v-model:value="length" :min="1" />
        <c-button @click="seed++">{{ t('tools.list-shuffle.texts.button-again') }}</c-button>
      </n-space>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.list-shuffle.texts.placeholder-input')"
      :input-default="'one\ntwo\nthree\nfour\nfive'"
    />
  </div>
</template>
