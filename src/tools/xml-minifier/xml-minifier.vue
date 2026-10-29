<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { minifyXml } from './xml-minifier.service';
import type { UseValidationRule } from '@/composable/validation';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const preserveComments = useQueryParamOrStorage({
  name: 'comments',
  storageName: 'xml-minifier:comments',
  defaultValue: false,
});
const selfCloseEmpty = useQueryParamOrStorage({
  name: 'selfclose',
  storageName: 'xml-minifier:selfclose',
  defaultValue: false,
});

const minify = (value: string) =>
  minifyXml(value, { preserveComments: preserveComments.value, selfCloseEmpty: selfCloseEmpty.value });

function transformer(value: string) {
  try {
    return minify(value);
  } catch {
    return '';
  }
}

const rules: UseValidationRule<string>[] = [
  {
    validator: (value) => {
      minify(value);
      return true;
    },
    getErrorMessage: (value) => {
      try {
        minify(value);
        return '';
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    message: t('tools.xml-minifier.texts.message-invalid', ['{0}']),
  },
];

const defaultValue = `<?xml version="1.0" encoding="UTF-8"?>
<!-- A sample document -->
<catalog>
  <book id="1">
    <title>The Hobbit</title>
    <author>J. R. R. Tolkien</author>
  </book>
  <book id="2">
    <title>Dune</title>
    <author>Frank Herbert</author>
  </book>
</catalog>`;
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space>
        <n-form-item
          :label="t('tools.xml-minifier.texts.label-preserve-comments')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="preserveComments" />
        </n-form-item>
        <n-form-item
          :label="t('tools.xml-minifier.texts.label-self-close')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-switch v-model:value="selfCloseEmpty" />
        </n-form-item>
      </n-space>
    </c-card>

    <format-transformer
      :input-label="t('tools.xml-minifier.texts.input-label')"
      :output-label="t('tools.xml-minifier.texts.output-label')"
      output-language="xml"
      :input-default="defaultValue"
      :input-validation-rules="rules"
      :transformer="transformer"
      download-file-name="output.min.xml"
    />
  </div>
</template>
