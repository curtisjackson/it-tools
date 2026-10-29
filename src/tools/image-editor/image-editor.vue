<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { filerobotTheme } from './filerobot-theme';
import { filerobotRussian } from './filerobot-translations';
import { downloadBlob } from '@/utils/file-output';
import { useStyleStore } from '@/stores/style.store';

// Ported from Omni-Tools (src/pages/tools/image/generic/editor), MIT: the same editor,
// react-filerobot-image-editor, mounted with React in a Vue component.

const { t, locale } = useI18n();
const styleStore = useStyleStore();

const host = ref<HTMLElement>();
const file = ref<File>();
const loading = ref(false);
let source = '';
let root: { render: (element: unknown) => void; unmount: () => void } | undefined;
let render: (() => void) | undefined;

interface SavedImage {
  imageBase64?: string;
  fullName?: string;
  mimeType?: string;
}

async function save(saved: SavedImage) {
  if (!saved.imageBase64) {
    return;
  }
  const blob = await (await fetch(saved.imageBase64)).blob();
  downloadBlob(blob, saved.fullName ?? 'edited.png');
}

function close() {
  root?.unmount();
  root = undefined;
  render = undefined;
  URL.revokeObjectURL(source);
  file.value = undefined;
}

async function open(selected: File) {
  close();
  file.value = selected;
  source = URL.createObjectURL(selected);
  loading.value = true;
  const [{ default: FilerobotImageEditor, TABS }, { createElement }, { createRoot }] = await Promise.all([
    import('react-filerobot-image-editor'),
    import('react'),
    import('react-dom/client'),
  ]);
  loading.value = false;
  await nextTick();
  if (!host.value || file.value !== selected) {
    return;
  }
  const mounted = createRoot(host.value);
  root = mounted;
  render = () =>
    mounted.render(
      createElement(FilerobotImageEditor, {
        source,
        onSave: save,
        defaultSavedImageName: `${selected.name.replace(/\.[^/.]+$/, '')}-edited`,
        defaultTabId: TABS.ADJUST,
        // The size of the original image, not of the screen.
        savingPixelRatio: 1,
        Rotate: { angle: 90, componentType: 'slider' },
        Text: { text: t('tools.image-editor.texts.default-text') },
        theme: filerobotTheme(styleStore.isDarkTheme),
        // No requests to the Scaleflex translation servers.
        useBackendTranslations: false,
        language: 'en',
        translations: locale.value.startsWith('ru') ? filerobotRussian : undefined,
        avoidChangesNotSavedAlertOnLeave: true,
      }),
    );
  render();
}

watch([() => styleStore.isDarkTheme, locale], () => render?.());
onBeforeUnmount(close);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div v-if="!file" mx-auto max-w-600px>
      <c-file-upload :title="t('tools.image-editor.texts.drop')" accept="image/*" @file-upload="open" />
      <n-text depth="3" mt-2 block text-sm>
        {{ t('tools.image-editor.texts.hint') }}
      </n-text>
    </div>
    <template v-else>
      <div mb-2 flex items-center justify-between gap-2>
        <n-text depth="3" truncate>
          {{ file.name }}
        </n-text>
        <c-button data-test-id="close" @click="close">
          {{ t('tools.image-editor.texts.close') }}
        </c-button>
      </div>
      <n-spin :show="loading" :description="t('tools.image-editor.texts.loading')">
        <div ref="host" class="editor" data-test-id="editor" />
      </n-spin>
    </template>
  </div>
</template>

<style scoped>
.editor {
  height: 75vh;
  min-height: 480px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
