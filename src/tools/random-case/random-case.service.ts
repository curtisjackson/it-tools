// Ported from omni-tools (MIT) v0.7.0: src/pages/tools/string/randomize-case/service.ts

/** Upper- or lower-cases each character at random. `random` is injectable for tests. */
export function randomizeCase(input: string, random: () => number = Math.random): string {
  return Array.from(input, (char) => (random() < 0.5 ? char.toLowerCase() : char.toUpperCase())).join('');
}

/** aLtErNaTiNg case, counting letters only so spaces and punctuation do not break the pattern. */
export function alternateCase(input: string, startUpper = false): string {
  let upper = startUpper;
  return Array.from(input, (char) => {
    if (char.toLowerCase() === char.toUpperCase()) {
      return char;
    }
    const result = upper ? char.toUpperCase() : char.toLowerCase();
    upper = !upper;
    return result;
  }).join('');
}
