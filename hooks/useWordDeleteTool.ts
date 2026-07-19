"use client";

import { type ChangeEvent, useState } from "react";
import { renderPdfPagePreviews } from "@/lib/pdf-tools";
import { downloadBlob } from "@/lib/template";
import {
  DOCX_MIME,
  requestWordPageDeletion,
  requestWordPreviewPdf,
} from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

export function useWordDeleteTool() {
  const [uploadedWordName, setUploadedWordName] = useState("");
  const [uploadedWordBuffer, setUploadedWordBuffer] =
    useState<ArrayBuffer | null>(null);
  const [uploadedWordOriginalBuffer, setUploadedWordOriginalBuffer] =
    useState<ArrayBuffer | null>(null);
  const [uploadedWordPreviews, setUploadedWordPreviews] = useState<string[]>(
    [],
  );
  const [selectedWordPages, setSelectedWordPages] = useState<number[]>([]);
  const [wordVisibleToOriginalPageMap, setWordVisibleToOriginalPageMap] =
    useState<number[]>([]);
  const [deletedWordOriginalPages, setDeletedWordOriginalPages] = useState<
    number[]
  >([]);
  const [wordStatus, setWordStatus] = useState("");
  const [wordStatusType, setWordStatusType] = useState<StatusType>("");
  const [isWordBusy, setIsWordBusy] = useState(false);

  function applyWordStatus(message: string, type: StatusType) {
    setWordStatusType(type);
    setWordStatus(message);
  }

  async function handleUploadWord(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const isDocx =
      file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
    if (!isDocx) {
      applyWordStatus("Please upload a valid DOCX file.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Generating exact Word page previews...", "");

    try {
      const buffer = await file.arrayBuffer();
      const previewPdfBuffer = await requestWordPreviewPdf(file.name, buffer);
      const previews = await renderPdfPagePreviews(previewPdfBuffer);

      if (!previews.length) {
        throw new Error("The uploaded Word file has no previewable pages.");
      }

      setUploadedWordName(file.name);
      setUploadedWordBuffer(buffer);
      setUploadedWordOriginalBuffer(buffer);
      setUploadedWordPreviews(previews);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap(previews.map((_, index) => index + 1));
      setDeletedWordOriginalPages([]);
      applyWordStatus(
        `Loaded ${previews.length} exact Word page(s). Select pages you want to delete.`,
        "success",
      );
    } catch (error) {
      setUploadedWordName("");
      setUploadedWordBuffer(null);
      setUploadedWordOriginalBuffer(null);
      setUploadedWordPreviews([]);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap([]);
      setDeletedWordOriginalPages([]);
      applyWordStatus(
        error instanceof Error
          ? error.message
          : "Could not process this Word file.",
        "error",
      );
    } finally {
      setIsWordBusy(false);
    }
  }

  function clearUploadedWord() {
    setUploadedWordName("");
    setUploadedWordBuffer(null);
    setUploadedWordOriginalBuffer(null);
    setUploadedWordPreviews([]);
    setSelectedWordPages([]);
    setWordVisibleToOriginalPageMap([]);
    setDeletedWordOriginalPages([]);
    applyWordStatus("Word selection cleared.", "success");
  }

  function toggleWordPageSelection(pageNumber: number) {
    setSelectedWordPages((previous) => {
      if (previous.includes(pageNumber)) {
        return previous.filter((item) => item !== pageNumber);
      }
      return [...previous, pageNumber].sort((a, b) => a - b);
    });
  }

  async function handleDeleteSelectedWordPages() {
    if (!uploadedWordBuffer || !uploadedWordName) {
      applyWordStatus("Upload a Word file first.", "error");
      return;
    }
    if (!selectedWordPages.length) {
      applyWordStatus("Select at least one page to delete.", "error");
      return;
    }

    setIsWordBusy(true);
    applyWordStatus("Deleting selected Word pages...", "");

    try {
      const selectedCurrentSet = new Set(selectedWordPages);
      const mappedOriginalPages = selectedWordPages
        .map(
          (visiblePageNumber) =>
            wordVisibleToOriginalPageMap[visiblePageNumber - 1],
        )
        .filter(
          (pageNumber): pageNumber is number => Number.isFinite(pageNumber),
        );

      const canUseOriginalMapping =
        !!uploadedWordOriginalBuffer &&
        mappedOriginalPages.length === selectedWordPages.length;

      const nextDeletedOriginalPages = canUseOriginalMapping
        ? Array.from(
            new Set([...deletedWordOriginalPages, ...mappedOriginalPages]),
          ).sort((a, b) => a - b)
        : [];

      const result = canUseOriginalMapping
        ? await requestWordPageDeletion(
            uploadedWordName,
            uploadedWordOriginalBuffer!,
            nextDeletedOriginalPages,
          )
        : await requestWordPageDeletion(
            uploadedWordName,
            uploadedWordBuffer,
            selectedWordPages,
          );

      const nextBuffer = result.nextBuffer;
      const baseName = uploadedWordName.replace(/\.docx$/i, "") || "edited";
      const outputName = `${baseName}-updated.docx`;
      const previewPdfBuffer = await requestWordPreviewPdf(
        outputName,
        nextBuffer,
      );
      const nextPreviews = await renderPdfPagePreviews(previewPdfBuffer);

      let nextVisibleToOriginalMap = canUseOriginalMapping
        ? wordVisibleToOriginalPageMap.filter(
            (_, index) => !selectedCurrentSet.has(index + 1),
          )
        : nextPreviews.map((_, index) => index + 1);

      const hasMappingDrift =
        canUseOriginalMapping &&
        nextVisibleToOriginalMap.length !== nextPreviews.length;

      if (hasMappingDrift) {
        nextVisibleToOriginalMap = nextPreviews.map((_, index) => index + 1);
      }

      const newlyDeletedCount = canUseOriginalMapping
        ? nextDeletedOriginalPages.length - deletedWordOriginalPages.length
        : selectedWordPages.length;

      setUploadedWordName(outputName);
      setUploadedWordBuffer(result.nextBuffer);
      setUploadedWordOriginalBuffer(
        canUseOriginalMapping && !hasMappingDrift
          ? uploadedWordOriginalBuffer
          : result.nextBuffer,
      );
      setUploadedWordPreviews(nextPreviews);
      setSelectedWordPages([]);
      setWordVisibleToOriginalPageMap(nextVisibleToOriginalMap);
      setDeletedWordOriginalPages(
        canUseOriginalMapping && !hasMappingDrift
          ? nextDeletedOriginalPages
          : [],
      );

      const rebased = !canUseOriginalMapping || hasMappingDrift;
      applyWordStatus(
        rebased
          ? `Deleted ${newlyDeletedCount} page(s). Review below, then click Download DOCX. Page mapping was auto-reset for continued edits.`
          : `Deleted ${newlyDeletedCount} page(s). Review the pages below, then click Download DOCX.`,
        "success",
      );
    } catch (error) {
      applyWordStatus(
        error instanceof Error ? error.message : "Word page deletion failed.",
        "error",
      );
    } finally {
      setIsWordBusy(false);
    }
  }

  function handleDownloadWord() {
    if (!uploadedWordBuffer || !uploadedWordName) return;
    downloadBlob(
      new Blob([uploadedWordBuffer], { type: DOCX_MIME }),
      uploadedWordName,
    );
  }

  return {
    uploadedWordName,
    uploadedWordBuffer,
    uploadedWordPreviews,
    selectedWordPages,
    wordStatus,
    wordStatusType,
    isWordBusy,
    handleUploadWord,
    clearUploadedWord,
    toggleWordPageSelection,
    handleDeleteSelectedWordPages,
    handleDownloadWord,
  };
}
