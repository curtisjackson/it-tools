<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { IconChevronDown, IconChevronUp, IconCircleMinus } from '@tabler/icons-vue';
import { formatBytes } from '@/utils/convert';

const props = withDefaults(
  defineProps<{
    files: File[];
    accept?: string;
    title?: string;
    disabled?: boolean;
  }>(),
  { accept: undefined, title: undefined, disabled: false },
);
const emit = defineEmits<{ (event: 'update:files', files: File[]): void }>();

const { t } = useI18n();

const files = useVModel(props, 'files', emit);

function add(uploaded: File[]) {
  files.value = [...files.value, ...uploaded];
}
function remove(index: number) {
  files.value = files.value.filter((_, i) => i !== index);
}
function move(index: number, offset: -1 | 1) {
  const reordered = [...files.value];
  [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
  files.value = reordered;
}
</script>

<template>
  <div mx-auto max-w-600px>
    <c-file-upload :title="title ?? t('shared.media.drop-files')" :accept="accept" multiple mb-2 @files-upload="add" />
    <c-card v-if="files.length > 0" :title="t('shared.media.files-order')">
      <div
        v-for="(file, index) in files"
        :key="`${index}-${file.name}`"
        mb-1
        flex
        items-center
        gap-1
        data-test-id="file-item"
      >
        <span flex-1 truncate>{{ index + 1 }}. {{ file.name }}</span>
        <span text-sm op-70>{{ formatBytes(file.size) }}</span>
        <n-button :disabled="disabled" :aria-label="t('shared.media.remove')" @click="remove(index)">
          <n-icon size="25" :component="IconCircleMinus" />
        </n-button>
        <n-button :disabled="disabled || index === 0" :aria-label="t('shared.media.move-up')" @click="move(index, -1)">
          <n-icon size="25" :component="IconChevronUp" />
        </n-button>
        <n-button
          :disabled="disabled || index === files.length - 1"
          :aria-label="t('shared.media.move-down')"
          @click="move(index, 1)"
        >
          <n-icon size="25" :component="IconChevronDown" />
        </n-button>
      </div>
    </c-card>
  </div>
</template>
