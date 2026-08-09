export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME = "application/pdf";
export const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const PPT_MIME = "application/vnd.ms-powerpoint";

export async function getApiErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { message?: string };
      return payload.message || fallbackMessage;
    }
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function requestWordPreviewPdf(
  fileName: string,
  sourceBuffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: DOCX_MIME }),
  );

  const response = await fetch("/api/word-preview", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Word preview generation failed."),
    );
  }

  return response.arrayBuffer();
}

export async function requestPdfPageDeletion(
  fileName: string,
  sourceBuffer: ArrayBuffer,
  selectedPages: number[],
): Promise<{ nextBuffer: ArrayBuffer; removedCount: number }> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: PDF_MIME }),
  );
  formData.set("selectedPages", JSON.stringify(selectedPages));

  const response = await fetch("/api/pdf-delete", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "PDF page deletion failed."),
    );
  }

  const nextBuffer = await response.arrayBuffer();
  const removedCount = Number.parseInt(
    response.headers.get("x-removed-count") || "",
    10,
  );

  return {
    nextBuffer,
    removedCount: Number.isFinite(removedCount)
      ? removedCount
      : selectedPages.length,
  };
}

export async function requestWordPageDeletion(
  fileName: string,
  sourceBuffer: ArrayBuffer,
  selectedPages: number[],
): Promise<{ nextBuffer: ArrayBuffer; removedCount: number }> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: DOCX_MIME }),
  );
  formData.set("selectedPages", JSON.stringify(selectedPages));

  const response = await fetch("/api/word-delete", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Word page deletion failed."),
    );
  }

  const nextBuffer = await response.arrayBuffer();
  const removedCount = Number.parseInt(
    response.headers.get("x-removed-count") || "",
    10,
  );

  return {
    nextBuffer,
    removedCount: Number.isFinite(removedCount)
      ? removedCount
      : selectedPages.length,
  };
}

export async function requestPdfToWordConversion(
  fileName: string,
  sourceBuffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: "application/pdf" }),
  );

  const response = await fetch("/api/pdf-to-word", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "PDF to Word conversion failed."),
    );
  }

  return response.arrayBuffer();
}

export async function requestPdfToPptConversion(
  fileName: string,
  sourceBuffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: "application/pdf" }),
  );

  const response = await fetch("/api/pdf-to-ppt", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "PDF to PPT conversion failed."),
    );
  }

  return response.arrayBuffer();
}

export async function requestPptToPdfConversion(
  fileName: string,
  sourceBuffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: PPTX_MIME }),
  );

  const response = await fetch("/api/ppt-to-pdf", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "PPT to PDF conversion failed."),
    );
  }

  return response.arrayBuffer();
}

export async function requestPdfCompression(
  fileName: string,
  sourceBuffer: ArrayBuffer,
  mode: "normal" | "extreme",
): Promise<{ buffer: ArrayBuffer; compressedSize: number }> {
  const formData = new FormData();
  formData.set(
    "file",
    new File([sourceBuffer.slice(0)], fileName, { type: "application/pdf" }),
  );
  formData.set("mode", mode);

  const response = await fetch("/api/pdf-compress", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "PDF compression failed."),
    );
  }

  const buffer = await response.arrayBuffer();
  const compressedSize = Number.parseInt(
    response.headers.get("x-compressed-size") ?? "",
    10,
  );

  return {
    buffer,
    compressedSize: Number.isFinite(compressedSize)
      ? compressedSize
      : buffer.byteLength,
  };
}

export type ImageConvertFormat = "png" | "jpg" | "jpeg" | "webp" | "avif";

export async function requestImageConversion(
  files: File[],
  outputFormat: ImageConvertFormat,
): Promise<{
  buffer: ArrayBuffer;
  contentType: string;
  fileName: string;
  outputKind: "single" | "zip";
}> {
  const formData = new FormData();
  formData.set("format", outputFormat);

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch("/api/image-convert", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await getApiErrorMessage(response, "Image conversion failed."),
    );
  }

  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
    fileName: response.headers.get("x-output-filename") || "converted-file",
    outputKind:
      response.headers.get("x-output-kind") === "zip" ? "zip" : "single",
  };
}
