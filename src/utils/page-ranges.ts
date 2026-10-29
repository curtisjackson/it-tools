// Ported from omni-tools (MIT) v0.7.0: parsePageRanges from src/pages/tools/pdf/rotate-pdf/service.ts

/** `1,3-5,7` → `[1, 3, 4, 5, 7]`, limited to 1…`totalPages`; an empty string selects every page. */
export function parsePageRanges(pageRangeStr: string, totalPages: number): number[] {
  if (!pageRangeStr.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>();
  for (const range of pageRangeStr.split(',').map((part) => part.trim())) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map((part) => Number(part.trim() || Number.NaN));
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = Math.max(1, Math.min(start, end)); i <= Math.min(totalPages, Math.max(start, end)); i++) {
          pages.add(i);
        }
      }
    } else {
      const page = Number.parseInt(range, 10);
      if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }
  return [...pages].sort((a, b) => a - b);
}
