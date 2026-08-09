"use client";

import { ImageResizePanel } from "@/components/editor/pdf-tools/ImageResizePanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useImageResizeTool } from "@/hooks/useImageResizeTool";

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

export default function ImageResizePage() {
  const tool = useImageResizeTool();

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
      <ImageResizePanel
        items={tool.items}
        resizeMode={tool.resizeMode}
        ratioNumerator={tool.ratioNumerator}
        ratioDenominator={tool.ratioDenominator}
        pixelWidth={tool.pixelWidth}
        pixelHeight={tool.pixelHeight}
        percentage={tool.percentage}
        resultBuffer={tool.resultBuffer}
        resultName={tool.resultName}
        resultKind={tool.resultKind}
        status={tool.status}
        statusType={tool.statusType}
        isBusy={tool.isBusy}
        onResizeModeChange={tool.setResizeMode}
        onRatioNumeratorChange={tool.setRatioNumerator}
        onRatioDenominatorChange={tool.setRatioDenominator}
        onPixelWidthChange={tool.setPixelWidth}
        onPixelHeightChange={tool.setPixelHeight}
        onPercentageChange={tool.setPercentage}
        onRemoveItem={tool.removeItem}
        onClearAll={tool.clearAll}
        onResizeImages={tool.handleResizeImages}
        onDownload={tool.handleDownload}
      />
    </div>
  );
}
