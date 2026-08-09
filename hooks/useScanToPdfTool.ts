"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { downloadBlob } from "@/lib/template";
import { PDF_MIME } from "@/lib/api-requests";
import type { StatusType } from "@/types/editor";

type FacingMode = "user" | "environment";
export type ScanFilterMode = "original" | "scan-gray" | "scan-bw";

export type ScannedPage = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
  originalBlob: Blob;
  blob: Blob;
  appliedFilterMode: ScanFilterMode;
};

const A4_W = 595.28;
const A4_H = 841.89;

function nextId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function applyStatus(
  setStatus: (message: string) => void,
  setStatusType: (type: StatusType) => void,
  message: string,
  type: StatusType,
) {
  setStatus(message);
  setStatusType(type);
}

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, value));
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => {
        if (!value) {
          reject(new Error("Could not encode scanned image."));
          return;
        }
        resolve(value);
      },
      "image/jpeg",
      quality,
    );
  });
}

function applyScanFilter(imageData: ImageData, mode: ScanFilterMode) {
  if (mode === "original") return;

  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (mode === "scan-bw") {
      const bw = gray > 160 ? 255 : 0;
      data[i] = bw;
      data[i + 1] = bw;
      data[i + 2] = bw;
      continue;
    }

    // scan-gray: increase contrast and brighten backgrounds for scan-like output
    const contrasted = clamp255((gray - 128) * 1.35 + 140);
    data[i] = contrasted;
    data[i + 1] = contrasted;
    data[i + 2] = contrasted;
  }
}

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const src = URL.createObjectURL(blob);

  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode image."));
      img.src = src;
    });
  } finally {
    URL.revokeObjectURL(src);
  }
}

async function blobToScannedPage(
  blob: Blob,
  name: string,
  mode: ScanFilterMode,
): Promise<ScannedPage> {
  const image = await loadImage(blob);

  const maxEdge = 2200;
  const sourceW = image.naturalWidth || image.width;
  const sourceH = image.naturalHeight || image.height;
  const scale = Math.min(1, maxEdge / Math.max(sourceW, sourceH));
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) throw new Error("Could not create image processing context.");

  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const originalBlob = await canvasToJpegBlob(canvas);

  let outputBlob = originalBlob;
  if (mode !== "original") {
    applyScanFilter(imageData, mode);
    ctx.putImageData(imageData, 0, 0);
    outputBlob = await canvasToJpegBlob(canvas);
  }

  return {
    id: nextId(),
    name,
    src: URL.createObjectURL(outputBlob),
    width,
    height,
    originalBlob,
    blob: outputBlob,
    appliedFilterMode: mode,
  };
}

async function applyFilterToBlob(sourceBlob: Blob, mode: ScanFilterMode): Promise<Blob> {
  if (mode === "original") {
    return sourceBlob;
  }

  const source = await loadImage(sourceBlob);
  const width = source.naturalWidth || source.width;
  const height = source.naturalHeight || source.height;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create filter context.");

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyScanFilter(imageData, mode);
  ctx.putImageData(imageData, 0, 0);

  return await canvasToJpegBlob(canvas);
}

async function transformImageBlob(
  sourceBlob: Blob,
  options: {
    rotateQuarterTurns?: number;
    flipX?: boolean;
    flipY?: boolean;
  },
): Promise<{ blob: Blob; width: number; height: number }> {
  const source = await loadImage(sourceBlob);
  const turnsRaw = options.rotateQuarterTurns ?? 0;
  const turns = ((turnsRaw % 4) + 4) % 4;
  const radians = turns * (Math.PI / 2);

  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;
  const swapSides = turns % 2 === 1;
  const outWidth = swapSides ? sourceHeight : sourceWidth;
  const outHeight = swapSides ? sourceWidth : sourceHeight;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, outWidth);
  canvas.height = Math.max(1, outHeight);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not create transform context.");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
  ctx.drawImage(source, -sourceWidth / 2, -sourceHeight / 2);

  return {
    blob: await canvasToJpegBlob(canvas),
    width: canvas.width,
    height: canvas.height,
  };
}

