// Made with lz4 1.10 and xz 5.8: see the comment on each vector.

export const CAT = 'The cat sat on the mat.';

// The text of REPEATED_LZ4: 2700 lines that repeat every 977 lines, 80670 bytes.
export function repeatedText(): string {
  return Array.from({ length: 2700 }, (_, i) => `line ${i % 977} of a repetitive text\n`).join('');
}

export const LZ4_VECTORS: { name: string; hex: string }[] = [
  // CyberChef "LZ4 Compress" (lz4js output)
  { name: 'lz4js', hex: '04224d184070df170000805468652063617420736174206f6e20746865206d61742e00000000' },
  // lz4 -c: independent blocks, content checksum
  {
    name: 'content checksum',
    hex: '04224d186440a7170000805468652063617420736174206f6e20746865206d61742e000000001e4b09ce',
  },
  // lz4 -c -BX --content-size: block checksums and content size
  {
    name: 'block checksum and content size',
    hex: '04224d187c401700000000000000f0170000805468652063617420736174206f6e20746865206d61742e1e4b09ce000000001e4b09ce',
  },
  // lz4 -c -l: legacy format
  { name: 'legacy', hex: '02214c1819000000f0085468652063617420736174206f6e20746865206d61742e' },
];

// lz4 -c -B4 -BD: 64 KB linked blocks, the second block refers back to the first.
export const REPEATED_LZ4 =
  'BCJNGERAXngVAADxDWxpbmUgMCBvZiBhIHJlcGV0aXRpdmUgdGV4dAocAB8xHAAIHzIcAAgfMxwACB80HAAIHzUcAAgfNhwACB83HAAIHzgcAAgfORwACB8xGQEKDxoBCR8xGwEJHzEcAQkfMR0BCR8xHgEJHzEfAQkfMSABCR8xIQEJHzEiAQkfMiIBCR8yIgEJHzIiAQkfMiIBCR8yIgEJHzIiAQkfMiIBCR8yIgEJHzIiAQkfMiIBCR8zIgEJHzMiAQkfMyIBCR8zIgEJHzMiAQkfMyIBCR8zIgEJHzMiAQkfMyIBCR8zIgEJHzQiAQkfNCIBCR80IgEJHzQiAQkfNCIBCR80IgEJHzQiAQkfNCIBCR80IgEJHzQiAQkfNSIBCR81IgEJHzUiAQkfNSIBCR81IgEJHzUiAQkfNSIBCR81IgEJHzUiAQkfNSIBCR82IgEJHzYiAQkfNiIBCR82IgEJHzYiAQkfNiIBCR82IgEJHzYiAQkfNiIBCR82IgEJHzciAQkfNyIBCR83IgEJHzciAQkfNyIBCR83IgEJHzciAQkfNyIBCR83IgEJHzciAQkfOCIBCR84IgEJHzgiAQkfOCIBCR84IgEJHzgiAQkfOCIBCR84IgEJHzgiAQkfOCIBCR85IgEJHzkiAQkfOSIBCR85IgEJHzkiAQkfOSIBCR85IgEJHzkiAQkfOSIBCR85IgEJLzEwIwEJLzEwJAEJLzEwJQEJLzEwJgEJLzEwJwEJLzEwKAEJLzEwKQEJLzEwKgEJLzEwKwEJLzEwLAEKD18LDA8sAQoPYQsLD2ILCw9jCwsPZAsLD2ULCw9mCwsPZwsLD2gLCh8xaQsKHzFqCwofMWsLCh8xbAsKHzFtCwofMW4LCh8xbwsKHzFwCwofMXELCh8xcgsKHzFzCwofMXQLCh8xdQsKHzF2CwofMXcLCh8xeAsKHzF5CwofMXoLCh8xewsKHzF8CwofMX0LCh8xfgsKHzF/CwofMYALCh8xgQsKHzGCCwofMYMLCh8xhAsKHzGFCwofMYYLCh8xhwsKHzGICwofMYkLCh8xigsKHzGLCwofMYwLCh8xjQsKHzGOCwofMY8LCh8xkAsKHzGRCwofMZILCh8xkwsKHzGUCwofMZULCh8xlgsKHzGXCwofMZgLCh8xmQsKHzGaCwofMZsLCh8xnAsKHzGdCwofMZ4LCh8xnwsKHzGgCwofMaELCh8xogsKHzGjCwofMaQLCh8xpQsKHzGmCwofMacLCh8xqAsKHzGpCwofMaoLCh8xqwsKHzGsCwofMa0LCh8xrgsKHzGvCwofMbALCh8xsQsKHzGyCwofMbMLCh8xtAsKHzG1CwofMbYLCh8xtwsKHzG4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwovMjHkDAkfMrgLCh8yuAsKHzK4CwofMrgLCi8yMeQMCR8yuAsKHzK4CwofMrgLCi8yMiwBCg+4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCi8yN+wTCR8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKHzK4CwofMrgLCh8yuAsKLzI5RBYJHzK4CwofMrgLCh8yuAsKHzK4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM3AXCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKLzMyyBkJHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwovMzVoEAkfM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwovMzY0CAkfM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh8zuAsKHzO4CwofM7gLCh80uAsKHzS4CwofNLgLCh80KCMKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKLzQylBEJHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCi80M6wmCS80MzQICR80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKLzQ0sAQKD7gLCh80uAsKLzQ0EA4JHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwovNDjcBQoPuAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh80uAsKHzS4CwofNLgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwovNTH8IQkfNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwovNTQQDgkfNbgLCh81uAsKHzW4CwofNXAXCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNbgLCh81uAsKHzW4CwofNrgLCh82uAsKHza4CwofNrgLCi82MBAOCR82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwovNjI0CAkfNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKPzY0MJhJCB82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKLzY1kDMJHza4CwofNrgLCi82NlgCCg+4CwofNrgLCh82uAsKHza4CwovNjb0GgkfNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh82uAsKHza4CwofNrgLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwovNzLQIAkfN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwovNzP8IQkfN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCi83N+wTCR83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHze4CwofN7gLCh83uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHziYOgofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwovODVEFgkfOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKLzg3lBEJHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCi84NzQICg+4CwofOLgLCh84uAsKLzg4LAEKD7gLCh84uAsKHzi4CwofOLgLCi84ONgnCR84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofOLgLCh84uAsKHzi4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKHzm4CwofObgLCh85uAsKDyQlCQ+2NgkP0CkJD1YLCQ84GAkP1g4JD+QcCg9AKAgPTAsJD3YMCQ/xCAofMRoBCQ/vCAoP7ggKD+0ICg/sCAoP6wgKD+oICg/pCAoP6AgKD+cICg/mCAoP5QgKD+QICg/jCAoP4ggKD+EICg/gCAoP3wgKD94ICg/dCAoP3AgKD9sICg/aCAoP2QgKD9gICg/XCAoP1ggKD9UICg/UCAoP0wgKD9IICg/RCAoP0AgKD88ICg/OCAoPzQgKD8wICg/LCAoPyggKD8kICg/ICAoPxwgKD8YICg/FCAoPxAgKD8MICg/CCAoPwQgKD8AICg+/CAoPvggKD70ICg+8CAoPuwgKD7oICg+5CAoPuAgKD7cICg+2CAoPtQgKD7QICg+zCAoPsggKD7EICg+wCAoPrwgKD2YUCg9lFAoPZBQLDwcJCQ9iFAsPCQkJD2AUCw8LCQkPXhQLDw0JCQ9cFAwPKwkJDxAJCQ9ZFAofORAJCQ9XFAofOSwKCQ9VFAoPVBQKHzkiAQkfOXIwCQ9RFAoPUBQKHzFQFAofMVAUCh8xUBQKDxBy/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7FQIGEgcmVJAAAAD/L/AA8g5P//////////////////////////////////////////////////////////////////////////////LlB0ZXh0CgAAAABCRD0Y';

