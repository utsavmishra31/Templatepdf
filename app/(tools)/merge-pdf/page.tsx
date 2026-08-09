"use client";

import { MergePdfPanel } from "@/components/editor/pdf-tools/MergePdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useMergePdfTool } from "@/hooks/useMergePdfTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6H3v12h5"/>
    <path d="M16 6h5v12h-5"/>
    <path d="M12 3v18"/>
  </svg>
);

export default function MergePdfPage() {
  const tool = useMergePdfTool();

  if (tool.mergePdfFiles.length === 0) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Add PDF Files"
        hint="Select one or more PDF files to start merging"
        icon={PdfIcon}
        isBusy={tool.isMergePdfBusy}
        status={tool.mergePdfStatus}
        statusType={tool.mergePdfStatusType}
        multiple
        onChange={tool.handleAddMergePdfFiles}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <MergePdfPanel
        mergePdfFiles={tool.mergePdfFiles.map((f) => ({
          name: f.name,
          firstPageSrc: f.firstPageSrc,
          pageCount: f.pageCount,
        }))}
        mergePdfResultBuffer={tool.mergePdfResultBuffer}
        mergePdfResultName={tool.mergePdfResultName}
        mergePdfStatus={tool.mergePdfStatus}
        mergePdfStatusType={tool.mergePdfStatusType}
        isMergePdfBusy={tool.isMergePdfBusy}
        isAddingFiles={tool.isAddingFiles}
        isBusy={false}
        onAddMergePdfFiles={tool.handleAddMergePdfFiles}
        onRemoveMergePdfFile={tool.handleRemoveMergePdfFile}
        onMoveMergePdfFile={tool.handleMoveMergePdfFile}
        onMergePdfs={tool.handleMergePdfs}
        onClearMergePdf={tool.clearMergePdf}
        onDownloadMergedPdf={tool.handleDownloadMergedPdf}
      />
    </div>
  );
}
