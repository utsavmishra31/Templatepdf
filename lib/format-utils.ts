export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function parseSplitRange(rangeStr: string, maxPages: number): number[] {
  const pages = new Set<number>();
  rangeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map((s) => parseInt(s.trim(), 10));
        if (Number.isFinite(a) && Number.isFinite(b)) {
          for (
            let p = Math.min(a, b);
            p <= Math.max(a, b) && p <= maxPages;
            p++
          ) {
            if (p >= 1) pages.add(p);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (Number.isFinite(p) && p >= 1 && p <= maxPages) pages.add(p);
      }
    });
  return Array.from(pages).sort((a, b) => a - b);
}

export function autoDistributeSplitRanges(
  numOutputs: number,
  totalPages: number,
): string[] {
  if (totalPages === 0 || numOutputs === 0) return Array(numOutputs).fill("");
  const perOutput = totalPages / numOutputs;
  return Array.from({ length: numOutputs }, (_, i) => {
    const start = Math.floor(i * perOutput) + 1;
    const end =
      i === numOutputs - 1
        ? totalPages
        : Math.floor((i + 1) * perOutput);
    return start === end ? String(start) : `${start}-${end}`;
  });
}
