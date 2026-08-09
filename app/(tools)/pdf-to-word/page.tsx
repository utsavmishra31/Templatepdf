"use client";

import { PdfToWordPanel } from "@/components/editor/pdf-tools/PdfToWordPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { usePdfToWordTool } from "@/hooks/usePdfToWordTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function PdfToWordPage() {
  const tool = usePdfToWordTool();

  if (!tool.pdfToWordBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isPdfToWordBusy}
        status={tool.pdfToWordStatus}
        statusType={tool.pdfToWordStatusType}
        onChange={tool.handleUploadPdfToWord}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <PdfToWordPanel
        pdfToWordName={tool.pdfToWordName}
        pdfToWordBuffer={tool.pdfToWordBuffer}
        pdfToWordPreviews={tool.pdfToWordPreviews}
        pdfToWordResultBuffer={tool.pdfToWordResultBuffer}
        pdfToWordResultName={tool.pdfToWordResultName}
        pdfToWordStatus={tool.pdfToWordStatus}
        pdfToWordStatusType={tool.pdfToWordStatusType}
        isPdfToWordBusy={tool.isPdfToWordBusy}
        isBusy={false}
        onUploadPdfToWord={tool.handleUploadPdfToWord}
        onClearPdfToWord={tool.clearPdfToWord}
        onConvertPdfToWord={tool.handleConvertPdfToWord}
        onDownloadPdfToWord={tool.handleDownloadPdfToWord}
      />
    </div>
  );
}
