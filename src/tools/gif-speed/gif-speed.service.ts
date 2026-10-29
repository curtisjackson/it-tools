// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/gif/change-speed/service.ts, keeping the animation looping.

export function buildGifSpeedArgs(input: string, output: string, speed: number): string[] {
  if (!(speed > 0)) {
    throw new RangeError('Speed must be positive');
  }
  const pts = Number((1 / speed).toFixed(6));
  return [
    '-i',
    input,
    '-filter_complex',
    `[0:v]setpts=${pts}*PTS,split[a][b];[a]palettegen[p];[b][p]paletteuse`,
    '-loop',
    '0',
    '-f',
    'gif',
    output,
  ];
}
