"use client";

import { WordToPdfPanel } from "@/components/editor/pdf-tools/WordToPdfPanel";
import { ToolUploadCard } from "@/components/editor/ToolUploadCard";
import { useWordToPdfTool } from "@/hooks/useWordToPdfTool";

const WordIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

export default function WordToPdfPage() {
  const tool = useWordToPdfTool();

  if (!tool.wordToPdfBuffer) {
    return (
      <ToolUploadCard
        accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
        label="Upload a Word File"
        hint="DOCX files only"
        icon={WordIcon}
        isBusy={tool.isWordToPdfBusy}
        status={tool.wordToPdfStatus}
        statusType={tool.wordToPdfStatusType}
        onChange={tool.handleUploadWordToPdf}
      />
    );
  }

  return (
    <div className="animate-step-in rounded-xl border border-slate-200 bg-white p-7 shadow-sm max-md:p-5">
      <WordToPdfPanel
        wordToPdfName={tool.wordToPdfName}
        wordToPdfBuffer={tool.wordToPdfBuffer}
        wordToPdfStatus={tool.wordToPdfStatus}
        wordToPdfStatusType={tool.wordToPdfStatusType}
        isWordToPdfBusy={tool.isWordToPdfBusy}
        isBusy={false}
        wordToPdfPreviews={tool.wordToPdfPreviews}
        wordToPdfResultName={tool.wordToPdfResultName}
        wordToPdfResultBuffer={tool.wordToPdfResultBuffer}
        onUploadWordToPdf={tool.handleUploadWordToPdf}
        onClearWordToPdf={tool.clearWordToPdf}
        onConvertWordToPdf={tool.handleConvertWordToPdf}
        onDownloadWordToPdf={tool.handleDownloadWordToPdf}
      />
    </div>
  );
}
