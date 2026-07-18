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

export async function renderPdfPagePreviews(sourceBuffer: ArrayBuffer): Promise<string[]> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: sourceBuffer.slice(0) });
  const pdf = await loadingTask.promise;
  const previews: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.75 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas rendering is unavailable in this browser.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;
    previews.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  return previews;
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
