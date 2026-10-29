import { type Zippable, zipSync } from 'fflate';

/** Replaces the extension of a file name, or adds one: `replaceExtension('clip.mov', 'mp4')` → `clip.mp4`. */
export function replaceExtension(fileName: string, extension: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot > 0 ? fileName.slice(0, dot) : fileName;
  return `${base}.${extension.replace(/^\./, '')}`;
}

/** Appends ` (1)`, ` (2)`, ... before the extension of the names that are already taken. */
export function deduplicateFileNames(fileNames: string[]): string[] {
  const taken = new Set<string>();
  return fileNames.map((fileName) => {
    let candidate = fileName;
    const dot = fileName.lastIndexOf('.');
    const [base, extension] = dot > 0 ? [fileName.slice(0, dot), fileName.slice(dot)] : [fileName, ''];
    for (let i = 1; taken.has(candidate); i++) {
      candidate = `${base} (${i})${extension}`;
    }
    taken.add(candidate);
    return candidate;
  });
}

/** Zips files into one archive. Images, audio and video are stored without recompression. */
export async function zipFiles(files: File[]): Promise<Blob> {
  const names = deduplicateFileNames(files.map(({ name }) => name));
  const entries: Zippable = {};
  for (const [index, file] of files.entries()) {
    const alreadyCompressed = /^(image|audio|video)\//.test(file.type) && file.type !== 'image/bmp';
    entries[names[index]] = [new Uint8Array(await file.arrayBuffer()), { level: alreadyCompressed ? 0 : 6 }];
  }
  return new Blob([zipSync(entries) as BlobPart], { type: 'application/zip' });
}

/** Saves a blob through a temporary object URL. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadFile(file: File): void {
  downloadBlob(file, file.name);
}

/** Downloads a single file as is, or several files as one zip archive named `zipName`. */
export async function downloadFiles(files: File[], zipName: string): Promise<void> {
  if (files.length === 1) {
    downloadFile(files[0]);
    return;
  }
  downloadBlob(await zipFiles(files), replaceExtension(zipName, 'zip'));
}
