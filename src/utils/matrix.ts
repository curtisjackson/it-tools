// Ported from omni-tools (MIT) v0.7.0: src/utils/array.ts

/** Transposes a 2D array. Rows shorter than the longest one yield `undefined` cells. */
export function transpose<T>(matrix: T[][]): (T | undefined)[][] {
  const width = Math.max(0, ...matrix.map((row) => row.length));
  return Array.from({ length: width }, (_, colIndex) => matrix.map((row) => row[colIndex]));
}

/** Pads every row with `fillValue` up to `desiredLength`, or to the length of the longest row. */
export function normalizeAndFill<T>(matrix: T[][], fillValue: T, desiredLength?: number): T[][] {
  const maxLength = desiredLength || Math.max(0, ...matrix.map((row) => row.length));
  return matrix.map((row) => [...row, ...Array.from({ length: Math.max(0, maxLength - row.length) }, () => fillValue)]);
}
