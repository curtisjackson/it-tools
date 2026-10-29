import { replaceExtension } from './file-output';

/** Decodes an image file into its pixels. */
export async function loadImageData(file: File | Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

export async function imageDataToFile(
  imageData: ImageData,
  fileName: string,
  type = 'image/png',
  quality?: number,
): Promise<File> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  canvas.getContext('2d')!.putImageData(imageData, 0, 0);
  const blob = await canvas.convertToBlob({ type, quality });
  return new File([blob], replaceExtension(fileName, type === 'image/jpeg' ? 'jpg' : type.split('/')[1]), { type });
}
