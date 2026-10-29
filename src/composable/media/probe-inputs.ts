import type { FfmpegTaskContext } from './ffmpeg-runner';
import { parseFfmpegProbe } from './probe-media';

export interface ProbedInput {
  name: string;
  duration: number;
  width: number;
  height: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

/** Reads the stream kinds, size and duration of a file already in the ffmpeg file system, inside a running task. */
export async function probeInput({ ffmpeg }: FfmpegTaskContext, name: string): Promise<ProbedInput> {
  const logs: string[] = [];
  const collect = ({ message }: { message: string }) => logs.push(message);
  ffmpeg.on('log', collect);
  try {
    // Without an output ffmpeg exits with an error after printing the input banner.
    await ffmpeg.exec(['-hide_banner', '-i', name]);
  } finally {
    ffmpeg.off('log', collect);
  }
  const banner = logs.join('\n');
  return {
    name,
    ...parseFfmpegProbe(logs),
    hasAudio: /Stream #[^\n]*Audio:/.test(banner),
    hasVideo: /Stream #[^\n]*Video:/.test(banner),
  };
}
