<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { extractEmails } from './email-extractor.service';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const unique = useQueryParamOrStorage({ name: 'unique', storageName: 'email-extractor:unique', defaultValue: true });

function transformer(value: string) {
  return extractEmails(value, unique.value);
}
</script>

<template>
  <div>
    <c-card mb-2>
      <n-form-item :label="t('tools.email-extractor.texts.label-unique')" label-placement="left" :show-feedback="false">
        <n-switch v-model:value="unique" />
      </n-form-item>
    </c-card>

    <format-transformer
      :transformer="transformer"
      :input-placeholder="t('tools.email-extractor.texts.placeholder-input')"
      input-default="Contact support@example.com or sales@example.org. Пишите на почта@пример.рф, support@example.com"
    />
  </div>
</template>
