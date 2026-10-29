<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import {
  type HiddenCategory,
  analyzeHiddenCharacters,
  markHiddenCharacters,
  removeHiddenCharacters,
} from './hidden-characters-detector.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const input = ref('Pass​word with a non-breaking space and ‮evil.exe');
const highlightRTL = useQueryParamOrStorage({
  name: 'bidi',
  storageName: 'hidden-characters-detector:bidi',
  defaultValue: true,
});
const showInvisibleChars = useQueryParamOrStorage({
  name: 'invisible',
  storageName: 'hidden-characters-detector:invisible',
  defaultValue: true,
});
const includeZeroWidthChars = useQueryParamOrStorage({
  name: 'zw',
  storageName: 'hidden-characters-detector:zw',
  defaultValue: true,
});

const result = computed(() =>
  analyzeHiddenCharacters(input.value, {
    highlightRTL: highlightRTL.value,
    showInvisibleChars: showInvisibleChars.value,
    includeZeroWidthChars: includeZeroWidthChars.value,
  }),
);

const categoryKeys: Record<HiddenCategory, string> = {
  'RTL Override': 'category-bidi',
  'Invisible Character': 'category-invisible',
  'Control Character': 'category-control',
};

const headers = computed(() => [
  { key: 'position', label: t('tools.hidden-characters-detector.texts.header-position') },
  { key: 'unicode', label: t('tools.hidden-characters-detector.texts.header-code') },
  { key: 'name', label: t('tools.hidden-characters-detector.texts.header-name') },
  { key: 'category', label: t('tools.hidden-characters-detector.texts.header-category') },
]);
const rows = computed(() =>
  result.value.hiddenCharacters.map((c) => ({
    position: c.position + 1,
    unicode: c.unicode,
    name: c.name,
    category: t(`tools.hidden-characters-detector.texts.${categoryKeys[c.category]}`),
  })),
);
</script>

<template>
  <div>
    <c-card mb-2>
      <c-input-text
        v-model:value="input"
        :label="t('tools.hidden-characters-detector.texts.label-input')"
        :placeholder="t('tools.hidden-characters-detector.texts.placeholder-input')"
        multiline
        rows="5"
        raw-text
        monospace
        mb-2
      />
      <n-space>
        <n-form-item
          :label="t('tools.hidden-characters-detector.texts.label-bidi')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="highlightRTL" />
        </n-form-item>
        <n-form-item
          :label="t('tools.hidden-characters-detector.texts.label-invisible')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="showInvisibleChars" />
        </n-form-item>
        <n-form-item
          :label="t('tools.hidden-characters-detector.texts.label-zero-width')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="includeZeroWidthChars" />
        </n-form-item>
      </n-space>
    </c-card>

    <n-alert v-if="input && result.totalHiddenChars === 0" type="success" mb-2>
      {{ t('tools.hidden-characters-detector.texts.none-found') }}
    </n-alert>
    <template v-else-if="result.totalHiddenChars > 0">
      <n-alert :type="result.hasRTLOverride ? 'warning' : 'info'" mb-2 data-test-id="summary">
        {{ t('tools.hidden-characters-detector.texts.found', [result.totalHiddenChars]) }}
        <template v-if="result.hasRTLOverride">{{ t('tools.hidden-characters-detector.texts.warning-bidi') }}</template>
      </n-alert>

      <c-card :title="t('tools.hidden-characters-detector.texts.title-marked')" mb-2>
        <textarea-copyable :value="markHiddenCharacters(result)" word-wrap />
      </c-card>
      <c-card :title="t('tools.hidden-characters-detector.texts.title-characters')" mb-2>
        <c-table :data="rows" :headers="headers" />
      </c-card>
      <c-card :title="t('tools.hidden-characters-detector.texts.title-cleaned')">
        <textarea-copyable :value="removeHiddenCharacters(result)" word-wrap />
      </c-card>
    </template>
  </div>
</template>
