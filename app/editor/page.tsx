"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type EditorStatus = "loading" | "ready" | "error" | "missing-config";

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function OnlyOfficeEditor() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key") ?? "";
  const name = searchParams.get("name") ?? "Document.docx";
  const editorRef = useRef<{ destroyEditor(): void } | null>(null);
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const serverUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_ONLYOFFICE_SERVER_URL ?? "");
  const appUrl = stripTrailingSlash(process.env.NEXT_PUBLIC_APP_URL ?? "");

  useEffect(() => {
    if (!key) {
      window.location.replace("/upload");
      return;
    }

    if (!serverUrl || !appUrl) {
      setStatus("missing-config");
      return;
    }

    let cancelled = false;

    function initEditor() {
      if (cancelled) return;

      if (!window.DocsAPI) {
        setStatus("error");
        setErrorMessage(`DocsAPI was not found after loading ${serverUrl}/web-apps/apps/api/documents/api.js`);
        return;
      }

      editorRef.current?.destroyEditor();
      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
        document: {
          fileType: "docx",
          key,
          title: name,
          url: `${appUrl}/api/files/${key}`,
          permissions: {
            edit: true,
            download: true,
            print: true,
            review: true,
            comment: true,
          },
        },
        documentType: "word",
        editorConfig: {
          callbackUrl: `${appUrl}/api/callback?key=${encodeURIComponent(key)}`,
          mode: "edit",
          lang: "en",
          customization: {
            autosave: true,
            compactHeader: false,
            toolbarNoTabs: false,
          },
          user: {
            id: "local-user",
            name: "Local User",
          },
        },
        events: {
          onAppReady: () => setStatus("ready"),
          onDocumentReady: () => setStatus("ready"),
          onError: (event) => {
            setStatus("error");
            setErrorMessage(JSON.stringify(event, null, 2));
          },
        },
        height: "100%",
        width: "100%",
      });
    }

    if (window.DocsAPI) {
      initEditor();
    } else {
      const scriptId = "onlyoffice-docs-api";
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", initEditor, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `${serverUrl}/web-apps/apps/api/documents/api.js`;
        script.async = true;
        script.onload = initEditor;
        script.onerror = () => {
          if (cancelled) return;
          setStatus("error");
          setErrorMessage(
            `Failed to load ONLYOFFICE API script from ${serverUrl}/web-apps/apps/api/documents/api.js`,
          );
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      editorRef.current?.destroyEditor();
      editorRef.current = null;
    };
  }, [appUrl, key, name, serverUrl]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 16px",
          height: 48,
          background: "var(--panel)",
          borderBottom: "1px solid var(--line)",
          flexShrink: 0,
          zIndex: 30,
        }}
      >
        <Link href="/upload" style={{ color: "var(--muted)", textDecoration: "none", fontSize: 18 }}>
          Back
        </Link>
        <span style={{ fontWeight: 700, fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </span>
        {status === "ready" && (
          <span
            style={{
              fontSize: 11,
              color: "#166534",
              background: "#dcfce7",
              padding: "2px 10px",
              borderRadius: 100,
              fontWeight: 700,
              letterSpacing: "0.04em",
              flexShrink: 0,
            }}
          >
            ONLYOFFICE LIVE
          </span>
        )}
        <Link
          href="/upload"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--accent)",
            textDecoration: "none",
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--accent)",
            flexShrink: 0,
          }}
        >
          Upload new
        </Link>
      </header>

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div id="onlyoffice-editor" style={{ width: "100%", height: "100%" }} />

        {status === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8f8f8",
              color: "var(--muted)",
              fontSize: 14,
            }}
          >
            Connecting to ONLYOFFICE Document Server...
          </div>
        )}

        {status === "missing-config" && (
          <EditorMessage
            title="ONLYOFFICE is not configured"
            message="Set NEXT_PUBLIC_ONLYOFFICE_SERVER_URL and NEXT_PUBLIC_APP_URL in .env.local, then restart npm run dev."
          />
        )}

        {status === "error" && <EditorMessage title="ONLYOFFICE failed to load" message={errorMessage} />}
      </div>
    </div>
  );
}

function EditorMessage({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 20, color: "var(--ink)" }}>{title}</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#fff",
            border: "1px solid var(--line)",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            color: "var(--muted)",
            margin: "0 0 16px",
          }}
        >
          {message}
        </pre>
        <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
          Local command when Docker is available:
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            margin: 0,
          }}
        >
          docker run -p 80:80 onlyoffice/documentserver
        </pre>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "var(--muted)" }}>Loading editor...</div>}>
      <OnlyOfficeEditor />
    </Suspense>
  );
}