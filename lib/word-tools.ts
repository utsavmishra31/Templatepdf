import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const ELEMENT_NODE = 1;
const MAX_DOCX_BYTES = 50 * 1024 * 1024; // 50 MB

type WordPageFragment = {
  element: Element;
  startsNewPageBefore: boolean;
  endsPageAfter: boolean;
};

function isElementNode(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
}

function getWordAttr(element: Element, localName: string) {
  return element.getAttributeNS(WORD_NAMESPACE, localName) ?? element.getAttribute(`w:${localName}`) ?? element.getAttribute(localName);
}

function getParagraphProperties(paragraph: Element): Element | null {
  return (Array.from(paragraph.childNodes).find((node): node is Element => isElementNode(node) && node.localName === "pPr") ?? null);
}

function isExplicitPageBreakNode(node: Node) {
  if (!isElementNode(node)) {
    return false;
  }

  return node.localName === "lastRenderedPageBreak" || (node.localName === "br" && getWordAttr(node, "type") === "page");
}

function cloneRunWithChildren(run: Element, children: Node[]) {
  const nextRun = run.cloneNode(false) as Element;
  children.forEach((child) => nextRun.appendChild(child));
  return nextRun;
}

function removeParagraphPropertyByName(properties: Element, localName: string) {
  Array.from(properties.childNodes)
    .filter((node) => isElementNode(node) && node.localName === localName)
    .forEach((node) => {
      properties.removeChild(node);
    });
}

function paragraphStartsOnNewPage(paragraph: Element) {
  const properties = getParagraphProperties(paragraph);
  if (!properties) {
    return false;
  }

  return properties.getElementsByTagNameNS(WORD_NAMESPACE, "pageBreakBefore").length > 0;
}

function paragraphEndsWithSectionBreak(paragraph: Element) {
  const properties = getParagraphProperties(paragraph);
  if (!properties) {
    return false;
  }

  return properties.getElementsByTagNameNS(WORD_NAMESPACE, "sectPr").length > 0;
}

function paragraphHasExplicitPageBreak(paragraph: Element) {
  return Array.from(paragraph.getElementsByTagNameNS(WORD_NAMESPACE, "br")).some(
    (breakElement) => getWordAttr(breakElement, "type") === "page",
  ) || paragraph.getElementsByTagNameNS(WORD_NAMESPACE, "lastRenderedPageBreak").length > 0;
}

function splitParagraphOnExplicitPageBreaks(paragraph: Element): WordPageFragment[] {
  const paragraphProperties = getParagraphProperties(paragraph);
  const fragments: Array<{ children: Node[]; endsPageAfter: boolean }> = [];
  let currentChildren: Node[] = [];

  const closeFragment = (endsPageAfter: boolean) => {
    if (!currentChildren.length && fragments.length > 0) {
      fragments[fragments.length - 1].endsPageAfter = fragments[fragments.length - 1].endsPageAfter || endsPageAfter;
      return;
    }

    fragments.push({
      children: currentChildren,
      endsPageAfter,
    });
    currentChildren = [];
  };

  const contentChildren = Array.from(paragraph.childNodes).filter((node) => node !== paragraphProperties);

  contentChildren.forEach((child) => {
    if (!isElementNode(child) || child.localName !== "r") {
      currentChildren.push(child.cloneNode(true));
      return;
    }

    let runChildren: Node[] = [];
    Array.from(child.childNodes).forEach((runChild) => {
      if (isExplicitPageBreakNode(runChild)) {
        if (runChildren.length > 0) {
          currentChildren.push(cloneRunWithChildren(child, runChildren));
          runChildren = [];
        }

        closeFragment(true);
        return;
      }

      runChildren.push(runChild.cloneNode(true));
    });

    if (runChildren.length > 0) {
      currentChildren.push(cloneRunWithChildren(child, runChildren));
    }
  });

  if (currentChildren.length > 0 || fragments.length === 0) {
    closeFragment(false);
  }

  const hasSectionBreak = paragraphEndsWithSectionBreak(paragraph);
  const hasStartPageBreak = paragraphStartsOnNewPage(paragraph);

  return fragments.map((fragment, index) => {
    const nextParagraph = paragraph.cloneNode(false) as Element;

    if (paragraphProperties) {
      const propertiesClone = paragraphProperties.cloneNode(true) as Element;
      const isFirst = index === 0;
      const isLast = index === fragments.length - 1;

      if (!isFirst) {
        removeParagraphPropertyByName(propertiesClone, "pageBreakBefore");
      }

      if (!isLast) {
        removeParagraphPropertyByName(propertiesClone, "sectPr");
      }

      nextParagraph.appendChild(propertiesClone);
    }

    fragment.children.forEach((node) => nextParagraph.appendChild(node));

    return {
      element: nextParagraph,
      startsNewPageBefore: index === 0 ? hasStartPageBreak : false,
      endsPageAfter: fragment.endsPageAfter || (index === fragments.length - 1 && hasSectionBreak),
    };
  });
}

