<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type AudioEncodeOptions, type AudioFormat, audioFormats } from '@/composable/media/audio-formats';

// `format` may also be one of `extraFormats`, such as `copy`.
const props = withDefaults(
  defineProps<{
    value: Omit<AudioEncodeOptions, 'format'> & { format: string };
    extraFormats?: { label: string; value: string }[];
  }>(),
  {
    extraFormats: () => [],
  },
);
const emit = defineEmits(['update:value']);

const { t } = useI18n();
const options = useVModel(props, 'value', emit, { passive: true, deep: true });

const formatOptions = computed(() => [
  ...props.extraFormats,
  ...(Object.keys(audioFormats) as AudioFormat[]).map((value) => ({ label: value.toUpperCase(), value })),
]);
const bitrateOptions = [64, 96, 128, 192, 256, 320].map((value) => ({ label: `${value}`, value }));
const sampleRateOptions = computed(() => [
  { label: t('shared.audio.keep'), value: 0 },
  { label: '44.1 kHz', value: 44100 },
  { label: '48 kHz', value: 48000 },
]);
const channelOptions = computed(() => [
  { label: t('shared.audio.keep'), value: 0 },
  { label: t('shared.audio.mono'), value: 1 },
  { label: t('shared.audio.stereo'), value: 2 },
]);
const isLossy = computed(() => audioFormats[options.value.format as AudioFormat]?.lossy ?? false);
const isEncoded = computed(() => options.value.format in audioFormats);
</script>

<template>
  <div>
    <c-buttons-select
      v-model:value="options.format"
      :options="formatOptions"
      :label="t('shared.audio.format')"
      label-width="120px"
      mb-2
    />
    <template v-if="isEncoded">
      <c-buttons-select
        v-if="isLossy"
        v-model:value="options.bitrate"
        :options="bitrateOptions"
        :label="t('shared.audio.bitrate')"
        label-width="120px"
        mb-2
      />
      <c-buttons-select
        v-model:value="options.sampleRate"
        :options="sampleRateOptions"
        :label="t('shared.audio.sample-rate')"
        label-width="120px"
        mb-2
      />
      <c-buttons-select
        v-model:value="options.channels"
        :options="channelOptions"
        :label="t('shared.audio.channels')"
        label-width="120px"
      />
    </template>
  </div>
</template>
