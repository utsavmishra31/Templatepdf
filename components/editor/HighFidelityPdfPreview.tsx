"use client";

import { useEffect, useRef, useState } from "react";

type PdfJsViewport = {
  width: number;
  height: number;
};

type PdfJsPageProxy = {
  getViewport: (options: { scale: number }) => PdfJsViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
  }) => { promise: Promise<void> };
};

type PdfJsDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPageProxy>;
  cleanup?: () => void;
};

type PdfJsModule = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: ArrayBuffer }) => { promise: Promise<PdfJsDocumentProxy> };
};

type Props = {
  sourceBuffer: ArrayBuffer;
  renderKey: number;
};

export function HighFidelityPdfPreview({ sourceBuffer, renderKey }: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function drawPdf() {
      const pagesRoot = pagesRef.current;
      const shell = shellRef.current;
      if (!pagesRoot || !shell) return;

      setIsLoading(true);
      setError("");
      pagesRoot.replaceChildren();

      try {
        const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsModule;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjs.getDocument({ data: sourceBuffer.slice(0) }).promise;

        // Oversample aggressively to keep text sharp on zoomed/retina displays.
        const dprBoost = Math.max(2, Math.min(4, window.devicePixelRatio * 1.8));
        const availableWidth = Math.max(360, Math.min(1120, shell.clientWidth - 32));

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (isCancelled) return;

          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = availableWidth / baseViewport.width;
          const cssViewport = page.getViewport({ scale: cssScale });
          const renderViewport = page.getViewport({ scale: cssScale * dprBoost });

          const section = document.createElement("section");
          section.className =
            "rounded-md border border-slate-300 bg-white p-2 shadow-[0_6px_22px_rgba(15,23,42,0.12)]";

          const label = document.createElement("div");
          label.className =
            "mb-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-slate-500";
          label.textContent = `Page ${pageNumber}`;

          const canvas = document.createElement("canvas");
          canvas.className = "block w-full rounded-sm";
          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          canvas.style.width = `${cssViewport.width}px`;
          canvas.style.height = `${cssViewport.height}px`;

          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Canvas rendering is unavailable in this browser.");

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);

          section.appendChild(label);
          section.appendChild(canvas);
          pagesRoot.appendChild(section);

          await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        }

        pdf.cleanup?.();
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Unable to render document preview.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    drawPdf();

    return () => {
      isCancelled = true;
    };
  }, [sourceBuffer, renderKey]);

  return (
    <div ref={shellRef} className="mx-auto w-full max-w-[1140px] px-5 py-6">
      {isLoading ? (
        <div className="py-20 text-center text-sm font-semibold text-slate-500">Rendering high-fidelity preview...</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      <div ref={pagesRef} className="space-y-5" />
    </div>
  );
}
