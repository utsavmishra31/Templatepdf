import type { SheetData } from "@/lib/xlsx";

type PdfTextItem = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

type PdfTextContent = {
  items: PdfTextItem[];
};

type PdfJsPageProxy = {
  getTextContent: () => Promise<PdfTextContent>;
};

type PdfJsDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
};

type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: ArrayBuffer }) => {
    promise: Promise<PdfJsDocumentProxy>;
  };
};

type PositionedItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PdfTableExtractionResult = {
  sheets: SheetData[];
  /** True when at least one page produced a multi-column grid (a likely table). */
  tableDetected: boolean;
  totalTextItems: number;
};

const MAX_PAGES = 500;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/** Group items that share a baseline into visual rows, ordered top to bottom. */
function groupIntoRows(
  items: PositionedItem[],
  tolerance: number,
): PositionedItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y);
  const rows: PositionedItem[][] = [];
  let current: PositionedItem[] = [];
  let currentY: number | null = null;

  for (const item of sorted) {
    if (currentY === null || Math.abs(item.y - currentY) <= tolerance) {
      current.push(item);
      // Track the running baseline as the average of the row so far.
      currentY =
        currentY === null
          ? item.y
          : (currentY * (current.length - 1) + item.y) / current.length;
    } else {
      rows.push(current);
      current = [item];
      currentY = item.y;
    }
  }
  if (current.length > 0) rows.push(current);

  return rows;
}

/**
 * Detect column separator positions from vertical whitespace gutters.
 *
 * Items wider than half the content width (titles, full-width paragraph lines)
 * are excluded from the coverage map so they cannot bridge real column gutters
 * in a table sitting below them.
 */
function detectColumnBoundaries(
  items: PositionedItem[],
  medianHeight: number,
): number[] {
  if (items.length === 0) return [];

  const minX = Math.min(...items.map((item) => item.x));
  const maxX = Math.max(...items.map((item) => item.x + item.width));
  const contentWidth = maxX - minX;
  if (contentWidth <= 0) return [];

  const wideItemLimit = contentWidth * 0.5;
  const binSize = 1; // 1pt resolution
  const binCount = Math.ceil(contentWidth / binSize) + 1;
  const covered = new Array<boolean>(binCount).fill(false);

  for (const item of items) {
    if (item.width > wideItemLimit) continue;
    const startBin = Math.max(0, Math.floor((item.x - minX) / binSize));
    const endBin = Math.min(
      binCount - 1,
      Math.ceil((item.x + item.width - minX) / binSize),
    );
    for (let bin = startBin; bin <= endBin; bin += 1) {
      covered[bin] = true;
    }
  }

  // A gutter must be clearly wider than typical inter-word spacing (~0.9em).
  const gapThreshold = Math.max(4, medianHeight * 0.9);
  const boundaries: number[] = [];
  let gapStart: number | null = null;

  for (let bin = 0; bin < binCount; bin += 1) {
    if (!covered[bin]) {
      if (gapStart === null) gapStart = bin;
    } else if (gapStart !== null) {
      const gapWidth = (bin - gapStart) * binSize;
      if (gapWidth >= gapThreshold) {
        const gapCenter = minX + ((gapStart + bin) / 2) * binSize;
        boundaries.push(gapCenter);
      }
      gapStart = null;
    }
  }

  return boundaries;
}

/** Assign an x position to a column index given sorted boundary cut positions. */
function columnIndexFor(x: number, boundaries: number[]): number {
  let index = 0;
  while (index < boundaries.length && x >= boundaries[index]) {
    index += 1;
  }
  return index;
}

function buildPageGrid(items: PositionedItem[]): string[][] {
  if (items.length === 0) return [];

  const medianHeight = median(items.map((item) => item.height)) || 10;
  const rowTolerance = Math.max(2, medianHeight * 0.6);
  const rows = groupIntoRows(items, rowTolerance);
  const boundaries = detectColumnBoundaries(items, medianHeight);
  const columnCount = boundaries.length + 1;

  // Determine typical row spacing to detect section/table separations.
  const rowBaselines = rows.map(
    (row) => row.reduce((sum, item) => sum + item.y, 0) / row.length,
  );
  const rowGaps: number[] = [];
  for (let i = 1; i < rowBaselines.length; i += 1) {
    rowGaps.push(rowBaselines[i - 1] - rowBaselines[i]);
  }
  const medianRowGap = median(rowGaps) || medianHeight;
  const bigGap = medianRowGap * 1.8;

  const grid: string[][] = [];

  rows.forEach((row, rowIndex) => {
    if (rowIndex > 0) {
      const gap = rowBaselines[rowIndex - 1] - rowBaselines[rowIndex];
      if (gap > bigGap) grid.push([]);
    }

    const cells: string[][] = Array.from({ length: columnCount }, () => []);
    const ordered = [...row].sort((a, b) => a.x - b.x);
    for (const item of ordered) {
      const center = item.x + item.width / 2;
      const columnIndex = columnIndexFor(center, boundaries);
      cells[columnIndex].push(item.text);
    }

    const rowValues = cells.map((cellItems) =>
      cellItems.join(" ").replace(/\s+/g, " ").trim(),
    );

    if (rowValues.some((value) => value !== "")) {
      grid.push(rowValues);
    }
  });

  return trimTrailingEmptyColumns(grid);
}

/** Remove columns that are empty across every row to keep the sheet tidy. */
function trimTrailingEmptyColumns(grid: string[][]): string[][] {
  let maxColumns = 0;
  for (const row of grid) {
    for (let col = row.length - 1; col >= 0; col -= 1) {
      if (row[col] && row[col].trim() !== "") {
        maxColumns = Math.max(maxColumns, col + 1);
        break;
      }
    }
  }
  if (maxColumns === 0) return grid.map(() => []);
  return grid.map((row) => row.slice(0, maxColumns));
}

/**
 * Extract tabular data from every page of a PDF and return one sheet per page.
 *
 * Runs entirely in the browser via pdf.js text extraction and geometric
 * row/column reconstruction — works for bordered ("lattice") and
 * whitespace-separated ("stream") tables alike. Scanned/image-only PDFs have no
 * extractable text and will yield an empty result.
 */
export async function extractPdfTables(
  sourceBuffer: ArrayBuffer,
): Promise<PdfTableExtractionResult> {
  const pdfjs = (await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  )) as unknown as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjs.getDocument({ data: sourceBuffer.slice(0) }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);

  const sheets: SheetData[] = [];
  let tableDetected = false;
  let totalTextItems = 0;

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const items: PositionedItem[] = [];
    for (const item of textContent.items) {
      const text = (item.str ?? "").replace(/\s+/g, " ");
      if (text.trim() === "") continue;
      const x = item.transform[4];
      const y = item.transform[5];
      const height = item.height || Math.abs(item.transform[3]) || 10;
      const width = item.width || text.length * height * 0.5;
      items.push({ text, x, y, width, height });
    }

    totalTextItems += items.length;
    const grid = buildPageGrid(items);
    const columnsOnPage = grid.reduce((max, row) => Math.max(max, row.length), 0);
    if (columnsOnPage > 1) tableDetected = true;

    sheets.push({ name: `Page ${pageNumber}`, rows: grid });
  }

  return { sheets, tableDetected, totalTextItems };
}
