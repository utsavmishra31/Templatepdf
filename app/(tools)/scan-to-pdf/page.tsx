"use client";

import { ScanToPdfPanel } from "@/components/editor/pdf-tools/ScanToPdfPanel";
import { useScanToPdfTool } from "@/hooks/useScanToPdfTool";

const CameraIcon = (
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
    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export default function ScanToPdfPage() {
  const tool = useScanToPdfTool();

  if (!tool.isCameraOn && tool.pages.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center py-10">
        <div className="w-full max-w-lg animate-step-in rounded-2xl border-2 border-dashed border-slate-300 bg-white px-10 py-12 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            {CameraIcon}
          </div>

          <p className="text-2xl font-extrabold text-slate-800">Scan With Camera or Upload</p>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Mobile front/back camera and laptop webcam supported
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={tool.startCamera}
              disabled={tool.isBusy || !tool.hasCameraSupport}
              className={`min-h-10 rounded-lg border px-4 text-sm font-extrabold transition ${
                tool.hasCameraSupport
                  ? "border-teal-700 bg-white text-teal-700 hover:bg-teal-700 hover:text-white"
                  : "cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400"
              }`}
            >
              Start Camera
            </button>

            <label className="relative inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-teal-700 bg-white px-4 text-sm font-extrabold text-teal-700 transition hover:bg-teal-700 hover:text-white">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={tool.handleUploadImages}
                disabled={tool.isBusy}
                className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-progress"
              />
              Upload
            </label>
          </div>

          <p
            className={`mt-5 min-h-6 text-sm font-bold ${
              tool.statusType === "error"
                ? "text-red-700"
                : tool.statusType === "success"
                  ? "text-teal-700"
                  : "text-slate-500"
            }`}
            role="status"
            aria-live="polite"
          >
            {tool.status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-step-in">
      <ScanToPdfPanel
        pages={tool.pages}
        selectedPageIds={tool.selectedPageIds}
        filterMode={tool.filterMode}
        facingMode={tool.facingMode}
        hasDualCameraOptions={tool.hasDualCameraOptions}
        isCameraOn={tool.isCameraOn}
        isBusy={tool.isBusy}
        hasCameraSupport={tool.hasCameraSupport}
        resultBuffer={tool.resultBuffer}
        status={tool.status}
        statusType={tool.statusType}
        videoRef={tool.videoRef}
        onFilterModeChange={tool.setFilterMode}
        onStartCamera={tool.startCamera}
        onStopCamera={tool.stopCamera}
        onSwitchCamera={tool.switchCamera}
        onCapture={tool.captureFromCamera}
        onUploadImages={tool.handleUploadImages}
        onTogglePageSelection={tool.togglePageSelection}
        onRotateSelected={tool.rotateSelected}
        onFlipSelected={tool.flipSelected}
        onRemovePage={tool.removePage}
        onClearAll={tool.clearAll}
        onGeneratePdf={tool.generatePdf}
        onDownloadPdf={tool.downloadPdf}
      />
    </div>
  );
}
