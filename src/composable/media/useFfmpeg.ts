import { FFmpeg } from '@ffmpeg/ffmpeg';
import ffmpegClassWorkerUrl from '@ffmpeg/ffmpeg/worker?worker&url';
// Shipped with the app (single-threaded ESM build), so the media tools work offline. The worker above is a module
// worker, so it `import()`s the core.
import ffmpegCoreUrl from '@ffmpeg/core?url';
import ffmpegWasmUrl from '@ffmpeg/core/wasm?url';
import { type FfmpegTaskContext, createFfmpegRunner } from './ffmpeg-runner';

const runner = createFfmpegRunner(async () => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({ coreURL: ffmpegCoreUrl, wasmURL: ffmpegWasmUrl, classWorkerURL: ffmpegClassWorkerUrl });
  return ffmpeg;
});

/** Runs a task on the shared ffmpeg instance, for code outside components. */
export const runFfmpegTask = runner.run;

/** Reactive state around the shared ffmpeg instance: one task at a time per component, queued across components. */
export function useFfmpeg() {
  const running = ref(false);
  const progress = ref(0);
  const logs = ref<string[]>([]);
  const error = ref<string>();
  let cancelled = false;

  async function run<T>(task: (context: FfmpegTaskContext) => Promise<T>): Promise<T | undefined> {
    running.value = true;
    progress.value = 0;
    logs.value = [];
    error.value = undefined;
    cancelled = false;
    try {
      return await runner.run(task, {
        onLog: ({ message }) => logs.value.push(message),
        onProgress: ({ progress: value }) => {
          progress.value = Math.min(1, Math.max(0, value));
        },
      });
    } catch (err) {
      if (!cancelled) {
        error.value = err instanceof Error ? err.message : String(err);
      }
      return undefined;
    } finally {
      running.value = false;
    }
  }

  async function cancel() {
    cancelled = true;
    await runner.reset();
  }

  onBeforeUnmount(() => {
    if (running.value) {
      void cancel();
    }
  });

  return { running, progress, logs, error, run, cancel };
}
