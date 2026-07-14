import type JSZip from "jszip";

const textNodePattern = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;

const spanishMonths = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const englishMonthIndex: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const typeOptions = [
  "VISADO DE TURISTA",
  "VISADO / ESTANCIA A LARGO PLAZO",
  "FINES DE INMIGRACIÓN DISTINTOS DE LA CIUDADANÍA",
  "SOLICITUD DE CIUDADANÍA/NACIONALIDAD",
  "PERMISO DE RESIDENCIA",
  "EMPLEO / VISADO DE EMPLEO / PERMISO DE TRABAJO",
  "EDUCACIÓN / INVESTIGACIÓN",
  "VIAJAR al",
];

const titleOptions = ["Sr.", "Sra."];
const relationOptions = ["hijo de", "hija de", "mujer de"];
const registrarOptions = ["Sub Registrador", "Local Registrador", "Registrador Local (EOMC)"];

export type TemplateKey = "pcc-jalandhar" | "pcc-chandigarh" | "medical" | "birth" | "marriage";

export type TabType = "bulk" | "fields";

export type PlaceholderEntry = {
  token: string;
  count: number;
  index: number;
};

export const templateOptions: Record<TemplateKey, { label: string; templatePath: string; outputName: string }> = {
  "pcc-jalandhar": {
    label: "PCC Jalandhar",
    templatePath: "/templates/pccjalandhar.docx",
    outputName: "pcc-jalandhar-translation",
  },
  "pcc-chandigarh": {
    label: "PCC Chandigarh",
    templatePath: "/templates/pccChandigarh.docx",
    outputName: "pcc-chandigarh-translation",
  },
  medical: {
    label: "Medical",
    templatePath: "/templates/MEDICAL.docx",
    outputName: "medical-translation",
  },
  birth: {
    label: "Birth",
    templatePath: "/templates/BIRTH.docx",
    outputName: "birth-translation",
  },
  marriage: {
    label: "Marriage",
    templatePath: "/templates/MARRIAGE.docx",
    outputName: "marriage-translation",
  },
};

export function humanizePlaceholder(token: string): string {
  const clean = token.replace(/[<>]/g, "").replace(/[_-]+/g, " ").trim();
  return clean
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/^0i\b/i, "0I");
}

export function getDropdownLookupKey(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getDropdownOptions(token: string): string[] {
  if (token === "<<TYPE>>") return typeOptions;
  if (token === "<<TITLE>>") return titleOptions;
  if (token === "<<RELATION>>") return relationOptions;
  if (token === "<<REGISTRAR>>") return registrarOptions;
  return [];
}

export function hasDropdownOptions(token: string): boolean {
  return getDropdownOptions(token).length > 0;
}

export function isAutomaticDatePlaceholder(token: string): boolean {
  return token === "<<T_DATE>>" || token === "<<TODAY_DATE>>";
}

export function getAutomaticDateReplacements(): Record<string, string> {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return {
    "<<T_DATE>>": `${day}/${month}/${year}`,
    "<<TODAY_DATE>>": `${day} de ${spanishMonths[today.getMonth()]} de ${year}`,
  };
}

export function normalizeDateValue(value: string): string {
  const dateMatch = String(value || "").trim().match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{4})$/);
  if (!dateMatch) return value;

  const monthIndex = englishMonthIndex[dateMatch[2].toLowerCase()];
  if (monthIndex === undefined) return value;

  const day = dateMatch[1].padStart(2, "0");
  return `${day} de ${spanishMonths[monthIndex]} de ${dateMatch[3]}`;
}

export function parseBulkPlaceholderValues(input: string): Record<string, string> {
  const values: Record<string, string> = {};
  const text = input || "";
  const markerPattern = /<<[^<>]+>>\s*(?:=|\u2192)/g;
  const markers = Array.from(text.matchAll(markerPattern));

  markers.forEach((marker, index) => {
    const placeholderMatch = marker[0].match(/<<[^<>]+>>/);
    if (!placeholderMatch || marker.index === undefined) return;

    const placeholder = placeholderMatch[0];
    const valueStart = marker.index + marker[0].length;
    const valueEnd = index + 1 < markers.length && markers[index + 1].index !== undefined ? markers[index + 1].index : text.length;
    const value = cleanBulkValue(text.slice(valueStart, valueEnd));

    if (value || !(placeholder in values)) {
      values[placeholder] = value;
    }
  });

  return values;
}

