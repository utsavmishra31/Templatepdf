type PdfJsViewport = {
  width: number;
  height: number;
};

type PdfJsPageProxy = {
  getViewport: (options: { scale: number }) => PdfJsViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => { promise: Promise<void> };
};

type PdfJsDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
};

type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: ArrayBuffer }) => { promise: Promise<PdfJsDocumentProxy> };
};

async function renderOnePage(pdf: PdfJsDocumentProxy, pageNumber: number): Promise<string> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 0.75 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function renderSinglePdfPage(
  sourceBuffer: ArrayBuffer,
  pageNumber: number,
): Promise<string> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const pdf = await pdfjs.getDocument({ data: sourceBuffer.slice(0) }).promise;
  return renderOnePage(pdf, pageNumber);
}

export async function renderPdfPagePreviews(sourceBuffer: ArrayBuffer): Promise<string[]> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: sourceBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  const previews: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    previews.push(await renderOnePage(pdf, pageNumber));
  }

  return previews;
}

export async function compressPdfToBuffer(
  sourceBuffer: ArrayBuffer,
  level: "extreme" | "recommended" | "less",
): Promise<Uint8Array> {
  const LEVELS = {
    extreme:     { scale: 1.0, jpegQuality: 0.40 },
    recommended: { scale: 1.5, jpegQuality: 0.70 },
    less:        { scale: 2.0, jpegQuality: 0.88 },
  } as const;
  const { scale, jpegQuality } = LEVELS[level];

  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const { PDFDocument } = await import("pdf-lib");

  const pdf = await pdfjs.getDocument({ data: sourceBuffer.slice(0) }).promise;
  const newPdf = await PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable in this browser.");

    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
    const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const jpegBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const jpegImage = await newPdf.embedJpg(jpegBytes);
    const newPage = newPdf.addPage([canvas.width, canvas.height]);
    newPage.drawImage(jpegImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
  }

  return newPdf.save({ useObjectStreams: true });
}

export async function deletePdfPages(sourceBuffer: ArrayBuffer, selectedPages: number[]) {
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(sourceBuffer.slice(0));
  const totalPages = source.getPageCount();

  if (selectedPages.length >= totalPages) {
    throw new Error("You cannot delete all pages. Keep at least one page.");
  }

  const deleteSet = new Set(selectedPages);
  const keepIndices = Array.from({ length: totalPages }, (_, index) => index).filter((index) => !deleteSet.has(index + 1));

  const nextPdf = await PDFDocument.create();
  const copiedPages = await nextPdf.copyPages(source, keepIndices);
  copiedPages.forEach((page) => nextPdf.addPage(page));

  const bytes = await nextPdf.save();
  const byteCopy = new Uint8Array(bytes);
  const nextBuffer = new ArrayBuffer(byteCopy.byteLength);
  new Uint8Array(nextBuffer).set(byteCopy);

  return {
    bytes: byteCopy,
    nextBuffer,
    removedCount: deleteSet.size,
  };
}
