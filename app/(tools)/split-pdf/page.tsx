"use client";

import { SplitPdfPanel } from "@/components/editor/pdf-tools/SplitPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useSplitPdfTool } from "@/hooks/useSplitPdfTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5"/>
    <path d="M8 3H3v5"/>
    <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/>
    <path d="M21 3l-7.828 7.828"/>
  </svg>
);

export default function SplitPdfPage() {
  const tool = useSplitPdfTool();

  if (!tool.splitPdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isSplitPdfBusy}
        status={tool.splitPdfStatus}
        statusType={tool.splitPdfStatusType}
        onChange={tool.handleUploadSplitPdf}
      />
    );
  }

  return (
    <div className="animate-step-in rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
      <SplitPdfPanel
        splitPdfName={tool.splitPdfName}
        splitPdfBuffer={tool.splitPdfBuffer}
        splitPdfPreviews={tool.splitPdfPreviews}
        splitNumOutputs={tool.splitNumOutputs}
        splitRanges={tool.splitRanges}
        splitPdfStatus={tool.splitPdfStatus}
        splitPdfStatusType={tool.splitPdfStatusType}
        isSplitPdfBusy={tool.isSplitPdfBusy}
        isBusy={false}
        onUploadSplitPdf={tool.handleUploadSplitPdf}
        onClearSplitPdf={tool.clearSplitPdf}
        onSplitNumOutputsChange={tool.handleSplitNumOutputsChange}
        onSplitRangeChange={tool.handleSplitRangeChange}
        onGenerateSplit={tool.handleGenerateSplit}
      />
    </div>
  );
}
