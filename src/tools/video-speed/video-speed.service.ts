// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/change-speed/service.ts
import { atempoChain } from '@/composable/media/ffmpeg-args';
import { h264Args } from '@/composable/media/video-encode';

export interface SpeedOptions {
  /** 2 plays twice as fast, 0.5 half as fast. */
  speed: number;
  removeAudio: boolean;
}

export function buildSpeedArgs(input: string, output: string, { speed, removeAudio }: SpeedOptions): string[] {
  if (!(speed > 0)) {
    throw new RangeError('Speed must be positive');
  }
  const pts = Number((1 / speed).toFixed(6));
  return [
    '-i',
    input,
    '-vf',
    `setpts=${pts}*PTS`,
    // atempo keeps the pitch; it only applies when the input has an audio stream.
    ...(removeAudio ? [] : ['-af', atempoChain(speed)]),
    ...h264Args({ audio: removeAudio ? 'none' : 'aac' }),
    output,
  ];
}
