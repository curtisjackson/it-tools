// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/loop/service.ts

/** Plays the input `times` times in a row, copying the streams (no re-encoding). */
export function buildLoopArgs(input: string, output: string, times: number): string[] {
  if (!Number.isInteger(times) || times < 2) {
    throw new RangeError('Loop at least twice');
  }
  return ['-stream_loop', String(times - 1), '-i', input, '-c', 'copy', '-map', '0', output];
}