function cleanBulkValue(value: string): string {
  const cleaned = value
    .replace(/^\s*[,;|]+\s*/, "")
    .replace(/\s*[,;|]+\s*$/, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  return normalizeDateValue(cleaned);
}

export async function extractPlaceholders(zip: JSZip): Promise<PlaceholderEntry[]> {
  const found = new Map<string, PlaceholderEntry>();
  const fileNames = Object.keys(zip.files).filter((name) => name.startsWith("word/") && name.endsWith(".xml"));

  for (const fileName of fileNames) {
    const file = zip.file(fileName);
    if (!file) continue;

    const xml = await file.async("string");
    const text = getJoinedTextNodes(xml);
    const matches = text.matchAll(/<<[^<>]+>>/g);

    for (const match of matches) {
      const token = match[0];
      if (!found.has(token)) {
        found.set(token, { token, count: 0, index: found.size });
      }
      const entry = found.get(token);
      if (entry) {
        entry.count += 1;
      }
    }
  }

  return Array.from(found.values()).sort((left, right) => left.index - right.index);
}

function getJoinedTextNodes(xml: string): string {
  return Array.from(xml.matchAll(textNodePattern), (match) => decodeXml(match[2])).join("");
}

export function getDisplayPlaceholders(selectedKey: TemplateKey | "", placeholders: PlaceholderEntry[]): PlaceholderEntry[] {
  if (!selectedKey.startsWith("pcc-")) {
    return placeholders;
  }

  const ordered = placeholders.filter(({ token }) => token !== "<<NAME>>");
  const namePlaceholder = placeholders.find(({ token }) => token === "<<NAME>>");
  const titleIndex = ordered.findIndex(({ token }) => token === "<<TITLE>>");

  if (!namePlaceholder || titleIndex < 0) {
    return placeholders;
  }

  ordered.splice(titleIndex + 1, 0, namePlaceholder);
  return ordered;
}

export function replaceXmlTokens(xmlText: string, replacements: Record<string, string>): string {
  let updated = xmlText;
  const entries = Object.entries(replacements).sort((left, right) => right[0].length - left[0].length);

  for (const [placeholder, value] of entries) {
    const safeValue = toWordTextXml(value || "");
    const escapedPlaceholder = escapeXml(placeholder);
    const variants = new Set<string>([placeholder, escapedPlaceholder]);

    if (placeholder.endsWith(">>")) {
      const malformed = placeholder.slice(0, -1);
      variants.add(malformed);
      variants.add(escapeXml(malformed));
    }

    if (placeholder.startsWith("<<")) {
      const missingOpen = placeholder.slice(1);
      variants.add(missingOpen);
      variants.add(escapeXml(missingOpen));
    }

    variants.forEach((variant) => {
      updated = replaceLiteral(updated, variant, safeValue);
      updated = replaceAllSplitTextTokens(updated, decodeXml(variant), value || "");
    });
  }

  return updated;
}

function replaceLiteral(text: string, search: string, replacement: string): string {
  if (!search) return text;
  return text.split(search).join(replacement);
}

function replaceAllSplitTextTokens(xmlText: string, placeholder: string, value: string): string {
  let updated = xmlText;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const next = replaceSplitTextToken(updated, placeholder, value);
    if (next === updated) return updated;
    updated = next;
  }

  return updated;
}

function replaceSplitTextToken(xmlText: string, placeholder: string, value: string): string {
  const textNodes: Array<{
    contentStart: number;
    contentEnd: number;
    textStart: number;
    textEnd: number;
    text: string;
  }> = [];
  const joinedParts: string[] = [];
  let cursor = 0;

  for (const match of xmlText.matchAll(textNodePattern)) {
    if (match.index === undefined) continue;
    const nodeText = decodeXml(match[2]);
    const start = cursor;
    const end = start + nodeText.length;

    textNodes.push({
      contentStart: match.index + match[1].length,
      contentEnd: match.index + match[1].length + match[2].length,
      textStart: start,
      textEnd: end,
      text: nodeText,
    });

    joinedParts.push(nodeText);
    cursor = end;
  }

  const joinedText = joinedParts.join("");
  const tokenStart = joinedText.toLowerCase().indexOf(placeholder.toLowerCase());

  if (tokenStart < 0) {
    return xmlText;
  }

  const tokenEnd = tokenStart + placeholder.length;
  const replacements: Array<[number, number, string]> = [];
  let wroteValue = false;

  textNodes.forEach((node) => {
    if (node.textEnd <= tokenStart || node.textStart >= tokenEnd) {
      return;
    }

    const prefix = tokenStart > node.textStart ? node.text.slice(0, Math.max(tokenStart - node.textStart, 0)) : "";
    const suffix = tokenEnd < node.textEnd ? node.text.slice(tokenEnd - node.textStart) : "";
    const replacementText = wroteValue ? suffix : `${prefix}${value}${suffix}`;
    wroteValue = true;

    replacements.push([node.contentStart, node.contentEnd, toWordTextXml(replacementText)]);
  });

  return replacements.reduceRight((result, [start, end, replacement]) => {
    return result.slice(0, start) + replacement + result.slice(end);
  }, xmlText);
}

function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toWordTextXml(value: string): string {
  return String(value)
    .split(/\r\n|\r|\n/)
    .map((line) => escapeXml(line))
    .join("</w:t><w:br/><w:t xml:space=\"preserve\">");
}

export function decodeXml(value: string): string {
  if (typeof window === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

export function cssEscape(value: string): string {
  if (typeof window !== "undefined" && window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/(["\\])/g, "\\$1");
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function currentOutputName(selectedKey: TemplateKey | ""): string {
  if (!selectedKey) {
    return "translation";
  }
  const template = templateOptions[selectedKey];
  const stamp = new Date().toISOString().slice(0, 10);
  return `${template.outputName}-${stamp}`;
}