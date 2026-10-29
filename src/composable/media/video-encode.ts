// Shared output settings of the ffmpeg tools: H.264 + AAC in MP4, playable everywhere.

export interface H264Options {
  crf?: number;
  /** x264 preset: `veryfast` keeps 1080p close to real time in the single-threaded core (`medium` is ~8× slower). */
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium';
  audio?: 'aac' | 'none';
  audioBitrate?: string;
}

/** Encoder arguments for an MP4 that plays in browsers: H.264 yuv420p, AAC, moov atom first. */
export function h264Args({
  crf = 23,
  preset = 'veryfast',
  audio = 'aac',
  audioBitrate = '128k',
}: H264Options = {}): string[] {
  return [
    '-c:v',
    'libx264',
    '-preset',
    preset,
    '-crf',
    String(crf),
    '-pix_fmt',
    'yuv420p',
    ...(audio === 'aac' ? ['-c:a', 'aac', '-b:a', audioBitrate] : ['-an']),
    '-movflags',
    '+faststart',
  ];
}

/** `holiday.mov` + `_rotated` + `mp4` → `holiday_rotated.mp4`. */
export function outputFileName(fileName: string, suffix: string, extension: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return `${base}${suffix}.${extension}`;
}

/** The extension of a file name, lower-cased, or `fallback`. */
export function fileExtension(fileName: string, fallback = 'bin'): string {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : fallback;
}
