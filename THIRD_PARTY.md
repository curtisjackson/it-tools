# Third-party code

Some tools of this fork are ports of code from other open-source projects. Each ported file starts with a
`Ported from …` comment naming the original file and version; ported test cases say so too.

| Project | Version | License | Used for |
| --- | --- | --- | --- |
| [Omni-Tools](https://github.com/iib0011/omni-tools) | v0.7.0 | MIT | See below |
| [CyberChef](https://github.com/gchq/CyberChef) | v11.5.0 | Apache-2.0 | See below |

## Omni-Tools

Copyright (c) 2024 Ibrahima Gaye Coulibaly. Licensed under the MIT License.

- Text: `text-reverse`, `random-case`, `text-repeat`, `rot-cipher`, `palindrome`, `text-truncate`, `text-censor`,
  `email-extractor`, `hidden-characters-detector`
- Lists: `list-chunk`, `list-rotate`, `list-duplicate`, `list-most-popular`, `list-shuffle`, `list-truncate`,
  `list-unwrap`
- Numbers: `number-to-words`, `arithmetic-sequence`, `numbers-sum`
- Date and time: `leap-year-checker`, `discord-timestamp`, `clock-time-truncate`, `time-to-decimal`,
  `date-weekday-calculator`
- CSV and tables: `csv-transpose`, `csv-separator-converter`, `tsv-to-json`, `csv-insert-columns`, `csv-swap-columns`,
  `csv-incomplete-records`, `table-converter`
- Video, GIF and audio: `video-trim`, `video-resize`, `video-rotate-flip`, `video-compress`, `video-speed`, `video-loop`,
  `video-crop`, `video-merge`, `video-add-audio`, `video-to-gif`, `images-to-gif`, `gif-speed`, `audio-converter`,
  `video-extract-audio`, `audio-trim`, `audio-speed`, `audio-merge`
- PDF: `pdf-rotate`, `images-to-pdf`, `pdf-to-images`, `pdf-extract-images`, `pdf-to-epub`, `image-split-to-pdf`
- Images: `image-color-to-transparent`, `image-replace-color`, `image-opacity`, `image-compressor`, `png-compressor`
- Shared code: `src/utils/text-split.ts`, `text-items.ts`, `matrix.ts`, `csv.ts`, `page-ranges.ts`, `image-pixels.ts`,
  `src/composable/media/ffmpeg-runner.ts`, `audio-formats.ts`

## CyberChef

Crown Copyright. Licensed under the Apache License, Version 2.0.

- Tools: `extract-dates`
- Shared code: `src/utils/byte-stream.ts` (`Stream`)
