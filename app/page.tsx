"use client";

import { DocumentPreview } from "@/components/editor/DocumentPreview";
import { EntryTabs } from "@/components/editor/EntryTabs";
import { PdfToolsPanel } from "@/components/editor/PdfToolsPanel";
import { TemplateSelector } from "@/components/editor/TemplateSelector";
import { useTemplateEditor } from "@/hooks/useTemplateEditor";
import { usePdfDeleteTool } from "@/hooks/usePdfDeleteTool";
import { useWordDeleteTool } from "@/hooks/useWordDeleteTool";
import { useWordToPdfTool } from "@/hooks/useWordToPdfTool";
import { usePdfToWordTool } from "@/hooks/usePdfToWordTool";
import { useMergePdfTool } from "@/hooks/useMergePdfTool";
import { useCompressPdfTool } from "@/hooks/useCompressPdfTool";
import { useRotatePdfTool } from "@/hooks/useRotatePdfTool";
import { useSplitPdfTool } from "@/hooks/useSplitPdfTool";
import { templateOptions } from "@/lib/template";

export default function Home() {
  const editor = useTemplateEditor();
  const pdfDelete = usePdfDeleteTool();
  const wordDelete = useWordDeleteTool();
  const wordToPdf = useWordToPdfTool();
  const pdfToWord = usePdfToWordTool();
  const mergePdf = useMergePdfTool();
  const compressPdf = useCompressPdfTool();
  const rotatePdf = useRotatePdfTool();
  const splitPdf = useSplitPdfTool();

  const selectedTemplateLabel = editor.selectedKey
    ? templateOptions[editor.selectedKey].label
    : "";

  return (
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-9 max-md:w-[min(100%-22px,1180px)] max-md:pt-5">
      <section
        className="rounded-lg border border-slate-200 bg-white/95 p-7 shadow-[0_20px_60px_rgba(32,36,31,0.12)] max-md:p-5"
        aria-labelledby="appTitle"
      >
        <TemplateSelector
          selectedKey={editor.selectedKey}
          displayedPlaceholders={editor.displayedPlaceholders}
          selectedTemplateLabel={selectedTemplateLabel}
          isBusy={editor.isBusy}
          onTemplateChange={editor.handleTemplateChange}
        />

        <EntryTabs
          displayedPlaceholders={editor.displayedPlaceholders}
          activeTab={editor.activeTab}
          onTabChange={editor.setActiveTab}
          bulkInput={editor.bulkInput}
          onBulkInputChange={editor.setBulkInput}
          onApplyBulk={editor.applyBulkInput}
          onClearBulk={editor.clearBulkInput}
          bulkResult={editor.bulkResult}
          bulkResultType={editor.bulkResultType}
          formValues={editor.formValues}
          onFieldChange={editor.handleFieldValueChange}
          isBusy={editor.isBusy}
        />

        {editor.displayedPlaceholders.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-3" id="actions">
            <button
              type="button"
              className="min-h-11 rounded-lg border border-transparent bg-teal-700 px-4 font-extrabold text-white transition hover:bg-teal-800"
              onClick={editor.handleDocxDownload}
              disabled={editor.isBusy}
            >
              Download MS Word
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-teal-700 bg-white px-4 font-extrabold text-teal-800"
              onClick={editor.handlePdfDownload}
              disabled={editor.isBusy}
            >
              Download PDF
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-transparent px-4 font-extrabold text-slate-600"
              onClick={editor.clearFields}
              disabled={editor.isBusy}
            >
              Clear Fields
            </button>
          </div>
        )}

        <p
          className={`mt-4 min-h-6 font-bold ${
            editor.statusType === "error"
              ? "text-red-700"
              : editor.statusType === "success"
                ? "text-teal-800"
                : "text-slate-500"
          }`}
          role="status"
          aria-live="polite"
        >
          {editor.status}
        </p>

        <PdfToolsPanel
          uploadedPdfName={pdfDelete.uploadedPdfName}
          uploadedPdfBuffer={pdfDelete.uploadedPdfBuffer}
          uploadedPdfPreviews={pdfDelete.uploadedPdfPreviews}
          selectedPdfPages={pdfDelete.selectedPdfPages}
          pdfStatus={pdfDelete.pdfStatus}
          pdfStatusType={pdfDelete.pdfStatusType}
          isPdfBusy={pdfDelete.isPdfBusy}
          uploadedWordName={wordDelete.uploadedWordName}
          uploadedWordBuffer={wordDelete.uploadedWordBuffer}
          uploadedWordPreviews={wordDelete.uploadedWordPreviews}
          selectedWordPages={wordDelete.selectedWordPages}
          wordStatus={wordDelete.wordStatus}
          wordStatusType={wordDelete.wordStatusType}
          isWordBusy={wordDelete.isWordBusy}
          isBusy={editor.isBusy}
          onUploadPdf={pdfDelete.handleUploadPdf}
          onClearPdf={pdfDelete.clearUploadedPdf}
          onDeleteSelectedPages={pdfDelete.handleDeleteSelectedPdfPages}
          onTogglePageSelection={pdfDelete.togglePdfPageSelection}
          onUploadWord={wordDelete.handleUploadWord}
          onClearWord={wordDelete.clearUploadedWord}
          onDeleteSelectedWordPages={wordDelete.handleDeleteSelectedWordPages}
          onToggleWordPageSelection={wordDelete.toggleWordPageSelection}
          wordToPdfName={wordToPdf.wordToPdfName}
          wordToPdfBuffer={wordToPdf.wordToPdfBuffer}
          wordToPdfStatus={wordToPdf.wordToPdfStatus}
          wordToPdfStatusType={wordToPdf.wordToPdfStatusType}
          isWordToPdfBusy={wordToPdf.isWordToPdfBusy}
          onUploadWordToPdf={wordToPdf.handleUploadWordToPdf}
          onClearWordToPdf={wordToPdf.clearWordToPdf}
          onConvertWordToPdf={wordToPdf.handleConvertWordToPdf}
          wordToPdfPreviews={wordToPdf.wordToPdfPreviews}
          wordToPdfResultName={wordToPdf.wordToPdfResultName}
          wordToPdfResultBuffer={wordToPdf.wordToPdfResultBuffer}
          onDownloadPdf={pdfDelete.handleDownloadPdf}
          onDownloadWord={wordDelete.handleDownloadWord}
          onDownloadWordToPdf={wordToPdf.handleDownloadWordToPdf}
          pdfToWordName={pdfToWord.pdfToWordName}
          pdfToWordBuffer={pdfToWord.pdfToWordBuffer}
          pdfToWordPreviews={pdfToWord.pdfToWordPreviews}
          pdfToWordResultBuffer={pdfToWord.pdfToWordResultBuffer}
          pdfToWordResultName={pdfToWord.pdfToWordResultName}
          pdfToWordStatus={pdfToWord.pdfToWordStatus}
          pdfToWordStatusType={pdfToWord.pdfToWordStatusType}
          isPdfToWordBusy={pdfToWord.isPdfToWordBusy}
          onUploadPdfToWord={pdfToWord.handleUploadPdfToWord}
          onClearPdfToWord={pdfToWord.clearPdfToWord}
          onConvertPdfToWord={pdfToWord.handleConvertPdfToWord}
          onDownloadPdfToWord={pdfToWord.handleDownloadPdfToWord}
          mergePdfFiles={mergePdf.mergePdfFiles.map((f) => ({
            name: f.name,
            firstPageSrc: f.firstPageSrc,
            pageCount: f.pageCount,
          }))}
          mergePdfResultBuffer={mergePdf.mergePdfResultBuffer}
          mergePdfResultName={mergePdf.mergePdfResultName}
          mergePdfStatus={mergePdf.mergePdfStatus}
          mergePdfStatusType={mergePdf.mergePdfStatusType}
          isMergePdfBusy={mergePdf.isMergePdfBusy}
          onAddMergePdfFiles={mergePdf.handleAddMergePdfFiles}
          onRemoveMergePdfFile={mergePdf.handleRemoveMergePdfFile}
          onMoveMergePdfFile={mergePdf.handleMoveMergePdfFile}
          onMergePdfs={mergePdf.handleMergePdfs}
          onClearMergePdf={mergePdf.clearMergePdf}
          onDownloadMergedPdf={mergePdf.handleDownloadMergedPdf}
          compressPdfName={compressPdf.compressPdfName}
          compressPdfBuffer={compressPdf.compressPdfBuffer}
          compressPdfOriginalSize={compressPdf.compressPdfOriginalSize}
          compressPdfQuality={compressPdf.compressPdfQuality}
          compressPdfResultBuffer={compressPdf.compressPdfResultBuffer}
          compressPdfResultName={compressPdf.compressPdfResultName}
          compressPdfResultSize={compressPdf.compressPdfResultSize}
          compressPdfStatus={compressPdf.compressPdfStatus}
          compressPdfStatusType={compressPdf.compressPdfStatusType}
          isCompressPdfBusy={compressPdf.isCompressPdfBusy}
          onUploadCompressPdf={compressPdf.handleUploadCompressPdf}
          onClearCompressPdf={compressPdf.clearCompressPdf}
          onCompressPdfQualityChange={compressPdf.setCompressPdfQuality}
          onCompressPdf={compressPdf.handleCompressPdf}
          onDownloadCompressedPdf={compressPdf.handleDownloadCompressedPdf}
          rotatePdfName={rotatePdf.rotatePdfName}
          rotatePdfBuffer={rotatePdf.rotatePdfBuffer}
          rotatePdfPreviews={rotatePdf.rotatePdfPreviews}
          rotatePdfResultBuffer={rotatePdf.rotatePdfResultBuffer}
          rotatePdfResultName={rotatePdf.rotatePdfResultName}
          rotatePdfStatus={rotatePdf.rotatePdfStatus}
          rotatePdfStatusType={rotatePdf.rotatePdfStatusType}
          isRotatePdfBusy={rotatePdf.isRotatePdfBusy}
          onUploadRotatePdf={rotatePdf.handleUploadRotatePdf}
          onClearRotatePdf={rotatePdf.clearRotatePdf}
          onRotatePage={rotatePdf.handleRotatePage}
          onRotateAllPages={rotatePdf.handleRotateAllPages}
          onDownloadRotatedPdf={rotatePdf.handleDownloadRotatedPdf}
          splitPdfName={splitPdf.splitPdfName}
          splitPdfBuffer={splitPdf.splitPdfBuffer}
          splitPdfPreviews={splitPdf.splitPdfPreviews}
          splitNumOutputs={splitPdf.splitNumOutputs}
          splitRanges={splitPdf.splitRanges}
          splitPdfStatus={splitPdf.splitPdfStatus}
          splitPdfStatusType={splitPdf.splitPdfStatusType}
          isSplitPdfBusy={splitPdf.isSplitPdfBusy}
          onUploadSplitPdf={splitPdf.handleUploadSplitPdf}
          onClearSplitPdf={splitPdf.clearSplitPdf}
          onSplitNumOutputsChange={splitPdf.handleSplitNumOutputsChange}
          onSplitRangeChange={splitPdf.handleSplitRangeChange}
          onGenerateSplit={splitPdf.handleGenerateSplit}
        />
      </section>

      <DocumentPreview
        previewVisible={editor.previewVisible}
        previewBadge={editor.previewBadge}
        previewHtml={editor.previewHtml}
      />
    </main>
  );
}
