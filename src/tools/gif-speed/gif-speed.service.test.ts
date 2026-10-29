import { describe, expect, it } from 'vitest';
import { buildGifSpeedArgs } from './gif-speed.service';

describe('gif-speed', () => {
  it('scales the timestamps and rebuilds the palette', () => {
    expect(buildGifSpeedArgs('in.gif', 'out.gif', 2)).toEqual([
      '-i',
      'in.gif',
      '-filter_complex',
      '[0:v]setpts=0.5*PTS,split[a][b];[a]palettegen[p];[b][p]paletteuse',
      '-loop',
      '0',
      '-f',
      'gif',
      'out.gif',
    ]);
    expect(buildGifSpeedArgs('in.gif', 'out.gif', 0.5)[3]).toContain('setpts=2*PTS');
    expect(() => buildGifSpeedArgs('a', 'b', 0)).toThrow(RangeError);
  });
});
