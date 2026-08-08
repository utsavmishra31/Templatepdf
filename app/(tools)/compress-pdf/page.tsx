"use client";

import { CompressPdfPanel } from "@/components/editor/pdf-tools/CompressPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useCompressPdfTool } from "@/hooks/useCompressPdfTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <polyline points="4 14 10 14 10 20"/>
    <polyline points="20 10 14 10 14 4"/>
  </svg>
);

export default function CompressPdfPage() {
  const tool = useCompressPdfTool();

  if (!tool.compressPdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isCompressPdfBusy}
        status={tool.compressPdfStatus}
        statusType={tool.compressPdfStatusType}
        onChange={tool.handleUploadCompressPdf}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <CompressPdfPanel
        compressPdfName={tool.compressPdfName}
        compressPdfBuffer={tool.compressPdfBuffer}
        compressPdfOriginalSize={tool.compressPdfOriginalSize}
        compressPdfResultBuffer={tool.compressPdfResultBuffer}
        compressPdfResultName={tool.compressPdfResultName}
        compressPdfResultSize={tool.compressPdfResultSize}
        compressPdfStatus={tool.compressPdfStatus}
        compressPdfStatusType={tool.compressPdfStatusType}
        compressPdfFirstPage={tool.compressPdfFirstPage}
        compressMode={tool.compressMode}
        isCompressPdfBusy={tool.isCompressPdfBusy}
        isBusy={false}
        onUploadCompressPdf={tool.handleUploadCompressPdf}
        onClearCompressPdf={tool.clearCompressPdf}
        onCompressModeChange={tool.setCompressMode}
        onCompressPdf={tool.handleCompressPdf}
        onDownloadCompressedPdf={tool.handleDownloadCompressedPdf}
      />
    </div>
  );
}
