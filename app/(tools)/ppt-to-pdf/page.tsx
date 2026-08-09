"use client";

import { PptToPdfPanel } from "@/components/editor/pdf-tools/PptToPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { usePptToPdfTool } from "@/hooks/usePptToPdfTool";

const PptIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <circle cx="10" cy="13" r="2"/>
    <path d="M10 15v4"/>
  </svg>
);

export default function PptToPdfPage() {
  const tool = usePptToPdfTool();

  if (!tool.pptToPdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,.ppt,.pptx"
        label="Upload a PPT"
        hint="PPT and PPTX files only"
        icon={PptIcon}
        isBusy={tool.isPptToPdfBusy}
        status={tool.pptToPdfStatus}
        statusType={tool.pptToPdfStatusType}
        onChange={tool.handleUploadPptToPdf}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <PptToPdfPanel
        pptToPdfName={tool.pptToPdfName}
        pptToPdfBuffer={tool.pptToPdfBuffer}
        pptToPdfStatus={tool.pptToPdfStatus}
        pptToPdfStatusType={tool.pptToPdfStatusType}
        isPptToPdfBusy={tool.isPptToPdfBusy}
        isBusy={false}
        pptToPdfResultName={tool.pptToPdfResultName}
        pptToPdfResultBuffer={tool.pptToPdfResultBuffer}
        onUploadPptToPdf={tool.handleUploadPptToPdf}
        onClearPptToPdf={tool.clearPptToPdf}
        onConvertPptToPdf={tool.handleConvertPptToPdf}
        onDownloadPptToPdf={tool.handleDownloadPptToPdf}
      />
    </div>
  );
}
