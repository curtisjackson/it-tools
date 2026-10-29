<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { compute, discordFormats, previewDiscordTimestamp } from './discord-timestamp.service';
import { useCopy } from '@/composable/copy';

const { t, locale } = useI18n();
const { copy } = useCopy();

const timestamp = ref(Date.now());
const now = useNow({ interval: 1000 });

const rows = computed(() =>
  discordFormats.map((format) => ({
    format,
    description: t(`tools.discord-timestamp.texts.format-${format}`),
    markup: compute(new Date(timestamp.value), format),
    preview: previewDiscordTimestamp(new Date(timestamp.value), format, locale.value, now.value),
  })),
);
</script>

<template>
  <div>
    <c-card mb-2>
      <n-space align="center">
        <n-form-item
          :label="t('tools.discord-timestamp.texts.label-date')"
          label-placement="left"
          :show-feedback="false"
        >
          <n-date-picker v-model:value="timestamp" type="datetime" />
        </n-form-item>
        <c-button @click="timestamp = Date.now()">{{ t('tools.discord-timestamp.texts.button-now') }}</c-button>
      </n-space>
      <n-text depth="3" text-sm>{{ t('tools.discord-timestamp.texts.hint') }}</n-text>
    </c-card>

    <c-card>
      <n-table size="small" :bordered="false">
        <thead>
          <tr>
            <th>{{ t('tools.discord-timestamp.texts.header-format') }}</th>
            <th>{{ t('tools.discord-timestamp.texts.header-preview') }}</th>
            <th>{{ t('tools.discord-timestamp.texts.header-code') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.format" data-test-id="timestamp-row">
            <td>{{ row.description }}</td>
            <td>{{ row.preview }}</td>
            <td>
              <div flex items-center gap-2>
                <code>{{ row.markup }}</code>
                <c-button size="small" @click="copy(row.markup)">{{
                  t('tools.discord-timestamp.texts.button-copy')
                }}</c-button>
              </div>
            </td>
          </tr>
        </tbody>
      </n-table>
    </c-card>
  </div>
</template>
