import { NextResponse } from "next/server";

import { isValidEmailAddress, sendEstimateEmail } from "@/lib/email/sendEstimateEmail";
import { loadEstimateDocumentById } from "@/lib/estimates/loadEstimateDocument";

const MAX_BODY_BYTES = 20_000;

type EmailBody = {
  to?: unknown;
  subject?: unknown;
  message?: unknown;
};

/**
 * Email an estimate PDF built server-side from the estimate ID.
 * Client-supplied totals are ignored.
 *
 * TODO: Add authenticated authorization before beta.
 */
export async function POST(
  request: Request,
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

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      );
    }

    const raw = (await request.json()) as EmailBody;
    const to = typeof raw.to === "string" ? raw.to.trim() : "";
    const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";
    const message = typeof raw.message === "string" ? raw.message.trim() : "";

    if (!isValidEmailAddress(to)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required." },
        { status: 400 }
      );
    }

    // Derive document from persisted estimate — never trust client totals
    const document = await loadEstimateDocumentById(id);
    const result = await sendEstimateEmail({
      to,
      subject,
      message,
      document,
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to email estimate.";
    const status =
      message.includes("not configured")
        ? 503
        : message.includes("not found")
          ? 404
          : message.includes("valid email")
            ? 400
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
