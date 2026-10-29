<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Base64 } from 'js-base64';
import {
  type FieldType,
  type FormField,
  type PageSize,
  FieldNameError,
  addFormFields,
  clampField,
  dropdownOptions,
  duplicateNames,
  newField,
} from './pdf-form-builder.service';
import { outputFileName } from '@/composable/media/video-encode';
import { downloadBlob } from '@/utils/file-output';
import { canvasToBlob, loadPdf } from '@/utils/pdfjs';

const { t } = useI18n();

type Tool = 'select' | FieldType;

interface RenderedPage extends PageSize {
  image: string;
  rotated: boolean;
}

const file = ref<File>();
let bytes: ArrayBuffer | undefined;
const pages = ref<RenderedPage[]>([]);
const loading = ref(false);
const fields = ref<FormField[]>([]);
const selectedId = ref<string>();
const tool = ref<Tool>('select');
const error = ref('');
const busy = ref(false);

const toolOptions = computed(() =>
  (['select', 'text', 'multiline', 'checkbox', 'radio', 'dropdown', 'label'] as Tool[]).map((value) => ({
    label: t(`tools.pdf-form-builder.texts.tool-${value}`),
    value,
  })),
);

const selected = computed(() => fields.value.find((field) => field.id === selectedId.value));
const rotatedPages = computed(() => pages.value.flatMap((page, index) => (page.rotated ? [index + 1] : [])));

function releasePages() {
  for (const page of pages.value) {
    URL.revokeObjectURL(page.image);
  }
  pages.value = [];
}

async function open(selectedFile: File) {
  close();
  file.value = selectedFile;
  loading.value = true;
  try {
    bytes = await selectedFile.arrayBuffer();
    // pdf.js may detach the buffer it gets: give it a copy.
    const pdf = await loadPdf(bytes.slice(0));
    const rendered: RenderedPage[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      // Shown as stored, without its /Rotate: the coordinates of the fields are those of the page.
      const size = page.getViewport({ scale: 1, rotation: 0 });
      const viewport = page.getViewport({ scale: Math.min(2, 1600 / size.width), rotation: 0 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      rendered.push({
        width: size.width,
        height: size.height,
        image: URL.createObjectURL(await canvasToBlob(canvas, 'image/png')),
        rotated: page.rotate % 360 !== 0,
      });
    }
    await pdf.destroy();
    pages.value = rendered;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    loading.value = false;
  }
}

function close() {
  releasePages();
  file.value = undefined;
  bytes = undefined;
  fields.value = [];
  selectedId.value = undefined;
  error.value = '';
}

/** A point of the page, in PDF points, from a pointer event on its element. */
function pagePoint(event: PointerEvent, element: HTMLElement, page: PageSize) {
  const rect = element.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * page.width,
    y: ((event.clientY - rect.top) / rect.height) * page.height,
  };
}

function onPagePointerDown(event: PointerEvent, index: number) {
  if (tool.value === 'select') {
    selectedId.value = undefined;
    return;
  }
  const page = pages.value[index];
  const field = newField(
    tool.value,
    index,
    page,
    pagePoint(event, event.currentTarget as HTMLElement, page),
    fields.value,
  );
  if (field.type === 'radio') {
    // Radio buttons placed one after another join the group of the last one.
    const last = [...fields.value].reverse().find((other) => other.type === 'radio');
    if (last) {
      const values = new Set(fields.value.filter((other) => other.name === last.name).map((other) => other.value));
      let option = values.size + 1;
      while (values.has(`option${option}`)) {
        option++;
      }
      Object.assign(field, { name: last.name, value: `option${option}` });
    }
  }
  fields.value.push(field);
  selectedId.value = field.id;
}

function updateField(id: string, changes: Partial<FormField>) {
  const index = fields.value.findIndex((field) => field.id === id);
  if (index < 0) {
    return;
  }
  const field = fields.value[index];
  fields.value[index] = clampField({ ...field, ...changes }, pages.value[field.page]);
}

function update(changes: Partial<FormField>) {
  if (selected.value) {
    updateField(selected.value.id, changes);
  }
}

function setRadioChecked(checked: boolean) {
  const field = selected.value;
  if (!field) {
    return;
  }
  if (checked) {
    for (const other of fields.value) {
      if (other.type === 'radio' && other.name === field.name && other.id !== field.id) {
        other.checked = false;
      }
    }
  }
  update({ checked });
}

function removeSelected() {
  fields.value = fields.value.filter((field) => field.id !== selectedId.value);
  selectedId.value = undefined;
}

function duplicateSelected() {
  const field = selected.value;
  if (!field) {
    return;
  }
  const copy = newField(field.type, field.page, pages.value[field.page], { x: 0, y: 0 }, fields.value);
  const values = new Set(fields.value.filter((other) => other.name === field.name).map((other) => other.value));
  let option = values.size + 1;
  while (values.has(`option${option}`)) {
    option++;
  }
  const duplicate = clampField(
    {
      ...field,
      id: copy.id,
      name: field.type === 'radio' ? field.name : copy.name,
      value: field.type === 'radio' ? `option${option}` : field.value,
      checked: false,
      y: field.y + field.height + 6,
    },
    pages.value[field.page],
  );
  fields.value.push(duplicate);
  selectedId.value = duplicate.id;
}

// Moving and resizing with the pointer.
let gesture:
  | { id: string; mode: 'move' | 'resize'; startX: number; startY: number; origin: FormField; scale: number }
  | undefined;

function startGesture(event: PointerEvent, field: FormField, mode: 'move' | 'resize') {
  if (tool.value !== 'select') {
    tool.value = 'select';
  }
  selectedId.value = field.id;
  const pageElement = (event.currentTarget as HTMLElement).closest('.page') as HTMLElement;
  const scale = pages.value[field.page].width / pageElement.getBoundingClientRect().width;
  gesture = { id: field.id, mode, startX: event.clientX, startY: event.clientY, origin: { ...field }, scale };
  window.addEventListener('pointermove', onGestureMove);
  window.addEventListener('pointerup', endGesture, { once: true });
}

function onGestureMove(event: PointerEvent) {
  if (!gesture) {
    return;
  }
  const dx = (event.clientX - gesture.startX) * gesture.scale;
  const dy = (event.clientY - gesture.startY) * gesture.scale;
  const { origin } = gesture;
  updateField(
    gesture.id,
    gesture.mode === 'move'
      ? { x: origin.x + dx, y: origin.y + dy }
      : { width: origin.width + dx, height: origin.height + dy },
  );
}

function endGesture() {
  gesture = undefined;
  window.removeEventListener('pointermove', onGestureMove);
}

function onKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('input, textarea, [contenteditable]')) {
    return;
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && selected.value) {
    event.preventDefault();
    removeSelected();
  } else if (event.key === 'Escape') {
    tool.value = 'select';
    selectedId.value = undefined;
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  endGesture();
  releasePages();
});

