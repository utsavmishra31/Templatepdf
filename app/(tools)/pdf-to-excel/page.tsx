"use client";

import { PdfToExcelPanel } from "@/components/editor/pdf-tools/PdfToExcelPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { usePdfToExcelTool } from "@/hooks/usePdfToExcelTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function PdfToExcelPage() {
  const tool = usePdfToExcelTool();

  if (!tool.pdfToExcelBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isPdfToExcelBusy}
        status={tool.pdfToExcelStatus}
        statusType={tool.pdfToExcelStatusType}
        onChange={tool.handleUploadPdfToExcel}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <PdfToExcelPanel
        pdfToExcelName={tool.pdfToExcelName}
        pdfToExcelBuffer={tool.pdfToExcelBuffer}
        pdfToExcelPreviews={tool.pdfToExcelPreviews}
        pdfToExcelResultBlob={tool.pdfToExcelResultBlob}
        pdfToExcelResultName={tool.pdfToExcelResultName}
        pdfToExcelStatus={tool.pdfToExcelStatus}
        pdfToExcelStatusType={tool.pdfToExcelStatusType}
        isPdfToExcelBusy={tool.isPdfToExcelBusy}
        isBusy={false}
        onUploadPdfToExcel={tool.handleUploadPdfToExcel}
        onClearPdfToExcel={tool.clearPdfToExcel}
        onConvertPdfToExcel={tool.handleConvertPdfToExcel}
        onDownloadPdfToExcel={tool.handleDownloadPdfToExcel}
      />
    </div>
  );
}
