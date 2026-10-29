// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/video/crop-video/service.ts, with the area clamped to the frame
// and rounded to even sizes (required by H.264 4:2:0).
import { h264Args } from '@/composable/media/video-encode';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const even = (value: number) => Math.max(0, Math.floor(value / 2) * 2);

/** Keeps the area inside a `frameWidth`×`frameHeight` frame, with even position and size of at least 2 pixels. */
export function normalizeCropArea(
  { x, y, width, height }: CropArea,
  frameWidth: number,
  frameHeight: number,
): CropArea {
  const left = even(Math.min(Math.max(0, x), frameWidth - 2));
  const top = even(Math.min(Math.max(0, y), frameHeight - 2));
  return {
    x: left,
    y: top,
    width: Math.max(2, even(Math.min(width, frameWidth - left))),
    height: Math.max(2, even(Math.min(height, frameHeight - top))),
  };
}

export function buildCropArgs(input: string, output: string, { x, y, width, height }: CropArea): string[] {
  if (width <= 0 || height <= 0) {
    throw new Error('Width and height must be positive');
  }
  return ['-i', input, '-vf', `crop=${width}:${height}:${x}:${y}`, ...h264Args(), output];
}

/** Draws the frame at `time` (seconds) of a video file, or rejects when the browser cannot decode it. */
export function captureVideoFrame(file: File, time = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    const done = (fn: () => void) => {
      URL.revokeObjectURL(url);
      fn();
    };
    video.onerror = () => done(() => reject(new Error('The browser cannot decode this video')));
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(time, Math.max(0, video.duration - 0.05) || 0);
    };
    video.onseeked = () =>
      done(() => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      });
    video.src = url;
  });
}
