"use client";

import { DeletePdfPagesPanel } from "@/components/editor/pdf-tools/DeletePdfPagesPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { usePdfDeleteTool } from "@/hooks/usePdfDeleteTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function PdfDeletePage() {
  const tool = usePdfDeleteTool();

  if (!tool.uploadedPdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isPdfBusy}
        status={tool.pdfStatus}
        statusType={tool.pdfStatusType}
        onChange={tool.handleUploadPdf}
      />
    );
  }

  return (
    <div className="animate-step-in rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
      <DeletePdfPagesPanel
        uploadedPdfName={tool.uploadedPdfName}
        uploadedPdfBuffer={tool.uploadedPdfBuffer}
        uploadedPdfPreviews={tool.uploadedPdfPreviews}
        selectedPdfPages={tool.selectedPdfPages}
        pdfStatus={tool.pdfStatus}
        pdfStatusType={tool.pdfStatusType}
        isPdfBusy={tool.isPdfBusy}
        isBusy={false}
        onUploadPdf={tool.handleUploadPdf}
        onClearPdf={tool.clearUploadedPdf}
        onDeleteSelectedPages={tool.handleDeleteSelectedPdfPages}
        onTogglePageSelection={tool.togglePdfPageSelection}
        onDownloadPdf={tool.handleDownloadPdf}
      />
    </div>
  );
}