const duplicates = computed(() => duplicateNames(fields.value));

async function download() {
  if (!bytes || !file.value) {
    return;
  }
  error.value = '';
  busy.value = true;
  try {
    const output = await addFormFields(bytes, fields.value, async () => {
      const { normal } = await import('roboto-base64');
      return Base64.toUint8Array(normal);
    });
    downloadBlob(
      new Blob([output as BlobPart], { type: 'application/pdf' }),
      outputFileName(file.value.name, '_form', 'pdf'),
    );
  } catch (cause) {
    error.value =
      cause instanceof FieldNameError
        ? t(`tools.pdf-form-builder.texts.error-${cause.kind}`, [cause.names.join(', ')])
        : (cause as Error).message;
  } finally {
    busy.value = false;
  }
}

function fieldStyle(field: FormField) {
  const page = pages.value[field.page];
  return {
    left: `${(field.x / page.width) * 100}%`,
    top: `${(field.y / page.height) * 100}%`,
    width: `${(field.width / page.width) * 100}%`,
    height: `${(field.height / page.height) * 100}%`,
    // Points of the page in the units of its element (a size container).
    '--pt': `${100 / page.width}cqw`,
  };
}

function preview(field: FormField): string {
  switch (field.type) {
    case 'checkbox':
      return field.value === 'true' ? '✓' : '';
    case 'radio':
      return field.checked ? '●' : '';
    case 'dropdown':
      return `${field.value || dropdownOptions(field)[0] || ''} ▾`;
    case 'label':
      return field.value || field.name;
    default:
      return field.value || field.name;
  }
}

