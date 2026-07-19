"use client";

import { RearrangePdfPanel } from "@/components/editor/pdf-tools/RearrangePdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useRearrangePdfTool } from "@/hooks/useRearrangePdfTool";

const RearrangeIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l4-4 4 4" />
    <path d="M7 5v14" />
    <path d="M21 15l-4 4-4-4" />
    <path d="M17 19V5" />
  </svg>
);

export default function RearrangePdfPage() {
  const tool = useRearrangePdfTool();

  if (!tool.rearrangePdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={RearrangeIcon}
        isBusy={tool.isRearrangePdfBusy}
        status={tool.rearrangePdfStatus}
        statusType={tool.rearrangePdfStatusType}
        onChange={tool.handleUploadRearrangePdf}
      />
    );
  }

  return (
    <div className="animate-step-in rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
      <RearrangePdfPanel
        rearrangePdfName={tool.rearrangePdfName}
        rearrangePdfBuffer={tool.rearrangePdfBuffer}
        rearrangePages={tool.rearrangePages}
        rearrangePdfResultBuffer={tool.rearrangePdfResultBuffer}
        rearrangePdfResultName={tool.rearrangePdfResultName}
        rearrangePdfStatus={tool.rearrangePdfStatus}
        rearrangePdfStatusType={tool.rearrangePdfStatusType}
        isRearrangePdfBusy={tool.isRearrangePdfBusy}
        isBusy={false}
        onUploadRearrangePdf={tool.handleUploadRearrangePdf}
        onClearRearrangePdf={tool.clearRearrangePdf}
        onMoveRearrangePage={tool.moveRearrangePage}
        onDeleteRearrangePage={tool.deleteRearrangePage}
        onRotateRearrangePage={tool.rotateRearrangePage}
        onSwapRearrangePages={tool.swapRearrangePages}
        onSortRearrangePages={tool.sortRearrangePages}
        onUndo={tool.undoRearrange}
        onRedo={tool.redoRearrange}
        canUndo={tool.canUndo}
        canRedo={tool.canRedo}
        onApplyRearrange={tool.handleApplyRearrange}
        onDownloadRearrangedPdf={tool.handleDownloadRearrangedPdf}
      />
    </div>
  );
}
