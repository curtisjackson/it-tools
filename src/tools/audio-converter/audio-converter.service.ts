// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/converters/audio-converter/service.ts
import { type AudioEncodeOptions, audioEncodeArgs } from '@/composable/media/audio-formats';

export function buildAudioConvertArgs(input: string, output: string, options: AudioEncodeOptions): string[] {
  return ['-i', input, ...audioEncodeArgs(options), output];
}
