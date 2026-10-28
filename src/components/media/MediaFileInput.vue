<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type MediaMetadata, probeWithFfmpeg } from '@/composable/media/probe-media';
import { formatBytes } from '@/utils/convert';
import { formatTimecode } from '@/utils/timecode';

const props = withDefaults(
  defineProps<{
    file?: File;
    kind: 'video' | 'audio' | 'image';
    accept?: string;
    title?: string;
    disabled?: boolean;
  }>(),
  { file: undefined, accept: undefined, title: undefined, disabled: false },
);
const emit = defineEmits<{
  (event: 'update:file', file: File | undefined): void;
  (event: 'loaded', metadata: MediaMetadata): void;
}>();

const { t } = useI18n();

const file = useVModel(props, 'file', emit);
const url = useObjectUrl(file);
const element = ref<HTMLVideoElement | HTMLAudioElement | HTMLImageElement>();
const metadata = ref<MediaMetadata>();
// The browser cannot decode some files (e.g. H.264 in Chromium builds without proprietary codecs): ffmpeg can.
const previewUnsupported = ref(false);

const defaultAccept = { video: 'video/*,.mkv', audio: 'audio/*', image: 'image/*' };

watch(file, () => {
  metadata.value = undefined;
  previewUnsupported.value = false;
});

function onLoaded() {
  const el = element.value;
  if (!el) {
    return;
  }
  metadata.value =
    el instanceof HTMLImageElement
      ? { duration: 0, width: el.naturalWidth, height: el.naturalHeight }
      : {
          duration: Number.isFinite(el.duration) ? el.duration : 0,
          width: el instanceof HTMLVideoElement ? el.videoWidth : 0,
          height: el instanceof HTMLVideoElement ? el.videoHeight : 0,
        };
  emit('loaded', metadata.value);
}

async function onPreviewError() {
  const source = file.value;
  if (!source || previewUnsupported.value) {
    return;
  }
  previewUnsupported.value = true;
  try {
    const probed = await probeWithFfmpeg(source);
    if (file.value === source) {
      metadata.value = probed;
      emit('loaded', probed);
    }
  } catch {
    // Nothing more to show: the info line keeps the name and size only.
  }
}

/** Moves the preview to a time, e.g. to show the frame at the start of a trim range. */
function seek(time: number) {
  if (element.value && !(element.value instanceof HTMLImageElement)) {
    element.value.currentTime = time;
  }
}

const info = computed(() =>
  [
    file.value?.name,
    file.value && formatBytes(file.value.size),
    metadata.value?.duration && formatTimecode(metadata.value.duration),
    metadata.value?.width && `${metadata.value.width}×${metadata.value.height}`,
  ]
    .filter(Boolean)
    .join(' · '),
);

defineExpose({ seek, element });
</script>

<template>
  <div mx-auto max-w-600px>
    <c-file-upload
      v-if="!file"
      :title="title ?? t(`shared.media.drop-${kind}`)"
      :accept="accept ?? defaultAccept[kind]"
      @file-upload="(uploaded: File) => (file = uploaded)"
    />
    <c-card v-else>
      <n-text v-if="previewUnsupported" depth="3" block text-sm data-test-id="preview-unsupported">
        {{ t('shared.media.preview-unsupported') }}
      </n-text>
      <video
        v-else-if="kind === 'video'"
        ref="element"
        :src="url"
        controls
        preload="metadata"
        w-full
        max-h-360px
        @loadedmetadata="onLoaded"
        @error="onPreviewError"
      />
      <audio
        v-else-if="kind === 'audio'"
        ref="element"
        :src="url"
        controls
        preload="metadata"
        w-full
        @loadedmetadata="onLoaded"
        @error="onPreviewError"
      />
      <img v-else ref="element" :src="url" alt="" mx-auto block max-h-360px max-w-full @load="onLoaded" />

      <div mt-2 flex flex-wrap items-center justify-between gap-2>
        <div text-sm op-70 data-test-id="media-info">{{ info }}</div>
        <c-button size="small" :disabled="disabled" @click="file = undefined">
          {{ t('shared.media.change-file') }}
        </c-button>
      </div>
    </c-card>
  </div>
</template>
