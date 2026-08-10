import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { EstimatePdfDocument } from "@/lib/pdf/EstimatePdfDocument";
import type { EstimateDocumentData } from "@/lib/utils/estimateDocument";
import { sanitizeEstimatePdfFilename } from "@/lib/utils/estimateDocument";

export async function renderEstimatePdfBuffer(
  document: EstimateDocumentData
): Promise<Buffer> {
  const element = createElement(EstimatePdfDocument, {
    document,
  }) as ReactElement;
  // @react-pdf typings expect DocumentProps; our wrapper returns <Document>.
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0]);
  return Buffer.from(buffer);
}

export function estimatePdfFilename(document: EstimateDocumentData): string {
  return sanitizeEstimatePdfFilename(document.estimate.estimateNumber);
}
