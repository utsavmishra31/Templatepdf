"use client";

import { RotatePdfPanel } from "@/components/editor/pdf-tools/RotatePdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useRotatePdfTool } from "@/hooks/useRotatePdfTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2v6h-6"/>
    <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
  </svg>
);

export default function RotatePdfPage() {
  const tool = useRotatePdfTool();

  if (!tool.rotatePdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isRotatePdfBusy}
        status={tool.rotatePdfStatus}
        statusType={tool.rotatePdfStatusType}
        onChange={tool.handleUploadRotatePdf}
      />
    );
  }

  return (
    <div className="animate-step-in rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
      <RotatePdfPanel
        rotatePdfName={tool.rotatePdfName}
        rotatePdfBuffer={tool.rotatePdfBuffer}
        rotatePdfPreviews={tool.rotatePdfPreviews}
        rotatePdfResultBuffer={tool.rotatePdfResultBuffer}
        rotatePdfResultName={tool.rotatePdfResultName}
        rotatePdfStatus={tool.rotatePdfStatus}
        rotatePdfStatusType={tool.rotatePdfStatusType}
        isRotatePdfBusy={tool.isRotatePdfBusy}
        isBusy={false}
        onUploadRotatePdf={tool.handleUploadRotatePdf}
        onClearRotatePdf={tool.clearRotatePdf}
        onRotatePage={tool.handleRotatePage}
        onRotateAllPages={tool.handleRotateAllPages}
        onDownloadRotatedPdf={tool.handleDownloadRotatedPdf}
      />
    </div>
  );
}
