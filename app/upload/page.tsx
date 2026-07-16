"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type UploadState = "idle" | "uploading" | "ready" | "error";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [docKey, setDocKey] = useState("");
  const [docName, setDocName] = useState("");
  const [docSize, setDocSize] = useState(0);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Only .docx files are supported.");
      setState("error");
      return;
    }

    setState("uploading");
    setError("");
    setProgress(0);

    const ticker = window.setInterval(() => {
      setProgress((current) => Math.min(current + 12, 85));
    }, 180);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/upload", { method: "POST", body });
      window.clearInterval(ticker);

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: response.statusText }))) as {
          error?: string;
        };
        throw new Error(payload.error || "Upload failed.");
      }

      const data = (await response.json()) as { key: string; name: string; size: number };
      setProgress(100);
      setDocKey(data.key);
      setDocName(data.name);
      setDocSize(data.size);
      setState("ready");
    } catch (err) {
      window.clearInterval(ticker);
      setError(err instanceof Error ? err.message : "Upload failed.");
      setState("error");
    }
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) await uploadFile(file);
    },
    [uploadFile],
  );

  const onInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) await uploadFile(file);
    },
    [uploadFile],
  );

  function openEditor() {
    router.push(`/editor?key=${encodeURIComponent(docKey)}&name=${encodeURIComponent(docName)}`);
  }

  function reset() {
    setState("idle");
    setDocKey("");
    setDocName("");
    setDocSize(0);
    setError("");
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "56px 16px",
      }}
    >
      <div style={{ width: "min(640px, 100%)", marginBottom: 24 }}>
        <Link
          href="/"
          style={{
            color: "var(--accent)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Back to Template Filler
        </Link>
      </div>

      <div style={{ width: "min(640px, 100%)" }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          ONLYOFFICE Document Editor
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: 8, lineHeight: 1.1 }}>
          Upload a Word Document
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: 36, fontSize: 15 }}>
          Upload the original DOCX file. The app stores it unchanged and opens it in ONLYOFFICE,
          so Word layout, tables, spacing, images, fonts, and page rendering stay with the DOCX engine.
        </p>

        {(state === "idle" || state === "error") && (
          <>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
              }}
              role="button"
              tabIndex={0}
              style={{
                border: `2px dashed ${isDragging ? "var(--accent)" : "var(--line)"}`,
                borderRadius: 12,
                background: isDragging ? "var(--accent-soft)" : "rgba(255,255,255,0.7)",
                padding: "56px 32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontSize: 42, marginBottom: 12, lineHeight: 1 }}>DOCX</div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16 }}>
                {isDragging ? "Drop your file here" : "Drag and drop a .docx file"}
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                or click to browse from your computer, max 50 MB
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: "none" }}
                onChange={onInputChange}
              />
            </div>

            {state === "error" && (
              <div
                style={{
                  marginTop: 16,
                  padding: "12px 16px",
                  background: "#fff2f0",
                  border: "1px solid #fca5a5",
                  borderRadius: 8,
                  color: "var(--alert)",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}
          </>
        )}

        {state === "uploading" && (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.9)",
              padding: "40px 32px",
            }}
          >
            <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: 15 }}>Uploading DOCX...</p>
            <div style={{ height: 6, borderRadius: 3, background: "var(--panel-soft)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--accent)",
                  transition: "width 0.2s ease",
                  borderRadius: 3,
                }}
              />
            </div>
            <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 12 }}>
              Saving original file for ONLYOFFICE...
            </p>
          </div>
        )}

        {state === "ready" && (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 12,
              background: "rgba(255,255,255,0.95)",
              padding: 28,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "var(--accent-soft)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                DOCX
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontWeight: 700,
                    fontSize: 16,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {docName}
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{formatBytes(docSize)}</p>
              </div>
              <span
                style={{
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 100,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                Stored
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={openEditor}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "12px 24px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open in ONLYOFFICE
              </button>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "12px 20px",
                  background: "transparent",
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Upload different file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}