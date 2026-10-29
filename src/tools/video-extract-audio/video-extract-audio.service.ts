// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/audio/extract-audio/service.ts, with an "as in the video" option
// that copies the audio stream into a container matching its codec.
import { type AudioEncodeOptions, audioEncodeArgs } from '@/composable/media/audio-formats';

/** `options` undefined copies the audio stream as is. */
export function buildExtractAudioArgs(input: string, output: string, options?: AudioEncodeOptions): string[] {
  return ['-i', input, '-map', '0:a:0', ...(options ? audioEncodeArgs(options) : ['-vn', '-c:a', 'copy']), output];
}
