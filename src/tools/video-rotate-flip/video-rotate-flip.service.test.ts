import { describe, expect, it } from 'vitest';
import { buildRotateFlipArgs, buildRotateFlipFilter } from './video-rotate-flip.service';

describe('video-rotate-flip', () => {
  it('builds the filter chain', () => {
    expect(buildRotateFlipFilter({ rotation: 90, flipHorizontal: false, flipVertical: false })).toBe('transpose=clock');
    expect(buildRotateFlipFilter({ rotation: 270, flipHorizontal: true, flipVertical: false })).toBe(
      'transpose=cclock,hflip',
    );
    expect(buildRotateFlipFilter({ rotation: 180, flipHorizontal: false, flipVertical: false })).toBe('hflip,vflip');
    expect(buildRotateFlipFilter({ rotation: 0, flipHorizontal: false, flipVertical: true })).toBe('vflip');
    expect(buildRotateFlipFilter({ rotation: 0, flipHorizontal: false, flipVertical: false })).toBe('');
  });

  it('refuses to re-encode without a change', () => {
    expect(() => buildRotateFlipArgs('a', 'b', { rotation: 0, flipHorizontal: false, flipVertical: false })).toThrow();
    expect(
      buildRotateFlipArgs('a', 'b', { rotation: 90, flipHorizontal: false, flipVertical: false }).slice(0, 4),
    ).toEqual(['-i', 'a', '-vf', 'transpose=clock']);
  });
});
