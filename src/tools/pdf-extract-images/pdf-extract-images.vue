<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { extractedImageName, toRgba } from './pdf-extract-images.service';
import type { FileTaskContext } from '@/components/media/FileToolLayout.vue';
import { canvasToBlob, loadPdf, pdfJS } from '@/utils/pdfjs';

const { t } = useI18n();

interface PdfImageObject {
  width: number;
  height: number;
  kind?: number;
  data?: Uint8Array | Uint8ClampedArray;
  bitmap?: ImageBitmap;
}

/** Resolves a page object, which pdf.js may still be decoding. */
function getObject(
  objs: { get: (name: string, callback: (value: unknown) => void) => void },
  name: string,
): Promise<PdfImageObject | undefined> {
  return Promise.race([
    new Promise<PdfImageObject>((resolve) => objs.get(name, (value) => resolve(value as PdfImageObject))),
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000)),
  ]);
}

async function toPng(image: PdfImageObject): Promise<Blob | undefined> {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  if (image.bitmap) {
    context.drawImage(image.bitmap, 0, 0);
  } else if (image.data && image.kind) {
    context.putImageData(
      new ImageData(toRgba(image.data, image.width, image.height, image.kind), image.width, image.height),
      0,
      0,
    );
  } else {
    return undefined;
  }
  return canvasToBlob(canvas, 'image/png');
}

async function extract([file]: File[], { onProgress, signal }: FileTaskContext) {
  const pdf = await loadPdf(await file.arrayBuffer());
  const seen = new Set<string>();
  const images: File[] = [];
  for (let number = 1; number <= pdf.numPages && !signal.aborted; number++) {
    const page = await pdf.getPage(number);
    const operators = await page.getOperatorList();
    let index = 0;
    for (const [i, fn] of operators.fnArray.entries()) {
      let image: PdfImageObject | undefined;
      if (fn === pdfJS.OPS.paintImageXObject) {
        const name = operators.argsArray[i][0] as string;
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        image = await getObject(name.startsWith('g_') ? page.commonObjs : page.objs, name);
      } else if (fn === pdfJS.OPS.paintInlineImageXObject) {
        image = operators.argsArray[i][0] as PdfImageObject;
      }
      const blob = image?.width && image.height ? await toPng(image) : undefined;
      if (blob) {
        images.push(new File([blob], extractedImageName(file.name, number, ++index), { type: 'image/png' }));
      }
    }
    onProgress(number / pdf.numPages);
  }
  await pdf.destroy();
  if (images.length === 0) {
    throw new Error(t('tools.pdf-extract-images.texts.none'));
  }
  return images;
}
</script>

<template>
  <file-tool-layout
    accept=".pdf,application/pdf"
    :title="t('tools.pdf-extract-images.texts.drop')"
    :task="extract"
    :button-text="t('tools.pdf-extract-images.texts.button')"
  >
    <n-text depth="3" text-sm>{{ t('tools.pdf-extract-images.texts.hint') }}</n-text>
  </file-tool-layout>
</template>
