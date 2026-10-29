import { describe, expect, it } from 'vitest';
import { applyOpacity, opacityAt } from './image-opacity.service';

describe('image-opacity', () => {
  it('applies a solid opacity', () => {
    const data = new Uint8ClampedArray([10, 20, 30, 255, 10, 20, 30, 100]);
    applyOpacity(data, 2, 1, { mode: 'solid', opacity: 0.5, direction: 'right' });
    expect([data[3], data[7]]).toEqual([128, 50]);
  });

  it('fades linearly in the chosen direction', () => {
    const options = { mode: 'linear' as const, opacity: 0, direction: 'right' as const };
    expect(opacityAt(0, 0, 11, 1, options)).toBe(1);
    expect(opacityAt(5, 0, 11, 1, options)).toBeCloseTo(0.5);
    expect(opacityAt(10, 0, 11, 1, options)).toBe(0);
    expect(opacityAt(0, 10, 1, 11, { ...options, direction: 'up' })).toBe(1);
  });

  it('fades radially to the edges or to the centre', () => {
    const options = { mode: 'radial' as const, opacity: 0, direction: 'edges' as const };
    expect(opacityAt(50, 50, 101, 101, options)).toBe(1);
    expect(opacityAt(0, 0, 101, 101, options)).toBe(0);
    expect(opacityAt(50, 50, 101, 101, { ...options, direction: 'center' })).toBe(0);
  });

  it('flattens on a background colour', () => {
    const data = new Uint8ClampedArray([0, 0, 0, 255]);
    applyOpacity(data, 1, 1, { mode: 'solid', opacity: 0.25, direction: 'right', background: [255, 255, 255, 255] });
    expect([...data]).toEqual([191, 191, 191, 255]);
  });
});
