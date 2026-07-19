import type { ChangeEvent } from "react";
import type { StatusType } from "@/types/editor";
import { DeletePdfPagesPanel } from "./pdf-tools/DeletePdfPagesPanel";
import { DeleteWordPagesPanel } from "./pdf-tools/DeleteWordPagesPanel";
import { WordToPdfPanel } from "./pdf-tools/WordToPdfPanel";
import { PdfToWordPanel } from "./pdf-tools/PdfToWordPanel";
import { MergePdfPanel } from "./pdf-tools/MergePdfPanel";
import { CompressPdfPanel } from "./pdf-tools/CompressPdfPanel";
import { RotatePdfPanel } from "./pdf-tools/RotatePdfPanel";
import { SplitPdfPanel } from "./pdf-tools/SplitPdfPanel";

type PdfToolsPanelProps = {
  uploadedPdfName: string;
  uploadedPdfBuffer: ArrayBuffer | null;
  uploadedPdfPreviews: string[];
  selectedPdfPages: number[];
  pdfStatus: string;
  pdfStatusType: StatusType;
  isPdfBusy: boolean;
  uploadedWordName: string;
  uploadedWordBuffer: ArrayBuffer | null;
  uploadedWordPreviews: string[];
  selectedWordPages: number[];
  wordStatus: string;
  wordStatusType: StatusType;
  isWordBusy: boolean;
  isBusy: boolean;
  onUploadPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdf: () => void;
  onDeleteSelectedPages: () => void;
  onTogglePageSelection: (pageNumber: number) => void;
  onUploadWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWord: () => void;
  onDeleteSelectedWordPages: () => void;
  onToggleWordPageSelection: (pageNumber: number) => void;
  wordToPdfName: string;
  wordToPdfBuffer: ArrayBuffer | null;
  wordToPdfStatus: string;
  wordToPdfStatusType: StatusType;
  isWordToPdfBusy: boolean;
  onUploadWordToPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearWordToPdf: () => void;
  onConvertWordToPdf: () => void;
  wordToPdfPreviews: string[];
  wordToPdfResultName: string;
  wordToPdfResultBuffer: ArrayBuffer | null;
  onDownloadPdf: () => void;
  onDownloadWord: () => void;
  onDownloadWordToPdf: () => void;
  pdfToWordName: string;
  pdfToWordBuffer: ArrayBuffer | null;
  pdfToWordPreviews: string[];
  pdfToWordResultBuffer: ArrayBuffer | null;
  pdfToWordResultName: string;
  pdfToWordStatus: string;
  pdfToWordStatusType: StatusType;
  isPdfToWordBusy: boolean;
  onUploadPdfToWord: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearPdfToWord: () => void;
  onConvertPdfToWord: () => void;
  onDownloadPdfToWord: () => void;
  mergePdfFiles: Array<{ name: string; firstPageSrc: string; pageCount: number }>;
  mergePdfResultBuffer: ArrayBuffer | null;
  mergePdfResultName: string;
  mergePdfStatus: string;
  mergePdfStatusType: StatusType;
  isMergePdfBusy: boolean;
  onAddMergePdfFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveMergePdfFile: (index: number) => void;
  onMoveMergePdfFile: (fromIndex: number, toIndex: number) => void;
  onMergePdfs: () => void;
  onClearMergePdf: () => void;
  onDownloadMergedPdf: () => void;
  compressPdfName: string;
  compressPdfBuffer: ArrayBuffer | null;
  compressPdfOriginalSize: number;
  compressPdfQuality: "extreme" | "recommended" | "less";
  compressPdfResultBuffer: ArrayBuffer | null;
  compressPdfResultName: string;
  compressPdfResultSize: number;
  compressPdfStatus: string;
  compressPdfStatusType: StatusType;
  isCompressPdfBusy: boolean;
  onUploadCompressPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearCompressPdf: () => void;
  onCompressPdfQualityChange: (quality: "extreme" | "recommended" | "less") => void;
  onCompressPdf: () => void;
  onDownloadCompressedPdf: () => void;
  rotatePdfName: string;
  rotatePdfBuffer: ArrayBuffer | null;
  rotatePdfPreviews: string[];
  rotatePdfResultBuffer: ArrayBuffer | null;
  rotatePdfResultName: string;
  rotatePdfStatus: string;
  rotatePdfStatusType: StatusType;
  isRotatePdfBusy: boolean;
  onUploadRotatePdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearRotatePdf: () => void;
  onRotatePage: (pageNumber: number, direction: "cw" | "ccw") => void;
  onRotateAllPages: (direction: "cw" | "ccw") => void;
  onDownloadRotatedPdf: () => void;
  splitPdfName: string;
  splitPdfBuffer: ArrayBuffer | null;
  splitPdfPreviews: string[];
  splitNumOutputs: number;
  splitRanges: string[];
  splitPdfStatus: string;
  splitPdfStatusType: StatusType;
  isSplitPdfBusy: boolean;
  onUploadSplitPdf: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearSplitPdf: () => void;
  onSplitNumOutputsChange: (n: number) => void;
  onSplitRangeChange: (index: number, value: string) => void;
  onGenerateSplit: () => void;
};

