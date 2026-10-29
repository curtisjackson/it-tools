import { describe, expect, it } from 'vitest';
import { buildMergeArgs } from './video-merge.service';

const options = { width: 641, height: 360, fps: 30 };

describe('video-merge', () => {
  it('normalises every clip and concatenates video and audio', () => {
    const args = buildMergeArgs(
      [
        { name: 'a.mp4', duration: 3, hasAudio: true },
        { name: 'b.mov', duration: 2.5, hasAudio: false },
      ],
      'out.mp4',
      options,
    );
    expect(args.slice(0, 4)).toEqual(['-i', 'a.mp4', '-i', 'b.mov']);
    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph).toContain('[0:v]scale=642:360:force_original_aspect_ratio=decrease,pad=642:360');
    expect(graph).toContain('[0:a]aresample=44100');
    expect(graph).toContain('anullsrc=r=44100:cl=stereo,atrim=duration=2.500[a1]');
    expect(graph.endsWith('[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]')).toBe(true);
    expect(args).toEqual(expect.arrayContaining(['-map', '[v]', '-map', '[a]', '-c:a', 'aac']));
  });

  it('joins silent clips without an audio track', () => {
    const args = buildMergeArgs(
      [
        { name: 'a', duration: 1, hasAudio: false },
        { name: 'b', duration: 1, hasAudio: false },
      ],
      'out.mp4',
      options,
    );
    const graph = args[args.indexOf('-filter_complex') + 1];
    expect(graph.endsWith('[v0][v1]concat=n=2:v=1:a=0[v]')).toBe(true);
    expect(args).not.toContain('[a]');
    expect(args).toContain('-an');
  });

  it('needs two clips', () => {
    expect(() => buildMergeArgs([{ name: 'a', duration: 1, hasAudio: true }], 'out', options)).toThrow();
  });
});
