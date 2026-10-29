<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type AudioMode, buildAddAudioArgs } from './video-add-audio.service';
import type { FfmpegTaskContext } from '@/composable/media/ffmpeg-runner';
import { probeInput } from '@/composable/media/probe-inputs';
import type { MediaMetadata } from '@/composable/media/probe-media';
import { fileExtension, outputFileName } from '@/composable/media/video-encode';
import { useQueryParamOrStorage } from '@/composable/queryParams';

const { t } = useI18n();

const storage = (name: string) => `video-add-audio:${name}`;
const mode = useQueryParamOrStorage<AudioMode>({ name: 'mode', storageName: storage('mode'), defaultValue: 'replace' });
const volume = useQueryParamOrStorage({ name: 'vol', storageName: storage('vol'), defaultValue: 100 });
const originalVolume = useQueryParamOrStorage({ name: 'orig', storageName: storage('orig'), defaultValue: 100 });
const loop = useQueryParamOrStorage({ name: 'loop', storageName: storage('loop'), defaultValue: false });
const offset = useQueryParamOrStorage({ name: 'offset', storageName: storage('offset'), defaultValue: 0 });

const audio = ref<File>();
const modeOptions = computed(() => [
  { label: t('tools.video-add-audio.texts.mode-replace'), value: 'replace' },
  { label: t('tools.video-add-audio.texts.mode-mix'), value: 'mix' },
]);

async function addAudio(context: FfmpegTaskContext, video: File, metadata: MediaMetadata | undefined) {
  const videoName = await context.writeInput(video, fileExtension(video.name, 'mp4'));
  const audioName = await context.writeInput(audio.value!, fileExtension(audio.value!.name, 'mp3'));
  const probed = await probeInput(context, videoName);
  const output = context.tempFile('mp4');
  await context.exec(
    buildAddAudioArgs({
      video: videoName,
      audio: audioName,
      output,
      mode: mode.value,
      volume: volume.value ?? 100,
      originalVolume: originalVolume.value ?? 100,
      loop: loop.value,
      offset: offset.value ?? 0,
      videoDuration: metadata?.duration || probed.duration,
      videoHasAudio: probed.hasAudio,
    }),
  );
  return context.readOutput(output, outputFileName(video.name, '_with_audio', 'mp4'), 'video/mp4');
}
</script>

<template>
  <media-tool-layout
    kind="video"
    :task="addAudio"
    :ready="!!audio"
    :button-text="t('tools.video-add-audio.texts.button')"
  >
    <c-buttons-select
      v-model:value="mode"
      :options="modeOptions"
      :label="t('tools.video-add-audio.texts.label-mode')"
      label-width="140px"
      mb-2
    />
    <n-form-item
      :label="t('tools.video-add-audio.texts.label-volume', [volume])"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="volume" :min="0" :max="200" :step="5" />
    </n-form-item>
    <n-form-item
      v-if="mode === 'mix'"
      :label="t('tools.video-add-audio.texts.label-original-volume', [originalVolume])"
      label-placement="left"
      label-width="140"
      :show-feedback="false"
      mb-2
    >
      <n-slider v-model:value="originalVolume" :min="0" :max="200" :step="5" />
    </n-form-item>
    <n-space align="center">
      <n-form-item
        :label="t('tools.video-add-audio.texts.label-offset')"
        label-placement="left"
        label-width="140"
        :show-feedback="false"
      >
        <n-input-number-i18n v-model:value="offset" :min="0" :step="0.5" />
      </n-form-item>
      <n-form-item :label="t('tools.video-add-audio.texts.label-loop')" label-placement="left" :show-feedback="false">
        <n-switch v-model:value="loop" />
      </n-form-item>
    </n-space>

    <template #below-input>
      <div mb-1 text-center op-80>{{ t('tools.video-add-audio.texts.label-audio') }}</div>
      <media-file-input v-model:file="audio" kind="audio" :title="t('tools.video-add-audio.texts.drop-audio')" />
    </template>
  </media-tool-layout>
</template>
