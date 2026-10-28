/** Formats seconds as `MM:SS.mmm`, or `H:MM:SS.mmm` from one hour on. */
export function formatTimecode(seconds: number): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  const mmss = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

/** Parses `SS`, `MM:SS` or `HH:MM:SS`, each with optional decimals (`.` or `,`), into seconds. */
export function parseTimecode(timecode: string): number {
  const parts = timecode.trim().replace(',', '.').split(':');
  if (parts.length > 3 || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) {
    throw new Error(`Invalid time "${timecode}": use SS, MM:SS or HH:MM:SS`);
  }
  if (parts.slice(0, -1).some((part) => part.includes('.'))) {
    throw new Error(`Invalid time "${timecode}": only seconds can have decimals`);
  }
  if (parts.slice(1).some((part) => Number(part) >= 60)) {
    throw new Error(`Invalid time "${timecode}": minutes and seconds must be below 60`);
  }
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}
