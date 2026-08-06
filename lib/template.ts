import type JSZip from "jszip";

const textNodePattern = /(<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>)/g;

// Matches any of: <<...>>, {{...}}, ((...)), [[[...]]]
export const PLACEHOLDER_PATTERN = /<<[^<>]+>>|{{[^{}]+}}|\(\([^()]+\)\)|\[\[[^\[\]]+\]\]/g;

export type PlaceholderEntry = {
  token: string;
  count: number;
  index: number;
};

export function humanizePlaceholder(token: string): string {
  // Strip any outer bracket pair: <<>>, {{}}, (()), [[]]
  const clean = token
    .replace(/^<<|>>$/g, "")
    .replace(/^{{|}}$/g, "")
    .replace(/^\(\(|\)\)$/g, "")
    .replace(/^\[\[|\]\]$/g, "")
    .replace(/[_-]+/g, " ")
    .trim();
  return clean
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/^0i\b/i, "0I");
}

/**
 * Parse a bulk-paste string of the form:
 *   <<PLACEHOLDER>> = value
 *   {{PLACEHOLDER}} → value
 *   [[PLACEHOLDER]] = value
 *
 * Works with ALL four bracket styles and both `=` and `→` separators.
 * Returns a map of token → value (keys are the raw tokens as they appear
 * in the pasted text; the caller matches them to loaded placeholders).
 */
export function parseBulkInput(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const text = input || "";

  // Build a pattern that captures the placeholder AND consumes the separator
  const markerRe = new RegExp(
    `(${PLACEHOLDER_PATTERN.source})[ \\t]*(?:=|\\u2192)[ \\t]*`,
    "g",
  );

  const markers = Array.from(text.matchAll(markerRe));

  markers.forEach((marker, idx) => {
    const token = marker[1];
    if (!token || marker.index === undefined) return;

    const valueStart = marker.index + marker[0].length;
    const valueEnd =
      idx + 1 < markers.length && markers[idx + 1].index !== undefined
        ? (markers[idx + 1].index as number)
        : text.length;

    const value = text
      .slice(valueStart, valueEnd)
      .replace(/^[\s,;|]+/, "")   // strip leading junk
      .replace(/[\s,;|]+$/, "")   // strip trailing junk
      .trim();

    // Keep first occurrence unless a later one has an actual value
    if (!(token in result) || value) {
      result[token] = value;
    }
  });

  return result;
}

export async function extractPlaceholders(zip: JSZip): Promise<PlaceholderEntry[]> {
  const found = new Map<string, PlaceholderEntry>();
  const fileNames = Object.keys(zip.files).filter((name) => name.startsWith("word/") && name.endsWith(".xml"));

  for (const fileName of fileNames) {
    const file = zip.file(fileName);
    if (!file) continue;

    const xml = await file.async("string");
    const text = getJoinedTextNodes(xml);
    const matches = text.matchAll(new RegExp(PLACEHOLDER_PATTERN.source, "g"));

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

export function replaceXmlTokens(xmlText: string, replacements: Record<string, string>): string {
  let updated = xmlText;
  const entries = Object.entries(replacements).sort((left, right) => right[0].length - left[0].length);

  for (const [placeholder, value] of entries) {
    const safeValue = toWordTextXml(value || "");
    const escapedPlaceholder = escapeXml(placeholder);
    const variants = new Set<string>([placeholder, escapedPlaceholder]);

    // Add malformed / partially-entity-encoded variants for each bracket style.
    // Word sometimes stores e.g. <<FOO>> as &lt;&lt;FOO&gt;&gt; in XML and may
    // also produce one-bracket-short versions depending on the renderer.
    if (placeholder.startsWith("<<") && placeholder.endsWith(">>")) {
      const missingClose = placeholder.slice(0, -1);  // <<FOO>
      const missingOpen  = placeholder.slice(1);      // <FOO>>
      variants.add(missingClose); variants.add(escapeXml(missingClose));
      variants.add(missingOpen);  variants.add(escapeXml(missingOpen));
    } else if (placeholder.startsWith("{{") && placeholder.endsWith("}}")) {
      variants.add(placeholder.slice(0, -1));  // {{FOO}
      variants.add(placeholder.slice(1));      // {FOO}}
    } else if (placeholder.startsWith("((") && placeholder.endsWith("))")) {
      variants.add(placeholder.slice(0, -1));  // ((FOO)
      variants.add(placeholder.slice(1));      // (FOO))
    } else if (placeholder.startsWith("[[") && placeholder.endsWith("]]")) {
      variants.add(placeholder.slice(0, -1));  // [[FOO]
      variants.add(placeholder.slice(1));      // [FOO]]
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

export function currentOutputName(customFileName?: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = (customFileName || "document").replace(/\.docx$/i, "").replace(/[^a-z0-9_-]/gi, "-");
  return `${base}-filled-${stamp}`;
}