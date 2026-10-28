import { describe, expect, it, vi } from 'vitest';
import { FfmpegExitError, type FfmpegLike, createFfmpegRunner } from './ffmpeg-runner';

type Listener = (event: any) => void;

function createFakeFfmpeg({ exitCode = 0 } = {}) {
  const files = new Map<string, Uint8Array>();
  const listeners = { log: new Set<Listener>(), progress: new Set<Listener>() };
  const fake = {
    files,
    listeners,
    async exec(args: string[]) {
      listeners.log.forEach((listener) => listener({ type: 'stderr', message: `ran ${args.join(' ')}` }));
      listeners.progress.forEach((listener) => listener({ progress: 1, time: 0 }));
      return exitCode;
    },
    async writeFile(name: string, data: Uint8Array) {
      files.set(name, data);
      return true;
    },
    async readFile(name: string) {
      return files.get(name) ?? new Uint8Array();
    },
    async deleteFile(name: string) {
      files.delete(name);
      return true;
    },
    on(event: 'log' | 'progress', listener: Listener) {
      listeners[event].add(listener);
    },
    off(event: 'log' | 'progress', listener: Listener) {
      listeners[event].delete(listener);
    },
    terminate: vi.fn<() => void>(),
  };
  return fake as typeof fake & FfmpegLike;
}

type Load = () => Promise<FfmpegLike>;

describe('createFfmpegRunner', () => {
  it('loads the core once and reuses it', async () => {
    const fake = createFakeFfmpeg();
    const load = vi.fn<Load>(async () => fake);
    const { run } = createFfmpegRunner(load);

    await run(async () => 1);
    await run(async () => 2);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('writes inputs, reads outputs and deletes the temporary files', async () => {
    const fake = createFakeFfmpeg();
    const { run } = createFfmpegRunner(async () => fake);

    const output = await run(async ({ writeInput, readOutput }) => {
      const name = await writeInput(new File(['abc'], 'in.txt'), 'txt');
      expect(name).toMatch(/^[\da-f-]{36}\.txt$/);
      return readOutput(name, 'out.txt', 'text/plain');
    });

    expect(output.name).toBe('out.txt');
    expect(output.type).toBe('text/plain');
    expect(await output.text()).toBe('abc');
    expect(fake.files.size).toBe(0);
  });

  it('runs tasks one after another', async () => {
    const { run } = createFfmpegRunner(async () => createFakeFfmpeg());
    const order: string[] = [];

    await Promise.all([
      run(async () => {
        order.push('a:start');
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push('a:end');
      }),
      run(async () => {
        order.push('b:start');
        order.push('b:end');
      }),
    ]);

    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('keeps running tasks after one fails', async () => {
    const { run } = createFfmpegRunner(async () => createFakeFfmpeg());

    await expect(
      run(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await expect(run(async () => 'next')).resolves.toBe('next');
  });

  it('throws a FfmpegExitError with the logs when ffmpeg fails', async () => {
    const { run } = createFfmpegRunner(async () => createFakeFfmpeg({ exitCode: 1 }));

    const failure = run(({ exec }) => exec(['-i', 'missing.mp4']));

    await expect(failure).rejects.toBeInstanceOf(FfmpegExitError);
    await expect(failure).rejects.toThrow('ffmpeg exited with code 1: ran -i missing.mp4');
  });

  it('forwards log and progress events of its own task only', async () => {
    const fake = createFakeFfmpeg();
    const { run } = createFfmpegRunner(async () => fake);
    const onLog = vi.fn<(event: unknown) => void>();
    const onProgress = vi.fn<(event: unknown) => void>();

    await run(({ exec }) => exec(['-version']), { onLog, onProgress });
    await run(({ exec }) => exec(['-version']));

    expect(onLog).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith({ progress: 1, time: 0 });
    expect(fake.listeners.log.size).toBe(0);
    expect(fake.listeners.progress.size).toBe(0);
  });

  it('reset terminates the worker and the next task loads a new core', async () => {
    const first = createFakeFfmpeg();
    const second = createFakeFfmpeg();
    const load = vi.fn<Load>().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const { run, reset } = createFfmpegRunner(load);

    await run(async () => undefined);
    await reset();
    await run(async ({ ffmpeg }) => expect(ffmpeg).toBe(second));

    expect(first.terminate).toHaveBeenCalled();
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('retries loading after a failed load', async () => {
    const load = vi.fn<Load>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(createFakeFfmpeg());
    const { run } = createFfmpegRunner(load);

    await expect(run(async () => 1)).rejects.toThrow('offline');
    await expect(run(async () => 2)).resolves.toBe(2);
  });
});
