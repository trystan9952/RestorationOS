import { NextResponse } from "next/server";

import { loadEstimateDocumentById } from "@/lib/estimates/loadEstimateDocument";
import {
  estimatePdfFilename,
  renderEstimatePdfBuffer,
} from "@/lib/pdf/renderEstimatePdf";

/**
 * Generate an estimate PDF from persisted data (estimate ID).
 * TODO: Add authenticated authorization before beta.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      return NextResponse.json(
        { error: "Invalid estimate ID." },
        { status: 400 }
      );
    }

    const document = await loadEstimateDocumentById(id);
    const pdfBuffer = await renderEstimatePdfBuffer(document);
    const filename = estimatePdfFilename(document);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