export const LZMA_VECTORS: { name: string; hex: string; text: string }[] = [
  // CyberChef "LZMA decompress: string" (lzma -z -6)
  {
    name: 'cyberchef',
    hex: '5d00008000ffffffffffffffff002a1a08a202b1a4b814b912c94c4152e1641907d3fd8cd903ffff4fec0000',
    text: CAT,
  },
  // printf café | lzma -z -6: CyberChef returns Latin-1 bytes for this one
  { name: 'utf-8', hex: '5d00008000ffffffffffffffff003198490d4a511823fffffde1a000', text: 'café' },
];

// CyberChef "LZMA decompress: binary": bytes 00 to 10
export const LZMA_BINARY = '5d00008000ffffffffffffffff00000052500a84f99bb28021a969d627e03e8a922effffbd160000';

export const BZIP2_VECTORS: { name: string; hex: string; text: string }[] = [
  // CyberChef "Bzip2 decompress"
  {
    name: 'cyberchef',
    hex: '425a6839314159265359b218ed630000031380400104002a438c00200021a9ea601a10003202185d5ed68ca6442f1e177245385090b218ed63',
    text: CAT,
  },
  // bzip2 -9 (1.0.8)
  {
    name: 'bzip2 -9',
    hex: '425a6839314159265359b218ed630000031380400104002a438c00200021a68261a840d0342821a65675f0db844263f177245385090b218ed630',
    text: CAT,
  },
  // Two streams in a row, as pbzip2 writes or `cat a.bz2 b.bz2` makes. CyberChef stops after the first one.
  {
    name: 'two streams',
    hex: '425a6839314159265359b218ed630000031380400104002a438c00200021a68261a840d0342821a65675f0db844263f177245385090b218ed630425a6839314159265359342f46cf00000015804001200006c184002000221a32681003004a2c3dee6bc5dc914e14240d0bd1b3c0',
    text: `${CAT} And the dog.`,
  },
  // printf '' | bzip2
  { name: 'empty', hex: '425a683917724538509000000000', text: '' },
];

// head -c 20000000 /dev/zero | bzip2 -9: more than the 10 MB that CyberChef can output
export const BZIP2_ZEROS =
  '425a6839314159265359bfcaafc400992fc200c00000080008200030cc0529a6aa91146c0288a3c5dc914e14242ff2abf100';