export function useScanToPdfTool() {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [filterMode, setFilterModeState] = useState<ScanFilterMode>("scan-gray");
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [hasCameraSupport, setHasCameraSupport] = useState(false);
  const [hasDualCameraOptions, setHasDualCameraOptions] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [resultBuffer, setResultBuffer] = useState<ArrayBuffer | null>(null);
  const [resultName, setResultName] = useState("");
  const [status, setStatus] = useState("Ready to scan using camera or upload photos.");
  const [statusType, setStatusType] = useState<StatusType>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function bindStreamToVideo() {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
    } catch {
      // If autoplay is blocked, user interaction via capture/start buttons will retry.
    }
  }

  function hasCameraApiSupport() {
    return (
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      !!navigator.mediaDevices.getUserMedia
    );
  }

  async function refreshCameraCapabilities() {
    if (!hasCameraApiSupport() || !navigator.mediaDevices.enumerateDevices) {
      setHasDualCameraOptions(false);
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === "videoinput");

      if (videoInputs.length < 2) {
        setHasDualCameraOptions(false);
        return;
      }

      const labels = videoInputs
        .map((device) => (device.label || "").toLowerCase())
        .filter(Boolean);

      if (!labels.length) {
        // Before permission, labels may be empty. Use count-based fallback.
        setHasDualCameraOptions(videoInputs.length >= 2);
        return;
      }

      const hasFront = labels.some((label) => /(front|user|face)/i.test(label));
      const hasBack = labels.some((label) => /(back|rear|environment|world)/i.test(label));

      setHasDualCameraOptions(hasFront && hasBack);
    } catch {
      setHasDualCameraOptions(false);
    }
  }

  function stopCamera() {
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setIsCameraOn(false);
  }

  async function startCamera() {
    if (!hasCameraApiSupport()) {
      applyStatus(setStatus, setStatusType, "Camera is not supported in this browser.", "error");
      return;
    }

    stopCamera();

    try {
      setIsBusy(true);
      applyStatus(setStatus, setStatusType, "Opening camera...", "");

      const primary = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      });

      streamRef.current = primary;
      await bindStreamToVideo();

      setIsCameraOn(true);
      await refreshCameraCapabilities();
      applyStatus(
        setStatus,
        setStatusType,
        facingMode === "environment"
          ? "Back camera ready. Capture a scan."
          : "Front camera ready. Capture a scan.",
        "success",
      );
    } catch {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        streamRef.current = fallback;
        await bindStreamToVideo();

        setIsCameraOn(true);
        await refreshCameraCapabilities();
        applyStatus(setStatus, setStatusType, "Camera ready. Capture a scan.", "success");
      } catch (error) {
        applyStatus(
          setStatus,
          setStatusType,
          error instanceof Error ? error.message : "Could not open camera.",
          "error",
        );
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function switchCamera() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  useEffect(() => {
    setHasCameraSupport(hasCameraApiSupport());
    void refreshCameraCapabilities();

    if (!hasCameraApiSupport() || !navigator.mediaDevices?.addEventListener) return;

    const onDeviceChange = () => {
      void refreshCameraCapabilities();
    };

    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCameraOn) {
      void startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    if (!isCameraOn) return;

    // When camera is started from the initial view, the video element mounts after stream creation.
    // Re-bind after mount so live preview appears reliably.
    const frame = requestAnimationFrame(() => {
      void bindStreamToVideo();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);

  useEffect(() => {
    return () => {
      stopCamera();
      setPages((prev) => {
        for (const page of prev) {
          URL.revokeObjectURL(page.src);
        }
        return prev;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !isCameraOn) {
      applyStatus(setStatus, setStatusType, "Start camera first.", "error");
      return;
    }

    try {
      setIsBusy(true);

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        throw new Error("Camera not ready yet. Please try again.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not capture camera frame.");

      ctx.drawImage(video, 0, 0, width, height);

      const frameBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (!value) {
            reject(new Error("Could not capture photo."));
            return;
          }
          resolve(value);
        }, "image/jpeg", 0.95);
      });

      const page = await blobToScannedPage(
        frameBlob,
        `scan-${pages.length + 1}.jpg`,
        filterMode,
      );

      setPages((prev) => [...prev, page]);
      setSelectedPageIds((prev) => (prev.includes(page.id) ? prev : [...prev, page.id]));
      setResultBuffer(null);
      setResultName("");
      applyStatus(setStatus, setStatusType, `Captured page ${pages.length + 1}.`, "success");
    } catch (error) {
      applyStatus(
        setStatus,
        setStatusType,
        error instanceof Error ? error.message : "Capture failed.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      applyStatus(setStatus, setStatusType, `${invalid.name} is not an image file.`, "error");
      return;
    }

    try {
      setIsBusy(true);
      applyStatus(setStatus, setStatusType, `Processing ${files.length} photo(s)...`, "");

      const scanned = await Promise.all(
        files.map((file) => blobToScannedPage(file, file.name, filterMode)),
      );

      setPages((prev) => [...prev, ...scanned]);
      setSelectedPageIds((prev) => {
        const next = new Set(prev);
        for (const page of scanned) {
          next.add(page.id);
        }
        return Array.from(next);
      });
      setResultBuffer(null);
      setResultName("");
      applyStatus(setStatus, setStatusType, `${scanned.length} photo(s) added as scan pages.`, "success");
    } catch (error) {
      applyStatus(
        setStatus,
        setStatusType,
        error instanceof Error ? error.message : "Could not process uploaded images.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function removePage(index: number) {
    setPages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.src);
        setSelectedPageIds((selected) => selected.filter((id) => id !== removed.id));
      }
      return next;
    });
    setResultBuffer(null);
    setResultName("");
  }

  function clearAll() {
    setPages((prev) => {
      for (const page of prev) {
        URL.revokeObjectURL(page.src);
      }
      return [];
    });
    setSelectedPageIds([]);
    setResultBuffer(null);
    setResultName("");
    applyStatus(setStatus, setStatusType, "Cleared all scanned pages.", "success");
  }

  function togglePageSelection(pageId: string) {
    setSelectedPageIds((prev) =>
      prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId],
    );
  }

  async function runOnSelectedPages(
    label: string,
    updater: (page: ScannedPage) => Promise<ScannedPage>,
  ) {
    if (!selectedPageIds.length) {
      applyStatus(setStatus, setStatusType, "Select at least one page first.", "error");
      return;
    }

    const selected = new Set(selectedPageIds);
    const sourcePages = pages;

    try {
      setIsBusy(true);
      applyStatus(setStatus, setStatusType, `${label}...`, "");

      const nextPages = await Promise.all(
        sourcePages.map(async (page) => (selected.has(page.id) ? updater(page) : page)),
      );

      const byId = new Map(sourcePages.map((page) => [page.id, page]));
      for (const page of nextPages) {
        const prev = byId.get(page.id);
        if (prev && prev.src !== page.src) {
          URL.revokeObjectURL(prev.src);
        }
      }

      setPages(nextPages);
      setResultBuffer(null);
      setResultName("");
      applyStatus(setStatus, setStatusType, `${label} complete for ${selected.size} page(s).`, "success");
    } catch (error) {
      applyStatus(
        setStatus,
        setStatusType,
        error instanceof Error ? error.message : `${label} failed.`,
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function rotateSelected(direction: "cw" | "ccw") {
    await runOnSelectedPages(
      direction === "cw"
        ? "Rotating selected pages clockwise"
        : "Rotating selected pages counter-clockwise",
      async (page) => {
        const transformed = await transformImageBlob(page.originalBlob, {
          rotateQuarterTurns: direction === "cw" ? 1 : -1,
        });
        const filteredBlob = await applyFilterToBlob(transformed.blob, page.appliedFilterMode);
        return {
          ...page,
          src: URL.createObjectURL(filteredBlob),
          width: transformed.width,
          height: transformed.height,
          originalBlob: transformed.blob,
          blob: filteredBlob,
          appliedFilterMode: page.appliedFilterMode,
        };
      },
    );
  }

  async function flipSelected(axis: "horizontal" | "vertical") {
    await runOnSelectedPages(
      axis === "horizontal"
        ? "Flipping selected pages horizontally"
        : "Flipping selected pages vertically",
      async (page) => {
        const transformed = await transformImageBlob(page.originalBlob, {
          flipX: axis === "horizontal",
          flipY: axis === "vertical",
        });
        const filteredBlob = await applyFilterToBlob(transformed.blob, page.appliedFilterMode);
        return {
          ...page,
          src: URL.createObjectURL(filteredBlob),
          width: transformed.width,
          height: transformed.height,
          originalBlob: transformed.blob,
          blob: filteredBlob,
          appliedFilterMode: page.appliedFilterMode,
        };
      },
    );
  }

  async function applyFilterToSelected(mode: ScanFilterMode = filterMode, silentIfNone = false) {
    if (!selectedPageIds.length) {
      if (!silentIfNone) {
        applyStatus(setStatus, setStatusType, "Select at least one page first.", "error");
      }
      return;
    }

    await runOnSelectedPages("Applying filter to selected pages", async (page) => {
      const filteredBlob = await applyFilterToBlob(page.originalBlob, mode);
      return {
        ...page,
        src: URL.createObjectURL(filteredBlob),
        blob: filteredBlob,
        appliedFilterMode: mode,
      };
    });
  }

  function setFilterMode(mode: ScanFilterMode) {
    setFilterModeState(mode);
    void applyFilterToSelected(mode, true);
  }

  async function generatePdf() {
    if (!pages.length) {
      applyStatus(setStatus, setStatusType, "Capture or upload at least one page.", "error");
      return;
    }

    try {
      setIsBusy(true);
      applyStatus(setStatus, setStatusType, "Generating scanned PDF...", "");

      const pdfDoc = await PDFDocument.create();

      for (const page of pages) {
        const bytes = await page.blob.arrayBuffer();
        const embedded = await pdfDoc.embedJpg(bytes);

        const fit = Math.min(A4_W / embedded.width, A4_H / embedded.height);
        const drawW = embedded.width * fit;
        const drawH = embedded.height * fit;
        const x = (A4_W - drawW) / 2;
        const y = (A4_H - drawH) / 2;

        const pdfPage = pdfDoc.addPage([A4_W, A4_H]);
        pdfPage.drawImage(embedded, { x, y, width: drawW, height: drawH });
      }

      const output = await pdfDoc.save();
      setResultBuffer(output.buffer as ArrayBuffer);
      setResultName("scanned-document.pdf");
      applyStatus(setStatus, setStatusType, "Scanned PDF ready. Click Download PDF.", "success");
    } catch (error) {
      applyStatus(
        setStatus,
        setStatusType,
        error instanceof Error ? error.message : "Could not generate scanned PDF.",
        "error",
      );
    } finally {
      setIsBusy(false);
    }
  }

  function downloadPdf() {
    if (!resultBuffer) return;
    downloadBlob(new Blob([resultBuffer], { type: PDF_MIME }), resultName || "scanned-document.pdf");
  }

  return {
    pages,
    selectedPageIds,
    filterMode,
    setFilterMode,
    facingMode,
    hasDualCameraOptions,
    isCameraOn,
    isBusy,
    hasCameraSupport,
    resultBuffer,
    resultName,
    status,
    statusType,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    captureFromCamera,
    handleUploadImages,
    togglePageSelection,
    rotateSelected,
    flipSelected,
    applyFilterToSelected,
    removePage,
    clearAll,
    generatePdf,
    downloadPdf,
  };
}
