<script setup lang="ts">
import { type IAudioMetadata, type IPicture, parseBlob } from 'music-metadata';
import { useI18n } from 'vue-i18n';
import { commonRows, formatRows, metadataToJson, nativeRows, pictures } from './audio-metadata.service';
import { downloadBlob, replaceExtension } from '@/utils/file-output';
import { formatBytes } from '@/utils/convert';

const { t, te } = useI18n();

const file = ref<File>();
const metadata = ref<IAudioMetadata>();
const error = ref<string>();
const loading = ref(false);

watch(file, async (value) => {
  metadata.value = undefined;
  error.value = undefined;
  if (!value) {
    return;
  }
  loading.value = true;
  try {
    const result = await parseBlob(value, { duration: true });
    if (file.value === value) {
      metadata.value = result;
    }
  } catch (err) {
    if (file.value === value) {
      error.value = t('tools.audio-metadata.texts.error', [err instanceof Error ? err.message : String(err)]);
    }
  } finally {
    loading.value = false;
  }
});

const label = (group: string, key: string) =>
  te(`tools.audio-metadata.texts.${group}-${key}`) ? t(`tools.audio-metadata.texts.${group}-${key}`) : key;
const format = computed(() => (metadata.value ? formatRows(metadata.value.format) : []));
const common = computed(() => (metadata.value ? commonRows(metadata.value.common) : []));
const native = computed(() => (metadata.value ? nativeRows(metadata.value) : []));
const warnings = computed(() => metadata.value?.quality.warnings.map(({ message }) => message) ?? []);
const covers = computed(() =>
  (metadata.value ? pictures(metadata.value) : []).map((picture) => ({
    picture,
    url: URL.createObjectURL(new Blob([picture.data as Uint8Array<ArrayBuffer>], { type: picture.format })),
  })),
);
watch(covers, (_, previous) => previous?.forEach(({ url }) => URL.revokeObjectURL(url)));
onBeforeUnmount(() => covers.value.forEach(({ url }) => URL.revokeObjectURL(url)));

const json = computed(() => (metadata.value ? metadataToJson(metadata.value) : ''));

function downloadPicture(picture: IPicture, index: number) {
  const extension = picture.format.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
  downloadBlob(
    new Blob([picture.data as Uint8Array<ArrayBuffer>], { type: picture.format }),
    `cover-${index + 1}.${extension}`,
  );
}

function downloadJson() {
  downloadBlob(
    new Blob([json.value], { type: 'application/json' }),
    replaceExtension(file.value?.name ?? 'audio', 'json'),
  );
}
</script>

<template>
  <div>
    <media-file-input
      v-model:file="file"
      kind="audio"
      accept="audio/*,.m4a,.m4b,.flac,.opus,.ogg,.wma,.aif,.aiff,.ape,.wv,.mka,.dsf"
      :title="t('tools.audio-metadata.texts.drop')"
    />

    <div v-if="loading" mt-3 flex justify-center><n-spin size="small" /></div>
    <div v-if="error" mx-auto mt-3 max-w-600px>
      <c-alert type="error" data-test-id="error">{{ error }}</c-alert>
    </div>

    <div v-if="metadata" mx-auto mt-3 max-w-600px>
      <c-card v-if="covers.length" :title="t('tools.audio-metadata.texts.title-pictures')" mb-3>
        <div flex flex-wrap gap-3>
          <div v-for="({ picture, url }, index) in covers" :key="url" text-center>
            <img :src="url" alt="" class="checkerboard" max-h-200px max-w-200px block data-test-id="cover" />
            <div my-1 text-sm op-70>
              {{ [picture.type, formatBytes(picture.data.length)].filter(Boolean).join(' · ') }}
            </div>
            <c-button size="small" @click="downloadPicture(picture, index)">
              {{ t('tools.audio-metadata.texts.download') }}
            </c-button>
          </div>
        </div>
      </c-card>

      <c-card :title="t('tools.audio-metadata.texts.title-format')" mb-3>
        <n-table size="small" :single-line="false">
          <tbody>
            <tr v-for="[key, value] in format" :key="key">
              <td w-200px>{{ label('format', key) }}</td>
              <td break-all>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
      </c-card>

      <c-card :title="t('tools.audio-metadata.texts.title-tags')" mb-3>
        <n-table v-if="common.length" size="small" :single-line="false" data-test-id="tags">
          <tbody>
            <tr v-for="[key, value] in common" :key="key">
              <td w-200px>{{ label('tag', key) }}</td>
              <td whitespace-pre-wrap break-all>{{ value }}</td>
            </tr>
          </tbody>
        </n-table>
        <n-text v-else depth="3">{{ t('tools.audio-metadata.texts.no-tags') }}</n-text>
      </c-card>

      <c-card v-if="native.length" :title="t('tools.audio-metadata.texts.title-native')" mb-3>
        <n-collapse>
          <n-collapse-item
            v-for="{ type, rows } in native"
            :key="type"
            :title="`${type} (${rows.length})`"
            :name="type"
          >
            <n-table size="small" :single-line="false">
              <tbody>
                <tr v-for="([key, value], index) in rows" :key="index">
                  <td w-200px font-mono>{{ key }}</td>
                  <td whitespace-pre-wrap break-all>{{ value }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-collapse-item>
        </n-collapse>
      </c-card>

      <c-alert v-if="warnings.length" type="warning" mb-3>
        <div>{{ t('tools.audio-metadata.texts.warnings') }}</div>
        <ul my-1 pl-5>
          <li v-for="(warning, index) in warnings" :key="index">{{ warning }}</li>
        </ul>
      </c-alert>

      <div flex justify-center>
        <c-button @click="downloadJson">{{ t('tools.audio-metadata.texts.download-json') }}</c-button>
      </div>
    </div>
  </div>
</template>