function numberInput(value: number | null) {
  return Number.isFinite(value) ? (value as number) : 0;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div v-if="!file" mx-auto max-w-600px>
      <c-file-upload
        :title="t('tools.pdf-form-builder.texts.drop')"
        accept=".pdf,application/pdf"
        @file-upload="open"
      />
      <c-alert v-if="error" type="error" mt-3>
        {{ error }}
      </c-alert>
    </div>

    <div v-else class="builder">
      <div class="side">
        <c-card mb-3>
          <n-text depth="3" mb-2 block text-sm>
            {{ t('tools.pdf-form-builder.texts.label-tool') }}
          </n-text>
          <div class="tools">
            <c-button
              v-for="option in toolOptions"
              :key="option.value"
              :type="tool === option.value ? 'primary' : 'default'"
              size="small"
              :data-test-id="`tool-${option.value}`"
              @click="tool = option.value"
            >
              {{ option.label }}
            </c-button>
          </div>
          <n-text depth="3" mt-2 block text-xs>
            {{
              tool === 'select'
                ? t('tools.pdf-form-builder.texts.hint-select')
                : t('tools.pdf-form-builder.texts.hint-place')
            }}
          </n-text>
        </c-card>

        <c-card v-if="selected" :title="t('tools.pdf-form-builder.texts.properties')" mb-3 data-test-id="properties">
          <c-input-text
            :value="selected.name"
            :label="
              selected.type === 'radio'
                ? t('tools.pdf-form-builder.texts.label-group')
                : t('tools.pdf-form-builder.texts.label-name')
            "
            raw-text
            mb-2
            data-test-id="field-name"
            @update:value="(name: string) => update({ name })"
          />
          <n-text v-if="selected.type === 'radio'" depth="3" mb-2 block text-xs>
            {{ t('tools.pdf-form-builder.texts.hint-radio') }}
          </n-text>

          <c-input-text
            v-if="selected.type === 'text' || selected.type === 'multiline' || selected.type === 'label'"
            :value="selected.value"
            :label="
              selected.type === 'label'
                ? t('tools.pdf-form-builder.texts.label-text')
                : t('tools.pdf-form-builder.texts.label-value')
            "
            :multiline="selected.type !== 'text'"
            :rows="3"
            raw-text
            mb-2
            data-test-id="field-value"
            @update:value="(value: string) => update({ value })"
          />
          <c-input-text
            v-if="selected.type === 'radio'"
            :value="selected.value"
            :label="t('tools.pdf-form-builder.texts.label-option-value')"
            raw-text
            mb-2
            data-test-id="field-value"
            @update:value="(value: string) => update({ value })"
          />
          <template v-if="selected.type === 'dropdown'">
            <c-input-text
              :value="selected.options"
              :label="t('tools.pdf-form-builder.texts.label-options')"
              multiline
              :rows="4"
              raw-text
              mb-2
              data-test-id="field-options"
              @update:value="(options: string) => update({ options })"
            />
            <c-select
              :value="selected.value"
              :options="['', ...dropdownOptions(selected)].map((option) => ({ label: option || '—', value: option }))"
              :label="t('tools.pdf-form-builder.texts.label-value')"
              mb-2
              @update:value="(value: string) => update({ value })"
            />
          </template>

          <n-form-item
            v-if="selected.type === 'checkbox'"
            :label="t('tools.pdf-form-builder.texts.label-checked')"
            label-placement="left"
            :show-feedback="false"
            mb-2
          >
            <n-switch
              :value="selected.value === 'true'"
              @update:value="(on: boolean) => update({ value: on ? 'true' : '' })"
            />
          </n-form-item>
          <n-form-item
            v-if="selected.type === 'radio'"
            :label="t('tools.pdf-form-builder.texts.label-selected')"
            label-placement="left"
            :show-feedback="false"
            mb-2
          >
            <n-switch :value="selected.checked" @update:value="setRadioChecked" />
          </n-form-item>

          <n-form-item
            v-if="selected.type !== 'checkbox' && selected.type !== 'radio'"
            :label="t('tools.pdf-form-builder.texts.label-font-size')"
            label-placement="left"
            :show-feedback="false"
            mb-2
          >
            <n-input-number
              :value="selected.fontSize"
              :min="selected.type === 'label' ? 4 : 0"
              :max="96"
              size="small"
              :placeholder="t('tools.pdf-form-builder.texts.hint-font-size')"
              @update:value="(fontSize: number | null) => update({ fontSize: numberInput(fontSize) })"
            />
          </n-form-item>
          <n-form-item
            v-if="selected.type !== 'label'"
            :label="t('tools.pdf-form-builder.texts.label-required')"
            label-placement="left"
            :show-feedback="false"
            mb-2
          >
            <n-switch :value="selected.required" @update:value="(required: boolean) => update({ required })" />
          </n-form-item>

          <n-text depth="3" mb-1 block text-xs>
            {{ t('tools.pdf-form-builder.texts.label-position') }}
          </n-text>
          <div class="position" mb-3>
            <n-input-number
              v-for="key in ['x', 'y', 'width', 'height'] as const"
              :key="key"
              :value="Math.round(selected[key] * 10) / 10"
              size="small"
              :show-button="false"
              @update:value="(value: number | null) => update({ [key]: numberInput(value) })"
            >
              <template #prefix>
                {{ { x: 'X', y: 'Y', width: 'W', height: 'H' }[key] }}
              </template>
            </n-input-number>
          </div>

          <div flex gap-2>
            <c-button size="small" data-test-id="duplicate" @click="duplicateSelected">
              {{ t('tools.pdf-form-builder.texts.duplicate') }}
            </c-button>
            <c-button size="small" type="error" data-test-id="delete" @click="removeSelected">
              {{ t('tools.pdf-form-builder.texts.delete') }}
            </c-button>
          </div>
        </c-card>

        <c-card>
          <n-text depth="3" mb-2 block data-test-id="field-count">
            {{ t('tools.pdf-form-builder.texts.fields', [fields.length]) }}
          </n-text>
          <c-alert v-if="duplicates.length" type="warning" mb-2>
            {{ t('tools.pdf-form-builder.texts.error-duplicate', [duplicates.join(', ')]) }}
          </c-alert>
          <c-alert v-if="error" type="error" mb-2>
            {{ error }}
          </c-alert>
          <div flex flex-wrap gap-2>
            <c-button
              type="primary"
              :disabled="!fields.length || duplicates.length > 0 || loading"
              :loading="busy"
              data-test-id="download"
              @click="download"
            >
              {{ t('tools.pdf-form-builder.texts.download') }}
            </c-button>
            <c-button data-test-id="close" @click="close">
              {{ t('tools.pdf-form-builder.texts.close') }}
            </c-button>
          </div>
        </c-card>
      </div>

      <div class="pages">
        <n-spin v-if="loading" :description="t('tools.pdf-form-builder.texts.loading')" py-10 w-full />
        <c-alert v-for="number in rotatedPages" :key="number" type="warning" mb-2>
          {{ t('tools.pdf-form-builder.texts.hint-rotated', [number]) }}
        </c-alert>
        <div
          v-for="(page, index) in pages"
          :key="index"
          class="page"
          :class="{ placing: tool !== 'select' }"
          :data-test-id="`page-${index + 1}`"
        >
          <img
            :src="page.image"
            alt=""
            draggable="false"
            @pointerdown.prevent="(event: PointerEvent) => onPagePointerDown(event, index)"
          />
          <div
            v-for="field in fields.filter((candidate) => candidate.page === index)"
            :key="field.id"
            class="field"
            :class="[field.type, { selected: field.id === selectedId }]"
            :style="fieldStyle(field)"
            :data-test-id="`field-${field.name}`"
            @pointerdown.stop.prevent="(event: PointerEvent) => startGesture(event, field, 'move')"
          >
            <span
              class="content"
              :style="{ fontSize: `calc(${field.fontSize || Math.min(12, field.height * 0.7)} * var(--pt))` }"
            >
              {{ preview(field) }}
            </span>
            <span
              v-if="field.id === selectedId"
              class="handle"
              @pointerdown.stop.prevent="(event: PointerEvent) => startGesture(event, field, 'resize')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.builder {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.side {
  flex: 0 0 280px;
  position: sticky;
  top: 16px;

  @media (max-width: 900px) {
    position: static;
  }
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.position {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.pages {
  flex: 1;
  min-width: 0;
}

.page {
  position: relative;
  container-type: inline-size;
  max-width: 900px;
  margin: 0 auto 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25);
  user-select: none;
  touch-action: none;

  &.placing {
    cursor: crosshair;
  }

  img {
    display: block;
    width: 100%;
  }
}

.field {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid #18a058;
  background: rgba(24, 160, 88, 0.12);
  color: #1e1e1e;
  cursor: move;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 calc(2 * var(--pt));

  &.multiline,
  &.label {
    align-items: flex-start;
  }

  &.checkbox,
  &.radio {
    justify-content: center;
    padding: 0;
  }

  &.radio {
    border-radius: 50%;
  }

  &.label {
    border-style: dashed;
    background: rgba(24, 160, 88, 0.05);
  }

  &.selected {
    border-width: 2px;
    background: rgba(24, 160, 88, 0.22);
    overflow: visible;
  }

  .content {
    white-space: pre-wrap;
    line-height: 1.2;
    overflow: hidden;
    max-height: 100%;
    pointer-events: none;
  }

  .handle {
    position: absolute;
    right: -5px;
    bottom: -5px;
    width: 10px;
    height: 10px;
    background: #18a058;
    border: 1px solid #fff;
    cursor: nwse-resize;
  }
}
</style>
