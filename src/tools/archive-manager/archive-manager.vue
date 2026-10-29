<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { IconLock } from '@tabler/icons-vue';
import {
  type ArchiveEntry,
  type ArchiveFormat,
  type FilenameEncoding,
  type OpenedArchive,
  type ZipEncryption,
  archiveExtensions,
  archiveFormats,
  createArchive,
  filenameEncodings,
  openArchive,
} from './archive-manager.service';
import FileToolLayout from '@/components/media/FileToolLayout.vue';
import TextareaCopyable from '@/components/TextareaCopyable.vue';
import { formatBytes } from '@/utils/convert';
import { deduplicateFileNames, downloadBlob } from '@/utils/file-output';

const { t } = useI18n();
const k = (key: string, values?: unknown[]) => t(`tools.archive-manager.texts.${key}`, values ?? []);

// Text previews of bigger entries would be unreadable anyway.
const MAX_PREVIEW_BYTES = 1 << 20;

// --- Open ---

const archiveFile = ref<File>();
const filenameEncoding = ref<FilenameEncoding>('auto');
const password = ref('');
const archive = ref<OpenedArchive>();
const openError = ref<string>();
const entryError = ref<string>();
const preview = ref<{ path: string; text: string }>();

const encodingOptions = computed(() => filenameEncodings.map((value) => ({ value, label: k(`encoding-${value}`) })));

watch([archiveFile, filenameEncoding], async ([file, encoding]) => {
  archive.value = undefined;
  openError.value = undefined;
  entryError.value = undefined;
  preview.value = undefined;
  if (!file) {
    return;
  }
  try {
    const opened = await openArchive(new Uint8Array(await file.arrayBuffer()), {
      fileName: file.name,
      filenameEncoding: encoding,
    });
    if (file === archiveFile.value && encoding === filenameEncoding.value) {
      archive.value = opened;
    }
  } catch (error) {
    openError.value = error instanceof Error ? error.message : String(error);
  }
});

const files = computed(() => archive.value?.entries.filter(({ kind }) => kind === 'file') ?? []);
const hasEncrypted = computed(() => archive.value?.entries.some(({ encrypted }) => encrypted) ?? false);
const totalSize = computed(() => files.value.reduce((sum, { size }) => sum + size, 0));
const archiveBaseName = computed(
  () => (archiveFile.value?.name ?? 'archive').replace(/\.(zip|tar|tgz|tar\.gz|gz)$/i, '') || 'archive',
);

function baseName(path: string) {
  return path.replace(/\/$/, '').split('/').pop() || path;
}

async function readEntry(entry: ArchiveEntry) {
  entryError.value = undefined;
  try {
    return await entry.read(password.value);
  } catch (error) {
    entryError.value = `${entry.path}: ${error instanceof Error ? error.message : String(error)}`;
    return undefined;
  }
}

async function downloadEntry(entry: ArchiveEntry) {
  const data = await readEntry(entry);
  if (data) {
    downloadBlob(new Blob([data as Uint8Array<ArrayBuffer>]), baseName(entry.path));
  }
}

async function previewEntry(entry: ArchiveEntry) {
  if (preview.value?.path === entry.path) {
    preview.value = undefined;
    return;
  }
  const data = await readEntry(entry);
  if (data) {
    preview.value = { path: entry.path, text: new TextDecoder().decode(data) };
  }
}

const extracting = ref(false);

// Repacks the files as a plain zip with their folders: handy for a tar, or to drop the password of a zip.
async function downloadAll() {
  extracting.value = true;
  try {
    const inputs = [];
    for (const entry of files.value) {
      const data = await readEntry(entry);
      if (!data) {
        return;
      }
      inputs.push({ path: entry.path, data, modified: entry.modified });
    }
    const zip = await createArchive(inputs, 'zip');
    downloadBlob(
      new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }),
      `${archiveBaseName.value}.zip`,
    );
  } finally {
    extracting.value = false;
  }
}

function formatDate(date?: Date) {
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : '';
}

// --- Create ---

const format = ref<ArchiveFormat>('zip');
const archiveName = ref('archive');
const level = ref(6);
const zipPassword = ref('');
const encryption = ref<ZipEncryption>('aes');
const comment = ref('');

const formatOptions = archiveFormats.map((value) => ({ value, label: `.${archiveExtensions[value]}` }));
const levelOptions = computed(() =>
  Array.from({ length: 10 }, (_, value) => ({
    value,
    label: value === 0 ? k('level-store') : String(value),
  })).filter(({ value }) => format.value === 'zip' || value > 0),
);
const encryptionOptions = computed(() =>
  (['aes', 'zip-crypto'] as const).map((value) => ({ value, label: k(`encryption-${value}`) })),
);

watch(format, (value) => {
  if (value !== 'zip' && level.value === 0) {
    level.value = 6;
  }
});

async function create(inputs: File[]) {
  // A file picked from a folder keeps its folder in the archive.
  const paths = deduplicateFileNames(inputs.map((file) => file.webkitRelativePath || file.name));
  const entries = await Promise.all(
    inputs.map(async (file, i) => ({
      path: paths[i],
      data: new Uint8Array(await file.arrayBuffer()),
      modified: new Date(file.lastModified),
    })),
  );
  const bytes = await createArchive(entries, format.value, {
    level: level.value,
    password: zipPassword.value,
    encryption: encryption.value,
    comment: comment.value,
  });
  const name = `${archiveName.value.trim() || 'archive'}.${archiveExtensions[format.value]}`;
  return new File([bytes as Uint8Array<ArrayBuffer>], name, {
    type: format.value === 'zip' ? 'application/zip' : 'application/octet-stream',
  });
}
</script>

