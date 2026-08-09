"use client";

import { CropPdfPanel } from "@/components/editor/pdf-tools/CropPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useCropPdfTool } from "@/hooks/useCropPdfTool";

const PdfIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 12h10" />
    <path d="M12 7v10" />
  </svg>
);

export default function CropPdfPage() {
  const tool = useCropPdfTool();

  if (!tool.cropPdfSourceBuffer) {
    return (
      <ToolUploadCard
        accept="application/pdf,.pdf"
        label="Upload a PDF"
        hint="PDF files only"
        icon={PdfIcon}
        isBusy={tool.isCropPdfBusy}
        status={tool.cropPdfStatus}
        statusType={tool.cropPdfStatusType}
        onChange={tool.handleUploadCropPdf}
      />
    );
  }

  return (
    <div className="animate-step-in">
      <CropPdfPanel
        cropPdfName={tool.cropPdfName}
        cropPdfBuffer={tool.cropPdfBuffer}
        cropPdfPreviews={tool.cropPdfPreviews}
        cropPageSettings={tool.cropPageSettings}
        selectedCropPage={tool.selectedCropPage}
        selectedPageRect={tool.selectedPageRect}
        cropPdfResultBuffer={tool.cropPdfResultBuffer}
        cropPdfResultName={tool.cropPdfResultName}
        cropPdfStatus={tool.cropPdfStatus}
        cropPdfStatusType={tool.cropPdfStatusType}
        isCropPdfBusy={tool.isCropPdfBusy}
        isBusy={false}
        onUploadCropPdf={tool.handleUploadCropPdf}
        onSelectCropPage={tool.handleSelectCropPage}
        onSetSelectedPageCropRect={tool.handleSetSelectedPageCropRect}
        onResetSelectedPageCrop={tool.handleResetSelectedPageCrop}
        onCopySelectedCropToAllPages={tool.handleCopySelectedCropToAllPages}
        onApplyCrops={tool.handleApplyCrops}
        onDownloadCroppedPdf={tool.handleDownloadCroppedPdf}
      />
    </div>
  );
}
