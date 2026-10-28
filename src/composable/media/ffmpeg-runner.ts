// Ported from omni-tools (MIT) v0.7.0: src/lib/ffmpeg.ts (runFFmpegTask), with the core loader injected so the queue can
// be tested without a worker, a non-zero exit code turned into an error and per-task log/progress listeners.
import type { FFmpeg, LogEventCallback, ProgressEventCallback } from '@ffmpeg/ffmpeg';

export type FfmpegLike = Pick<FFmpeg, 'exec' | 'writeFile' | 'readFile' | 'deleteFile' | 'on' | 'off' | 'terminate'>;

export class FfmpegExitError extends Error {
  constructor(
    readonly exitCode: number,
    readonly logs: string[],
  ) {
    super(`ffmpeg exited with code ${exitCode}${logs.length > 0 ? `: ${logs.at(-1)}` : ''}`);
    this.name = 'FfmpegExitError';
  }
}

export interface FfmpegTaskContext {
  ffmpeg: FfmpegLike;
  /** A unique name in the ffmpeg file system, deleted when the task ends. */
  tempFile: (extension: string) => string;
  /** Copies a file into the ffmpeg file system and returns its temporary name. */
  writeInput: (file: File | Blob, extension: string) => Promise<string>;
  /** Reads a file of the ffmpeg file system as a `File`. */
  readOutput: (name: string, fileName: string, type: string) => Promise<File>;
  /** Runs ffmpeg and throws a `FfmpegExitError` when it fails. */
  exec: (args: string[]) => Promise<void>;
}

export interface FfmpegTaskListeners {
  onLog?: LogEventCallback;
  onProgress?: ProgressEventCallback;
}

export function createFfmpegRunner(load: () => Promise<FfmpegLike>) {
  let instance: Promise<FfmpegLike> | null = null;
  // The ffmpeg worker cannot run two commands at once, so tasks run one after another.
  let queue: Promise<unknown> = Promise.resolve();

  function getInstance() {
    if (!instance) {
      instance = load().catch((error) => {
        instance = null;
        throw error;
      });
    }
    return instance;
  }

  function run<T>(task: (context: FfmpegTaskContext) => Promise<T>, { onLog, onProgress }: FfmpegTaskListeners = {}) {
    const result = queue.then(async () => {
      const ffmpeg = await getInstance();
      const tempFiles = new Set<string>();
      const logs: string[] = [];
      const collectLog: LogEventCallback = (event) => {
        logs.push(event.message);
        onLog?.(event);
      };
      const tempFile = (extension: string) => {
        const name = `${crypto.randomUUID()}.${extension.replace(/^\./, '')}`;
        tempFiles.add(name);
        return name;
      };

      ffmpeg.on('log', collectLog);
      if (onProgress) {
        ffmpeg.on('progress', onProgress);
      }
      try {
        return await task({
          ffmpeg,
          tempFile,
          async writeInput(file, extension) {
            const name = tempFile(extension);
            await ffmpeg.writeFile(name, new Uint8Array(await file.arrayBuffer()));
            return name;
          },
          async readOutput(name, fileName, type) {
            const data = await ffmpeg.readFile(name);
            return new File([data as BlobPart], fileName, { type });
          },
          async exec(args) {
            const exitCode = await ffmpeg.exec(args);
            if (exitCode !== 0) {
              throw new FfmpegExitError(exitCode, logs);
            }
          },
        });
      } finally {
        ffmpeg.off('log', collectLog);
        if (onProgress) {
          ffmpeg.off('progress', onProgress);
        }
        await Promise.all([...tempFiles].map((name) => ffmpeg.deleteFile(name).catch(() => undefined)));
      }
    });
    queue = result.catch(() => undefined);
    return result;
  }

  /** Kills the worker, which aborts the running task; the next task loads a fresh core. */
  async function reset() {
    const current = instance;
    instance = null;
    if (current) {
      (await current.catch(() => null))?.terminate();
    }
  }

  return { run, reset };
}
