<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { buildEpub, itemsToParagraphs } from './pdf-to-epub.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';
import { loadPdf } from '@/utils/pdfjs';

const { t, locale } = useI18n();

const language = useQueryParamOrStorage({ name: 'lang', storageName: 'pdf-to-epub:lang', defaultValue: '' });
const title = ref('');

async function convert([file]: File[], { onProgress }: FileTaskContext) {
  const pdf = await loadPdf(await file.arrayBuffer());
  const { info } = (await pdf.getMetadata().catch(() => ({ info: {} }))) as { info: Record<string, string> };
  const pages: string[][] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const content = await (await pdf.getPage(number)).getTextContent();
    pages.push(itemsToParagraphs(content.items.filter((item) => 'str' in item) as { str: string; hasEOL?: boolean }[]));
    onProgress(number / pdf.numPages);
  }
  await pdf.destroy();
  if (pages.every((paragraphs) => paragraphs.length === 0)) {
    throw new Error(t('tools.pdf-to-epub.texts.no-text'));
  }
  const epub = buildEpub(pages, {
    title: title.value || info.Title || file.name.replace(/\.pdf$/i, ''),
    author: info.Author || '',
    language: language.value || locale.value,
  });
  return new File([epub as BlobPart], outputFileName(file.name, '', 'epub'), { type: 'application/epub+zip' });
}
</script>

<template>
  <file-tool-layout
    accept=".pdf,application/pdf"
    :title="t('tools.pdf-to-epub.texts.drop')"
    :task="convert"
    :button-text="t('tools.pdf-to-epub.texts.button')"
  >
    <c-input-text
      v-model:value="title"
      :label="t('tools.pdf-to-epub.texts.label-title')"
      label-position="left"
      label-width="120px"
      :placeholder="t('tools.pdf-to-epub.texts.placeholder-title')"
      mb-2
    />
    <c-input-text
      v-model:value="language"
      :label="t('tools.pdf-to-epub.texts.label-language')"
      label-position="left"
      label-width="120px"
      :placeholder="locale"
      raw-text
      mb-2
    />
    <n-text depth="3" text-sm>{{ t('tools.pdf-to-epub.texts.hint') }}</n-text>
  </file-tool-layout>
</template>
