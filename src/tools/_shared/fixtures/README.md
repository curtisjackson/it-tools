# Media fixtures

Small files for the e2e tests of the media tools. Regenerate them with:

```bash
ffmpeg -y -f lavfi -i "testsrc2=size=320x240:rate=25:duration=3" -f lavfi -i "sine=frequency=440:duration=3" \
  -c:v libx264 -preset veryslow -crf 35 -pix_fmt yuv420p -c:a aac -b:a 32k -shortest -movflags +faststart sample.mp4
ffmpeg -y -f lavfi -i "sine=frequency=660:duration=3" -c:a libmp3lame -b:a 32k sample.mp3
ffmpeg -y -f lavfi -i "testsrc2=size=64x48" -frames:v 1 sample.png
ffmpeg -y -i sample.mp4 -t 1 -vf "fps=5,scale=80:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" -loop 0 sample.gif
```

| File         | Content                                            |
| ------------ | -------------------------------------------------- |
| `sample.mp4` | 3 s, 320×240, 25 fps, H.264 + AAC 440 Hz tone      |
| `sample.mp3` | 3 s, 660 Hz tone, MP3                              |
| `sample.png` | 64×48 test pattern                                 |
| `sample.gif` | 1 s, 80×60, 5 fps, looping, made from `sample.mp4` |
