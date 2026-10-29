# GOST digests (vendored)

`gostDigest.mjs`, `gostCipher.mjs` and `gostRandom.mjs` from CyberChef (Apache-2.0) v11.5.0, `src/core/vendor/gost/`:
the GOST R 34.11-94 and GOST R 34.11-2012 (Streebog) implementation of Rudolf Nickolaev (Apache-2.0), with the Streebog
code converted from https://www.streebog.net/ (Copyright (c) 2013, Alexey Degtyarev, BSD-style notice in the files).
Used by `legacy-hashes`.

The only change: `import crypto from 'crypto'` (a Node module that CyberChef's webpack build replaces) is replaced by
`globalThis.crypto`, the Web Crypto API of the browser. It is only used for random numbers, not for the digests.