export function PdfToolsPanel(props: PdfToolsPanelProps) {
  return (
    <>
      <DeletePdfPagesPanel
        uploadedPdfName={props.uploadedPdfName}
        uploadedPdfBuffer={props.uploadedPdfBuffer}
        uploadedPdfPreviews={props.uploadedPdfPreviews}
        selectedPdfPages={props.selectedPdfPages}
        pdfStatus={props.pdfStatus}
        pdfStatusType={props.pdfStatusType}
        isPdfBusy={props.isPdfBusy}
        isBusy={props.isBusy}
        onUploadPdf={props.onUploadPdf}
        onClearPdf={props.onClearPdf}
        onDeleteSelectedPages={props.onDeleteSelectedPages}
        onTogglePageSelection={props.onTogglePageSelection}
        onDownloadPdf={props.onDownloadPdf}
      />
      <DeleteWordPagesPanel
        uploadedWordName={props.uploadedWordName}
        uploadedWordBuffer={props.uploadedWordBuffer}
        uploadedWordPreviews={props.uploadedWordPreviews}
        selectedWordPages={props.selectedWordPages}
        wordStatus={props.wordStatus}
        wordStatusType={props.wordStatusType}
        isWordBusy={props.isWordBusy}
        isBusy={props.isBusy}
        onUploadWord={props.onUploadWord}
        onClearWord={props.onClearWord}
        onDeleteSelectedWordPages={props.onDeleteSelectedWordPages}
        onToggleWordPageSelection={props.onToggleWordPageSelection}
        onDownloadWord={props.onDownloadWord}
      />
      <WordToPdfPanel
        wordToPdfName={props.wordToPdfName}
        wordToPdfBuffer={props.wordToPdfBuffer}
        wordToPdfStatus={props.wordToPdfStatus}
        wordToPdfStatusType={props.wordToPdfStatusType}
        isWordToPdfBusy={props.isWordToPdfBusy}
        isBusy={props.isBusy}
        wordToPdfPreviews={props.wordToPdfPreviews}
        wordToPdfResultName={props.wordToPdfResultName}
        wordToPdfResultBuffer={props.wordToPdfResultBuffer}
        onUploadWordToPdf={props.onUploadWordToPdf}
        onClearWordToPdf={props.onClearWordToPdf}
        onConvertWordToPdf={props.onConvertWordToPdf}
        onDownloadWordToPdf={props.onDownloadWordToPdf}
      />
      <PdfToWordPanel
        pdfToWordName={props.pdfToWordName}
        pdfToWordBuffer={props.pdfToWordBuffer}
        pdfToWordPreviews={props.pdfToWordPreviews}
        pdfToWordResultBuffer={props.pdfToWordResultBuffer}
        pdfToWordResultName={props.pdfToWordResultName}
        pdfToWordStatus={props.pdfToWordStatus}
        pdfToWordStatusType={props.pdfToWordStatusType}
        isPdfToWordBusy={props.isPdfToWordBusy}
        isBusy={props.isBusy}
        onUploadPdfToWord={props.onUploadPdfToWord}
        onClearPdfToWord={props.onClearPdfToWord}
        onConvertPdfToWord={props.onConvertPdfToWord}
        onDownloadPdfToWord={props.onDownloadPdfToWord}
      />
      <MergePdfPanel
        mergePdfFiles={props.mergePdfFiles}
        mergePdfResultBuffer={props.mergePdfResultBuffer}
        mergePdfResultName={props.mergePdfResultName}
        mergePdfStatus={props.mergePdfStatus}
        mergePdfStatusType={props.mergePdfStatusType}
        isMergePdfBusy={props.isMergePdfBusy}
        isBusy={props.isBusy}
        onAddMergePdfFiles={props.onAddMergePdfFiles}
        onRemoveMergePdfFile={props.onRemoveMergePdfFile}
        onMoveMergePdfFile={props.onMoveMergePdfFile}
        onMergePdfs={props.onMergePdfs}
        onClearMergePdf={props.onClearMergePdf}
        onDownloadMergedPdf={props.onDownloadMergedPdf}
      />
      <CompressPdfPanel
        compressPdfName={props.compressPdfName}
        compressPdfBuffer={props.compressPdfBuffer}
        compressPdfOriginalSize={props.compressPdfOriginalSize}
        compressPdfQuality={props.compressPdfQuality}
        compressPdfResultBuffer={props.compressPdfResultBuffer}
        compressPdfResultName={props.compressPdfResultName}
        compressPdfResultSize={props.compressPdfResultSize}
        compressPdfStatus={props.compressPdfStatus}
        compressPdfStatusType={props.compressPdfStatusType}
        isCompressPdfBusy={props.isCompressPdfBusy}
        isBusy={props.isBusy}
        onUploadCompressPdf={props.onUploadCompressPdf}
        onClearCompressPdf={props.onClearCompressPdf}
        onCompressPdfQualityChange={props.onCompressPdfQualityChange}
        onCompressPdf={props.onCompressPdf}
        onDownloadCompressedPdf={props.onDownloadCompressedPdf}
      />
      <RotatePdfPanel
        rotatePdfName={props.rotatePdfName}
        rotatePdfBuffer={props.rotatePdfBuffer}
        rotatePdfPreviews={props.rotatePdfPreviews}
        rotatePdfResultBuffer={props.rotatePdfResultBuffer}
        rotatePdfResultName={props.rotatePdfResultName}
        rotatePdfStatus={props.rotatePdfStatus}
        rotatePdfStatusType={props.rotatePdfStatusType}
        isRotatePdfBusy={props.isRotatePdfBusy}
        isBusy={props.isBusy}
        onUploadRotatePdf={props.onUploadRotatePdf}
        onClearRotatePdf={props.onClearRotatePdf}
        onRotatePage={props.onRotatePage}
        onRotateAllPages={props.onRotateAllPages}
        onDownloadRotatedPdf={props.onDownloadRotatedPdf}
      />
      <SplitPdfPanel
        splitPdfName={props.splitPdfName}
        splitPdfBuffer={props.splitPdfBuffer}
        splitPdfPreviews={props.splitPdfPreviews}
        splitNumOutputs={props.splitNumOutputs}
        splitRanges={props.splitRanges}
        splitPdfStatus={props.splitPdfStatus}
        splitPdfStatusType={props.splitPdfStatusType}
        isSplitPdfBusy={props.isSplitPdfBusy}
        isBusy={props.isBusy}
        onUploadSplitPdf={props.onUploadSplitPdf}
        onClearSplitPdf={props.onClearSplitPdf}
        onSplitNumOutputsChange={props.onSplitNumOutputsChange}
        onSplitRangeChange={props.onSplitRangeChange}
        onGenerateSplit={props.onGenerateSplit}
      />
    </>
  );
}
