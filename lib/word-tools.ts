const WORD_NAMESPACE = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const ELEMENT_NODE = 1;

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
  const document = parser.parseFromString(sourceXml, "application/xml");
  const parserError = document.querySelector?.("parsererror")
    ?? document.getElementsByTagName("parsererror")[0]
    ?? null;

  if (parserError) {
    throw new Error("The Word document XML could not be parsed.");
  }

  const body = document.getElementsByTagNameNS(WORD_NAMESPACE, "body")[0];
  if (!body) {
    throw new Error("The Word document body is missing.");
  }

  return { document, body };
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

export async function deleteWordPages(sourceBuffer: ArrayBuffer, selectedPages: number[]) {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(sourceBuffer.slice(0));
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("The uploaded DOCX file is missing word/document.xml.");
  }

  const sourceXml = await documentFile.async("string");
  const { document, body } = parseWordDocument(sourceXml);
  const { pages, trailingSectionProperties } = extractWordPages(body);

  if (pages.length <= 1) {
    throw new Error("This Word file does not expose removable page boundaries. Add explicit page or section breaks in Word, then upload it again.");
  }

  if (selectedPages.length >= pages.length) {
    throw new Error("You cannot delete all pages. Keep at least one page.");
  }

  const deleteSet = new Set(selectedPages);
  const remainingPages = pages.filter((_, index) => !deleteSet.has(index + 1));

  if (!remainingPages.length) {
    throw new Error("You cannot delete all pages. Keep at least one page.");
  }

  while (body.firstChild) {
    body.removeChild(body.firstChild);
  }

  remainingPages.flat().forEach((node) => {
    body.appendChild(node.cloneNode(true));
  });

  if (trailingSectionProperties) {
    body.appendChild(trailingSectionProperties.cloneNode(true));
  }

  const serializer = new XMLSerializer();
  zip.file("word/document.xml", serializer.serializeToString(document));

  const nextBlob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
  const nextBuffer = await nextBlob.arrayBuffer();
  const bytes = new Uint8Array(nextBuffer.slice(0));

  return {
    bytes,
    nextBuffer,
    removedCount: deleteSet.size,
  };
}