// Ported from omni-tools (MIT) v0.7.0: AUDIO_FORMATS in src/pages/tools/converters/audio-converter/types.ts, extended
// with Opus, M4A, sample rate and channels.

export type AudioFormat = 'mp3' | 'm4a' | 'ogg' | 'opus' | 'wav' | 'flac';

interface AudioFormatInfo {
  codec: string;
  extension: string;
  mime: string;
  lossy: boolean;
}

export const audioFormats: Record<AudioFormat, AudioFormatInfo> = {
  mp3: { codec: 'libmp3lame', extension: 'mp3', mime: 'audio/mpeg', lossy: true },
  m4a: { codec: 'aac', extension: 'm4a', mime: 'audio/mp4', lossy: true },
  ogg: { codec: 'libvorbis', extension: 'ogg', mime: 'audio/ogg', lossy: true },
  opus: { codec: 'libopus', extension: 'opus', mime: 'audio/ogg', lossy: true },
  wav: { codec: 'pcm_s16le', extension: 'wav', mime: 'audio/wav', lossy: false },
  flac: { codec: 'flac', extension: 'flac', mime: 'audio/flac', lossy: false },
};

export interface AudioEncodeOptions {
  format: AudioFormat;
  /** kbit/s, for lossy formats. */
  bitrate: number;
  /** Hz, or 0 to keep. */
  sampleRate: number;
  /** 1, 2, or 0 to keep. */
  channels: number;
}

/** Encoder arguments for `format`; also drops any video (cover art included). */
export function audioEncodeArgs({ format, bitrate, sampleRate, channels }: AudioEncodeOptions): string[] {
  const info = audioFormats[format];
  return [
    '-vn',
    '-c:a',
    info.codec,
    ...(info.lossy ? ['-b:a', `${bitrate}k`] : []),
    ...(sampleRate > 0 ? ['-ar', String(sampleRate)] : []),
    ...(channels > 0 ? ['-ac', String(channels)] : []),
  ];
}

const containersByCodec: Record<string, { extension: string; mime: string }> = {
  aac: { extension: 'm4a', mime: 'audio/mp4' },
  mp3: { extension: 'mp3', mime: 'audio/mpeg' },
  opus: { extension: 'opus', mime: 'audio/ogg' },
  vorbis: { extension: 'ogg', mime: 'audio/ogg' },
  flac: { extension: 'flac', mime: 'audio/flac' },
  ac3: { extension: 'ac3', mime: 'audio/ac3' },
  pcm_s16le: { extension: 'wav', mime: 'audio/wav' },
};

/** The codec of the first audio stream in an ffmpeg banner, e.g. `aac`. */
export function audioCodecOf(banner: string): string | undefined {
  return banner.match(/Stream #[^\n]*Audio: ([\w-]+)/)?.[1];
}

/** A container that can hold `codec` as is; Matroska audio for anything else. */
export function containerForCodec(codec: string | undefined): { extension: string; mime: string } {
  return containersByCodec[codec ?? ''] ?? { extension: 'mka', mime: 'audio/x-matroska' };
}
