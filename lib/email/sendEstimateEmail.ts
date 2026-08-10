import { Resend } from "resend";

import {
  estimatePdfFilename,
  renderEstimatePdfBuffer,
} from "@/lib/pdf/renderEstimatePdf";
import type { EstimateDocumentData } from "@/lib/utils/estimateDocument";

export type SendEstimateEmailInput = {
  to: string;
  subject: string;
  message: string;
  document: EstimateDocumentData;
};

export type SendEstimateEmailResult = {
  id: string;
};

function readResendConfig(): { apiKey: string; fromEmail: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    throw new Error(
      "Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the server environment."
    );
  }

  return { apiKey, fromEmail };
}

export function isValidEmailAddress(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 254) {
    return false;
  }
  // Practical MVP validation (not a full RFC parser)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Generate PDF from EstimateDocumentData and email via Resend.
 * TODO: Add authenticated authorization before beta.
 */
export async function sendEstimateEmail(
  input: SendEstimateEmailInput
): Promise<SendEstimateEmailResult> {
  const to = input.to.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!isValidEmailAddress(to)) {
    throw new Error("Please enter a valid email address.");
  }
  if (!subject) {
    throw new Error("Subject is required.");
  }
  if (!message) {
    throw new Error("Message is required.");
  }
  if (subject.length > 200) {
    throw new Error("Subject is too long.");
  }
  if (message.length > 5000) {
    throw new Error("Message is too long.");
  }

  const { apiKey, fromEmail } = readResendConfig();
  const pdfBuffer = await renderEstimatePdfBuffer(input.document);
  const filename = estimatePdfFilename(input.document);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    text: message,
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message || "Failed to send estimate email.");
  }

  return { id: data?.id ?? "sent" };
}
