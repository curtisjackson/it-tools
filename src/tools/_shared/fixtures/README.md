# Media fixtures

Small files for the e2e tests of the media tools. Regenerate them with:

```bash
ffmpeg -y -f lavfi -i "testsrc2=size=320x240:rate=25:duration=3" -f lavfi -i "sine=frequency=440:duration=3" \
  -c:v libx264 -preset veryslow -crf 35 -pix_fmt yuv420p -c:a aac -b:a 32k -shortest -movflags +faststart sample.mp4
ffmpeg -y -f lavfi -i "sine=frequency=660:duration=3" -c:a libmp3lame -b:a 32k sample.mp3
ffmpeg -y -f lavfi -i "testsrc2=size=64x48" -frames:v 1 sample.png
ffmpeg -y -i sample.mp4 -t 1 -vf "fps=5,scale=80:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 sample.gif
```

`sample.pdf` is made with pdf-lib (from the repository root):

```js
// node --input-type=module -e "$(cat this-snippet)" src/tools/_shared/fixtures
import { readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument, StandardFonts } from 'pdf-lib';
const dir = process.argv[1];
const doc = await PDFDocument.create();
doc.setTitle('Sample PDF');
const font = await doc.embedFont(StandardFonts.Helvetica);
const png = await doc.embedPng(readFileSync(`${dir}/sample.png`));
for (const n of [1, 2]) {
  const page = doc.addPage([300, 200]);
  page.drawText(`Page ${n}`, { x: 20, y: 160, size: 18, font });
  page.drawText(`Hello from page ${n}.`, { x: 20, y: 135, size: 12, font });
  if (n === 1) page.drawImage(png, { x: 20, y: 20, width: 64, height: 48 });
}
writeFileSync(`${dir}/sample.pdf`, await doc.save());
```

| File         | Content                                                     |
| ------------ | ----------------------------------------------------------- |
| `sample.mp4` | 3 s, 320×240, 25 fps, H.264 + AAC 440 Hz tone               |
| `sample.mp3` | 3 s, 660 Hz tone, MP3                                       |
| `sample.png` | 64×48 test pattern                                          |
| `sample.gif` | 1 s, 80×60, 5 fps, looping, made from `sample.mp4`          |
| `sample.pdf` | 2 pages of 300×200 pt with text; page 1 embeds `sample.png` |
