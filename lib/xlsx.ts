import JSZip from "jszip";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type SheetData = {
  name: string;
  rows: string[][];
};

/** Convert a zero-based column index into an Excel column letter (0 -> A, 26 -> AA). */
function columnLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Escape text for use inside XML element content or attributes. */
function escapeXml(value: string): string {
  return value
    // Strip control characters that are illegal in XML 1.0 (keep tab/newline/return).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Decide whether a cell value should be written as a real number so Excel treats
 * it numerically. Kept conservative to avoid mangling IDs, phone numbers, or
 * values with leading zeros.
 */
function isPlainNumber(value: string): boolean {
  if (!/^-?\d+(\.\d+)?$/.test(value)) return false;
  const digits = value.replace(/^-/, "");
  const integerPart = digits.split(".")[0];
  // Preserve values with a significant leading zero (e.g. "007", "0123") as text.
  if (integerPart.length > 1 && integerPart.startsWith("0")) return false;
  // Avoid precision loss for very long numbers.
  if (integerPart.replace(".", "").length > 15) return false;
  return true;
}

/** Ensure sheet names satisfy Excel's constraints and stay unique. */
function sanitizeSheetName(name: string, used: Set<string>): string {
  let cleaned = (name || "Sheet")
    .replace(/[:\\/?*[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);

  if (!cleaned) cleaned = "Sheet";

  let candidate = cleaned;
  let counter = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = `_${counter}`;
    candidate = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    counter += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

function buildWorksheetXml(rows: string[][]): string {
  const rowXml: string[] = [];

  rows.forEach((cells, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cellXml: string[] = [];

    cells.forEach((rawValue, colIndex) => {
      const value = rawValue ?? "";
      if (value === "") return;

      const reference = `${columnLetter(colIndex)}${rowNumber}`;
      if (isPlainNumber(value)) {
        cellXml.push(`<c r="${reference}"><v>${value}</v></c>`);
      } else {
        cellXml.push(
          `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
            value,
          )}</t></is></c>`,
        );
      }
    });

    if (cellXml.length > 0) {
      rowXml.push(`<row r="${rowNumber}">${cellXml.join("")}</row>`);
    } else {
      rowXml.push(`<row r="${rowNumber}"/>`);
    }
  });

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetData>${rowXml.join("")}</sheetData>` +
    `</worksheet>`
  );
}

function buildContentTypesXml(sheetCount: number): string {
  const overrides: string[] = [
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`,
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`,
  ];
  for (let i = 1; i <= sheetCount; i += 1) {
    overrides.push(
      `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    );
  }

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    overrides.join("") +
    `</Types>`
  );
}

function buildStylesXml(): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>` +
    `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>` +
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
    `</styleSheet>`
  );
}

/**
 * Build a valid .xlsx workbook from a list of sheets using only jszip.
 * Uses inline strings (no shared-string table) for simplicity and portability.
 */
export async function buildXlsx(sheets: SheetData[]): Promise<Blob> {
  const safeSheets = sheets.length > 0 ? sheets : [{ name: "Sheet1", rows: [] }];

  const zip = new JSZip();
  const usedNames = new Set<string>();

  const sheetEntries = safeSheets.map((sheet, index) => ({
    fileName: `sheet${index + 1}.xml`,
    displayName: sanitizeSheetName(sheet.name, usedNames),
    relId: `rId${index + 1}`,
    sheetId: index + 1,
    rows: sheet.rows,
  }));

  const stylesRelId = `rId${sheetEntries.length + 1}`;

  zip.file("[Content_Types].xml", buildContentTypesXml(sheetEntries.length));

  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
      `</Relationships>`,
  );

  const sheetTags = sheetEntries
    .map(
      (entry) =>
        `<sheet name="${escapeXml(entry.displayName)}" sheetId="${entry.sheetId}" r:id="${entry.relId}"/>`,
    )
    .join("");

  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
      `<sheets>${sheetTags}</sheets>` +
      `</workbook>`,
  );

  const workbookRels = sheetEntries
    .map(
      (entry) =>
        `<Relationship Id="${entry.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/${entry.fileName}"/>`,
    )
    .join("");

  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      workbookRels +
      `<Relationship Id="${stylesRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`,
  );

  zip.file("xl/styles.xml", buildStylesXml());

  sheetEntries.forEach((entry) => {
    zip.file(`xl/worksheets/${entry.fileName}`, buildWorksheetXml(entry.rows));
  });

  return zip.generateAsync({
    type: "blob",
    mimeType: XLSX_MIME,
    compression: "DEFLATE",
  });
}
