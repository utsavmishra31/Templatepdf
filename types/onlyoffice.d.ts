// Type declarations for the ONLYOFFICE Documents API (DocsAPI)
// Loaded dynamically from the Document Server at runtime.

interface OnlyOfficeDocumentConfig {
  fileType: string;
  key: string;
  title: string;
  url: string;
  permissions?: {
    edit?: boolean;
    download?: boolean;
    print?: boolean;
    review?: boolean;
    comment?: boolean;
    fillForms?: boolean;
    modifyFilter?: boolean;
    modifyContentControl?: boolean;
    copy?: boolean;
  };
}

interface OnlyOfficeEditorConfig {
  callbackUrl: string;
  mode?: "edit" | "view";
  lang?: string;
  user?: { id: string; name: string };
  customization?: {
    autosave?: boolean;
    forcesave?: boolean;
    compactHeader?: boolean;
    toolbarNoTabs?: boolean;
    hideRulers?: boolean;
    logo?: { image?: string; url?: string };
  };
}

interface OnlyOfficeEvents {
  onAppReady?: () => void;
  onDocumentReady?: () => void;
  onDocumentStateChange?: (event: { data: boolean }) => void;
  onError?: (event: unknown) => void;
  onWarning?: (event: unknown) => void;
  onRequestSaveAs?: (event: unknown) => void;
}

interface OnlyOfficeConfig {
  document: OnlyOfficeDocumentConfig;
  documentType?: "word" | "cell" | "slide";
  editorConfig?: OnlyOfficeEditorConfig;
  events?: OnlyOfficeEvents;
  width?: string;
  height?: string;
  type?: "desktop" | "mobile" | "embedded";
}

interface OnlyOfficeDocEditor {
  destroyEditor(): void;
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        containerId: string,
        config: OnlyOfficeConfig,
      ) => OnlyOfficeDocEditor;
    };
  }
}

export {};
