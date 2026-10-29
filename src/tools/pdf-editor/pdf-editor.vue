<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type EmbedPdfContainer, PDFViewer, type PDFViewerConfig, type PluginRegistry } from '@embedpdf/vue-pdf-viewer';
import pdfiumWasm from '@embedpdf/pdfium/pdfium.wasm?url';
import { embedpdfRussian } from './embedpdf-translations';
import { embedpdfLocale, embedpdfTheme } from './pdf-editor.service';
import { useStyleStore } from '@/stores/style.store';

const { t, locale } = useI18n();
const styleStore = useStyleStore();

const file = ref<File>();
/** Counts the opened documents: each one gets a new viewer. */
const opened = ref(0);
let container: EmbedPdfContainer | undefined;
let i18n: { setLocale: (code: string) => void } | undefined;

function themeConfig() {
  return { preference: styleStore.isDarkTheme ? 'dark' : 'light', ...embedpdfTheme } as const;
}

// Set once per document: a new config restarts the viewer and loses the edits. The theme and the
// language change through the viewer's own API.
const config = shallowRef<PDFViewerConfig>({});

// Everything the viewer would fetch from jsDelivr or Google Fonts comes from the app or is left out.
const viewerConfig = (selected: File, buffer: ArrayBuffer): PDFViewerConfig => ({
  // Loaded with its name, which the downloaded PDF keeps.
  documentManager: { initialDocuments: [{ buffer, name: selected.name }] },
  // The viewer's worker resolves the URL against its own blob: address: it must be absolute.
  wasmUrl: new URL(pdfiumWasm, location.href).href,
  // No fallback fonts (tens of MB for CJK): fonts that are not in the PDF use PDFium's own.
  fontFallback: null,
  fonts: { ui: { family: 'inherit', stylesheetUrl: null }, signature: null },
  stamp: { manifests: [] },
  theme: themeConfig(),
});

async function open(selected: File) {
  close();
  config.value = viewerConfig(selected, await selected.arrayBuffer());
  opened.value += 1;
  file.value = selected;
}

function close() {
  file.value = undefined;
  container = undefined;
  i18n = undefined;
}

function onInit(element: EmbedPdfContainer) {
  container = element;
}

function onReady(registry: PluginRegistry) {
  const plugin = registry.getPlugin('i18n') as { provides: () => any } | null;
  const capability = plugin?.provides();
  if (!capability) {
    return;
  }
  capability.registerLocale({ code: 'ru', name: 'Русский', translations: embedpdfRussian });
  i18n = capability;
  capability.setLocale(embedpdfLocale(locale.value));
}

watch(
  () => styleStore.isDarkTheme,
  () => container?.setTheme(themeConfig()),
);
watch(locale, (value) => i18n?.setLocale(embedpdfLocale(value)));
onBeforeUnmount(close);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div v-if="!file" mx-auto max-w-600px>
      <c-file-upload :title="t('tools.pdf-editor.texts.drop')" accept=".pdf,application/pdf" @file-upload="open" />
      <n-text depth="3" mt-2 block text-sm>
        {{ t('tools.pdf-editor.texts.hint') }}
      </n-text>
    </div>
    <template v-else>
      <div mb-2 flex items-center justify-between gap-2>
        <n-text depth="3" truncate>
          {{ t('tools.pdf-editor.texts.hint') }}
        </n-text>
        <c-button data-test-id="close" @click="close">
          {{ t('tools.pdf-editor.texts.close') }}
        </c-button>
      </div>
      <PDFViewer :key="opened" :config="config" class="viewer" data-test-id="viewer" @init="onInit" @ready="onReady" />
    </template>
  </div>
</template>

<style scoped>
.viewer {
  display: block;
  height: 80vh;
  min-height: 520px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
