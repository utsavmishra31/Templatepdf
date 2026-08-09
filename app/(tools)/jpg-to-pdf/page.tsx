"use client";

import { JpgToPdfPanel } from "@/components/editor/pdf-tools/JpgToPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useJpgToPdfTool } from "@/hooks/useJpgToPdfTool";

const ImageIcon = (
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
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

export default function JpgToPdfPage() {
  const tool = useJpgToPdfTool();

  if (tool.images.length === 0) {
    return (
      <ToolUploadCard
        accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
        label="Add Images"
        hint="JPG and PNG files supported"
        icon={ImageIcon}
        isBusy={tool.isBusy}
        status={tool.status}
        statusType={tool.statusType}
        multiple
        onChange={tool.handleAddImages}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <JpgToPdfPanel
        images={tool.images}
        orientation={tool.orientation}
        pageSize={tool.pageSize}
        resultBuffer={tool.resultBuffer}
        status={tool.status}
        statusType={tool.statusType}
        isBusy={tool.isBusy}
        onOrientationChange={tool.setOrientation}
        onPageSizeChange={tool.setPageSize}
        onAddImages={tool.handleAddImages}
        onRemoveImage={tool.removeImage}
        onMoveImage={tool.moveImage}
        onClearAll={tool.clearAll}
        onGeneratePdf={tool.handleGeneratePdf}
        onDownload={tool.handleDownload}
      />
    </div>
  );
}
