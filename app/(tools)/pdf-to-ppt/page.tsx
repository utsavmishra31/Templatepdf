"use client";

import { PdfToPptPanel } from "@/components/editor/pdf-tools/PdfToPptPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { usePdfToPptTool } from "@/hooks/usePdfToPptTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function PdfToPptPage() {
  const tool = usePdfToPptTool();

  if (!tool.pdfToPptBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isPdfToPptBusy}
        status={tool.pdfToPptStatus}
        statusType={tool.pdfToPptStatusType}
        onChange={tool.handleUploadPdfToPpt}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <PdfToPptPanel
        pdfToPptName={tool.pdfToPptName}
        pdfToPptBuffer={tool.pdfToPptBuffer}
        pdfToPptPreviews={tool.pdfToPptPreviews}
        pdfToPptResultBuffer={tool.pdfToPptResultBuffer}
        pdfToPptResultName={tool.pdfToPptResultName}
        pdfToPptStatus={tool.pdfToPptStatus}
        pdfToPptStatusType={tool.pdfToPptStatusType}
        isPdfToPptBusy={tool.isPdfToPptBusy}
        isBusy={false}
        onUploadPdfToPpt={tool.handleUploadPdfToPpt}
        onConvertPdfToPpt={tool.handleConvertPdfToPpt}
        onDownloadPdfToPpt={tool.handleDownloadPdfToPpt}
      />
    </div>
  );
}
