"use client";

import { ImageConvertPanel } from "@/components/editor/pdf-tools/ImageConvertPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useImageConvertTool } from "@/hooks/useImageConvertTool";

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

export default function ImageConvertPage() {
  const tool = useImageConvertTool();

  if (tool.items.length === 0) {
    return (
      <ToolUploadCard
        accept="image/png,image/jpeg,image/jpg,image/webp,image/avif,.png,.jpg,.jpeg,.webp,.avif"
        label="Add Images"
        hint="PNG, JPG, JPEG, WEBP, and AVIF supported"
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
      <ImageConvertPanel
        items={tool.items}
        sourceFormats={tool.sourceFormats}
        targetFormat={tool.targetFormat}
        resultBuffer={tool.resultBuffer}
        resultName={tool.resultName}
        resultKind={tool.resultKind}
        status={tool.status}
        statusType={tool.statusType}
        isBusy={tool.isBusy}
        onTargetFormatChange={tool.setTargetFormat}
        onAddImages={tool.handleAddImages}
        onRemoveItem={tool.removeItem}
        onClearAll={tool.clearAll}
        onConvertImages={tool.handleConvertImages}
        onDownload={tool.handleDownload}
      />
    </div>
  );
}
