// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/add-audio/service.ts. The result always lasts as long as
// the video, the video stream is copied, and mixing does not halve the volumes (amix normalize=0).
import { toFfmpegSeconds } from '@/composable/media/ffmpeg-args';

export type AudioMode = 'replace' | 'mix';

export interface AddAudioOptions {
  video: string;
  audio: string;
  output: string;
  mode: AudioMode;
  /** Volume of the added audio, in percent. */
  volume: number;
  /** Volume of the original audio when mixing, in percent. */
  originalVolume: number;
  loop: boolean;
  /** When the added audio starts, in seconds from the start of the video. */
  offset: number;
  videoDuration: number;
  videoHasAudio: boolean;
}

const gain = (percent: number) => Math.max(0, percent / 100).toFixed(2);

export function buildAddAudioArgs(options: AddAudioOptions): string[] {
  const { video, audio, output, mode, volume, originalVolume, loop, offset, videoDuration, videoHasAudio } = options;
  if (!(videoDuration > 0)) {
    throw new Error('Unknown video duration');
  }
  const delay = Math.round(Math.max(0, offset) * 1000);
  const added = `[1:a]volume=${gain(volume)}${delay > 0 ? `,adelay=${delay}:all=1` : ''},apad[added]`;
  const graph =
    mode === 'mix' && videoHasAudio
      ? `${added};[0:a]volume=${gain(originalVolume)}[original];[original][added]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[aout]`
      : `${added.replace('[added]', '[aout]')}`;
  return [
    '-i',
    video,
    ...(loop ? ['-stream_loop', '-1'] : []),
    '-i',
    audio,
    '-filter_complex',
    graph,
    '-map',
    '0:v:0',
    '-map',
    '[aout]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    toFfmpegSeconds(videoDuration),
    '-movflags',
    '+faststart',
    output,
  ];
}