<template>
  <n-tabs type="card" animated>
    <n-tab-pane name="open" :tab="k('tab-open')">
      <div mx-auto max-w-600px>
        <media-file-input
          v-model:file="archiveFile"
          kind="file"
          accept=".zip,.tar,.tgz,.gz,application/zip,application/x-tar,application/gzip"
          :title="k('drop-archive')"
        />
      </div>

      <c-alert v-if="openError" type="error" mt-3 data-test-id="open-error">{{ openError }}</c-alert>

      <c-card v-if="archive" mt-3>
        <div mb-3 flex flex-wrap items-center justify-between gap-2>
          <span data-test-id="summary">
            {{ k('summary', [archive.format.toUpperCase(), files.length, formatBytes(totalSize)]) }}
          </span>
          <c-button :disabled="!files.length || extracting" data-test-id="download-all" @click="downloadAll">
            {{ k(hasEncrypted ? 'download-decrypted' : 'download-all') }}
          </c-button>
        </div>

        <c-select
          v-if="archive.format === 'zip'"
          v-model:value="filenameEncoding"
          :options="encodingOptions"
          :label="k('label-encoding')"
          label-position="left"
          label-width="150px"
          mb-2
        />
        <c-input-text
          v-if="hasEncrypted"
          v-model:value="password"
          type="password"
          :label="k('label-password')"
          :placeholder="k('placeholder-password')"
          label-position="left"
          label-width="150px"
          mb-2
          data-test-id="password"
        />
        <n-text v-if="archive.comment" depth="3" mb-2 block>{{ k('comment', [archive.comment]) }}</n-text>

        <c-alert v-if="entryError" type="error" mb-2 data-test-id="entry-error">{{ entryError }}</c-alert>

        <n-table size="small" :single-line="false">
          <thead>
            <tr>
              <th>{{ k('column-name') }}</th>
              <th text-right>{{ k('column-size') }}</th>
              <th>{{ k('column-modified') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in archive.entries" :key="entry.path" data-test-id="entry">
              <td break-all>
                <n-icon v-if="entry.encrypted" :component="IconLock" mr-1 :title="k('encrypted')" />
                <span font-mono>{{ entry.path }}</span>
                <span v-if="entry.linkTarget" op-70> → {{ entry.linkTarget }}</span>
                <span v-else-if="entry.kind !== 'file'" op-70> ({{ k(`kind-${entry.kind}`) }})</span>
              </td>
              <td whitespace-nowrap text-right>
                <template v-if="entry.kind === 'file'">
                  {{ formatBytes(entry.size) }}
                  <div v-if="entry.compressedSize !== undefined" text-xs op-60>
                    {{ k('packed', [formatBytes(entry.compressedSize)]) }}
                  </div>
                </template>
              </td>
              <td whitespace-nowrap text-sm>{{ formatDate(entry.modified) }}</td>
              <td whitespace-nowrap text-right>
                <template v-if="entry.kind === 'file'">
                  <c-button
                    v-if="entry.size <= MAX_PREVIEW_BYTES"
                    size="small"
                    variant="text"
                    data-test-id="preview"
                    @click="previewEntry(entry)"
                  >
                    {{ k(preview?.path === entry.path ? 'hide' : 'view') }}
                  </c-button>
                  <c-button size="small" data-test-id="download" @click="downloadEntry(entry)">
                    {{ k('download') }}
                  </c-button>
                </template>
              </td>
            </tr>
          </tbody>
        </n-table>

        <div v-if="preview" mt-3>
          <div mb-1 font-mono text-sm op-70>{{ preview.path }}</div>
          <TextareaCopyable :value="preview.text" word-wrap scrollable />
        </div>
      </c-card>
    </n-tab-pane>

    <n-tab-pane name="create" :tab="k('tab-create')">
      <FileToolLayout multiple :button-text="k('create')" :task="create">
        <c-buttons-select
          v-model:value="format"
          :options="formatOptions"
          :label="k('label-format')"
          label-width="150px"
          mb-2
        />
        <c-input-text
          v-model:value="archiveName"
          :label="k('label-name')"
          label-position="left"
          label-width="150px"
          mb-2
        />
        <c-select
          v-if="format !== 'tar'"
          v-model:value="level"
          :options="levelOptions"
          :label="k('label-level')"
          label-position="left"
          label-width="150px"
          mb-2
        />
        <template v-if="format === 'zip'">
          <c-input-text
            v-model:value="zipPassword"
            type="password"
            :label="k('label-password')"
            :placeholder="k('placeholder-no-password')"
            label-position="left"
            label-width="150px"
            mb-2
          />
          <c-select
            v-if="zipPassword"
            v-model:value="encryption"
            :options="encryptionOptions"
            :label="k('label-encryption')"
            label-position="left"
            label-width="150px"
            mb-2
          />
          <c-input-text
            v-model:value="comment"
            :label="k('label-comment')"
            label-position="left"
            label-width="150px"
            mb-2
          />
        </template>
        <n-text depth="3" block text-sm>{{
          k(`hint-${format === 'zip' && zipPassword ? encryption : format.replace('.', '-')}`)
        }}</n-text>
      </FileToolLayout>
    </n-tab-pane>
  </n-tabs>
</template>
