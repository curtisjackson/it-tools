// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/audio/change-speed/service.ts
import { atempoChain } from '@/composable/media/ffmpeg-args';
import { type AudioEncodeOptions, audioEncodeArgs } from '@/composable/media/audio-formats';

/** Changes the speed and keeps the pitch. */
export function buildAudioSpeedArgs(
  input: string,
  output: string,
  speed: number,
  options: AudioEncodeOptions,
): string[] {
  return ['-i', input, '-af', atempoChain(speed), ...audioEncodeArgs(options), output];
}
