/**
 * Builds an `atempo` filter chain for any speed factor: each `atempo` only accepts 0.5–2 (more in recent ffmpeg, but
 * chaining keeps the quality), so 4× becomes `atempo=2,atempo=2`.
 */
export function atempoChain(speed: number): string {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new RangeError('Speed must be a positive number');
  }
  const factors: number[] = [];
  let rest = speed;
  while (rest > 2) {
    factors.push(2);
    rest /= 2;
  }
  while (rest < 0.5) {
    factors.push(0.5);
    rest /= 0.5;
  }
  factors.push(rest);
  return factors.map((factor) => `atempo=${formatNumber(factor)}`).join(',');
}

/** Seconds as ffmpeg accepts them in `-ss`/`-to`, with millisecond precision: `62.5` → `62.500`. */
export function toFfmpegSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError('Time must be a non-negative number of seconds');
  }
  return seconds.toFixed(3);
}

function formatNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}
