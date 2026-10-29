// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/audio/merge-audio/service.ts. One concat filter with a common
// sample format replaces the conversion of every file to WAV, so any mix of formats can be joined.
import { type AudioEncodeOptions, audioEncodeArgs } from '@/composable/media/audio-formats';

export function buildAudioMergeArgs(inputs: string[], output: string, options: AudioEncodeOptions): string[] {
  if (inputs.length < 2) {
    throw new Error('Choose at least two audio files');
  }
  const normalised = inputs.map(
    (_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`,
  );
  const concat = `${inputs.map((_, i) => `[a${i}]`).join('')}concat=n=${inputs.length}:v=0:a=1[a]`;
  return [
    ...inputs.flatMap((input) => ['-i', input]),
    '-filter_complex',
    [...normalised, concat].join(';'),
    '-map',
    '[a]',
    ...audioEncodeArgs(options),
    output,
  ];
}