function splitBodyElementIntoPages(element: Element): WordPageFragment[] {
  if (element.localName === "p") {
    if (paragraphHasExplicitPageBreak(element)) {
      return splitParagraphOnExplicitPageBreaks(element);
    }

    return [
      {
        element: element.cloneNode(true) as Element,
        startsNewPageBefore: paragraphStartsOnNewPage(element),
        endsPageAfter: paragraphEndsWithSectionBreak(element),
      },
    ];
  }

  return [
    {
      element: element.cloneNode(true) as Element,
      startsNewPageBefore: false,
      endsPageAfter: false,
    },
  ];
}

function parseWordDocument(sourceXml: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(sourceXml, "application/xml");
  const parserError = xmlDoc.getElementsByTagName("parsererror")[0] ?? null;

  if (parserError) {
    throw new Error("The Word document XML could not be parsed.");
  }

  const body = xmlDoc.getElementsByTagNameNS(WORD_NAMESPACE, "body")[0];
  if (!body) {
    throw new Error("The Word document body is missing.");
  }

  // Keep raw xmldom document for serialization; cast body to browser DOM types
  // for internal helpers whose runtime API surface is identical.
  return {
    xmlDoc,
    body: body as unknown as Element,
  };
}

function extractWordPages(body: Element) {
  const bodyChildren = Array.from(body.childNodes).filter(isElementNode);
  const lastChild = bodyChildren.at(-1);
  const trailingSectionProperties = lastChild?.localName === "sectPr" ? bodyChildren.pop() ?? null : null;
  const pages: Element[][] = [[]];

  const startNextPage = () => {
    pages.push([]);
  };

  bodyChildren.forEach((child) => {
    splitBodyElementIntoPages(child).forEach((fragment) => {
      if (fragment.startsNewPageBefore && pages[pages.length - 1].length > 0) {
        startNextPage();
      }

      pages[pages.length - 1].push(fragment.element);

      if (fragment.endsPageAfter) {
        startNextPage();
      }
    });
  });

  const normalizedPages = pages.filter((page) => page.length > 0);
  return {
    pages: normalizedPages,
    trailingSectionProperties,
  };
}

export async function deleteWordPages(sourceBuffer: ArrayBuffer | Buffer | Uint8Array, selectedPages: number[]) {
  if (sourceBuffer.byteLength > MAX_DOCX_BYTES) {
    throw new Error("The DOCX file is too large to process (limit: 50 MB).");
  }

  if (!selectedPages.length) {
    throw new Error("Select at least one page to delete.");
  }

  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(sourceBuffer.slice(0));
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("The uploaded DOCX file is missing word/document.xml.");
  }

  const sourceXml = await documentFile.async("string");
  const { xmlDoc, body } = parseWordDocument(sourceXml);
  const { pages, trailingSectionProperties } = extractWordPages(body);

  if (pages.length <= 1) {
    throw new Error(
      "This Word file has no explicit page breaks or section breaks. Open the file in Microsoft Word, insert a Page Break (Ctrl+Enter) between pages, save, and re-upload.",
    );
  }

  const outOfRange = selectedPages.filter((p) => p < 1 || p > pages.length);
  if (outOfRange.length) {
    throw new Error(`Page number(s) out of range: ${outOfRange.join(", ")}. The document has ${pages.length} page(s).`);
  }

  if (selectedPages.length >= pages.length) {
    throw new Error("You cannot delete all pages. Keep at least one page.");
  }

  const deleteSet = new Set(selectedPages);
  const remainingPages = pages.filter((_, index) => !deleteSet.has(index + 1));
  const isLastPageDeleted = deleteSet.has(pages.length);

  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }

  // Elements are already cloned inside splitBodyElementIntoPages — append directly.
  remainingPages.flat().forEach((node) => {
    body.appendChild(node);
  });

  // Only restore trailing sectPr if the last original page survived deletion.
  // If the last page was deleted, the new last page already carries its own sectPr
  // from the DOCX content, so re-attaching the old one would duplicate it.
  if (trailingSectionProperties && !isLastPageDeleted) {
    body.appendChild(trailingSectionProperties);
  }

  const serializer = new XMLSerializer();
  zip.file("word/document.xml", serializer.serializeToString(xmlDoc));

  const bytes = await zip.generateAsync({
    type: "uint8array",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });

  return {
    bytes,
    removedCount: deleteSet.size,
  };
}