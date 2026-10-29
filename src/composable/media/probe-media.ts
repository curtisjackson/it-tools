import { runFfmpegTask } from './useFfmpeg';

export interface MediaMetadata {
  duration: number;
  width: number;
  height: number;
}

/** Reads the duration and the video size from the banner ffmpeg prints for `ffmpeg -i <file>`. */
export function parseFfmpegProbe(logs: string[]): MediaMetadata {
  const text = logs.join('\n');
  const duration = text.match(/Duration: (\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  const size = text.match(/Stream #[^\n]*?Video:[^\n]*?, (\d+)x(\d+)/);
  return {
    duration: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : 0,
    width: size ? Number(size[1]) : 0,
    height: size ? Number(size[2]) : 0,
  };
}

/**
 * Probes a file with ffmpeg, for formats the browser cannot open itself — e.g. H.264 in Chromium builds without
 * proprietary codecs.
 */
export function probeWithFfmpeg(file: File): Promise<MediaMetadata> {
  const logs: string[] = [];
  return runFfmpegTask(
    async ({ ffmpeg, writeInput }) => {
      const input = await writeInput(file, file.name.split('.').pop() || 'bin');
      // Without an output file ffmpeg exits with an error, after printing the input banner.
      await ffmpeg.exec(['-hide_banner', '-i', input]);
      return parseFfmpegProbe(logs);
    },
    { onLog: ({ message }) => logs.push(message) },
  );
}
