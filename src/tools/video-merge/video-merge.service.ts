// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/merge-video/service.ts. Instead of the concat demuxer
// (which needs identical codecs and sizes) every clip is scaled and padded to the first clip's size, set to the same
// frame rate and audio format, and silent clips get a silent track, so any mix of videos can be joined.
import { h264Args } from '@/composable/media/video-encode';

export interface MergeInput {
  name: string;
  duration: number;
  hasAudio: boolean;
}

export interface MergeOptions {
  width: number;
  height: number;
  fps: number;
}

const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

export function buildMergeArgs(inputs: MergeInput[], output: string, { width, height, fps }: MergeOptions): string[] {
  if (inputs.length < 2) {
    throw new Error('Choose at least two videos');
  }
  const [w, h] = [even(width), even(height)];
  const withAudio = inputs.some((input) => input.hasAudio);
  const filters = inputs.flatMap((input, i) => {
    const video = `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},format=yuv420p[v${i}]`;
    if (!withAudio) {
      return [video];
    }
    const audio = input.hasAudio
      ? `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
      : `anullsrc=r=44100:cl=stereo,atrim=duration=${input.duration.toFixed(3)}[a${i}]`;
    return [video, audio];
  });
  const streams = inputs.map((_, i) => (withAudio ? `[v${i}][a${i}]` : `[v${i}]`)).join('');
  filters.push(`${streams}concat=n=${inputs.length}:v=1:a=${withAudio ? 1 : 0}${withAudio ? '[v][a]' : '[v]'}`);
  return [
    ...inputs.flatMap((input) => ['-i', input.name]),
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[v]',
    ...(withAudio ? ['-map', '[a]'] : []),
    ...h264Args({ audio: withAudio ? 'aac' : 'none' }),
    output,
  ];
}
