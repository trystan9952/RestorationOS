import { DatabaseError, unwrapQuery, unwrapSingle } from "@/lib/database/errors";
import type {
  CompanyProfile,
  CompanyProfileInput,
} from "@/lib/domain/CompanyProfile";
import { getSupabaseClient } from "@/lib/supabase";
import {
  COMPANY_ASSETS_BUCKET,
  type CompanyProfileRow,
} from "@/types/database";

/**
 * Global company profile persistence + logo Storage uploads.
 *
 * MVP: singleton row. Do not create multiple profiles in normal use.
 * TODO: Scope by authenticated organization/tenant before beta.
 */

const ALLOWED_LOGO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function mapCompanyProfileRow(row: CompanyProfileRow): CompanyProfile {
  return {
    id: row.id,
    companyName: row.company_name,
    phone: row.phone?.trim() ? row.phone : null,
    email: row.email?.trim() ? row.email : null,
    website: row.website?.trim() ? row.website : null,
    address: row.address?.trim() ? row.address : null,
    logoUrl: row.logo_url?.trim() ? row.logo_url : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "logo";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "logo";
}

function storagePathFromPublicUrl(publicUrl: string): string | null {
  const markers = [
    `/storage/v1/object/public/${COMPANY_ASSETS_BUCKET}/`,
    `/object/public/${COMPANY_ASSETS_BUCKET}/`,
  ];

  for (const marker of markers) {
    const index = publicUrl.indexOf(marker);
    if (index >= 0) {
      const path = publicUrl.slice(index + marker.length);
      try {
        return decodeURIComponent(path.split("?")[0] ?? "");
      } catch {
        return path.split("?")[0] ?? null;
      }
    }
  }

  return null;
}

async function fetchSingletonRow(): Promise<CompanyProfileRow | null> {
  const supabase = getSupabaseClient();

  const data = unwrapQuery(
    await supabase
      .from("company_profile")
      .select("*")
      .eq("singleton_key", true)
      .maybeSingle()
  );

  return data;
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const row = await fetchSingletonRow();
  return row ? mapCompanyProfileRow(row) : null;
}

/**
 * Ensure the singleton profile exists. Creates a default if missing.
 */
export async function getOrCreateCompanyProfile(): Promise<CompanyProfile> {
  const existing = await getCompanyProfile();
  if (existing) {
    return existing;
  }

  const supabase = getSupabaseClient();

  try {
    const data = unwrapSingle(
      await supabase
        .from("company_profile")
        .insert({
          singleton_key: true,
          company_name: "RestorationOS",
        })
        .select("*")
        .single()
    );
    return mapCompanyProfileRow(data);
  } catch (error) {
    // Concurrent create — reload singleton
    const raced = await getCompanyProfile();
    if (raced) {
      return raced;
    }
    throw error;
  }
}

export async function saveCompanyProfile(
  input: CompanyProfileInput
): Promise<CompanyProfile> {
  const companyName = input.companyName.trim();
  if (!companyName) {
    throw new DatabaseError("Company name is required.");
  }

  const supabase = getSupabaseClient();
  const existing = await fetchSingletonRow();
  const now = new Date().toISOString();

  const payload = {
    company_name: companyName,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    website: input.website?.trim() || null,
    address: input.address?.trim() || null,
    updated_at: now,
  };

  if (existing) {
    const data = unwrapSingle(
      await supabase
        .from("company_profile")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    );
    return mapCompanyProfileRow(data);
  }

  const data = unwrapSingle(
    await supabase
      .from("company_profile")
      .insert({
        singleton_key: true,
        ...payload,
      })
      .select("*")
      .single()
  );

  return mapCompanyProfileRow(data);
}

export async function uploadCompanyLogo(file: File): Promise<CompanyProfile> {
  if (!ALLOWED_LOGO_TYPES.has(file.type)) {
    throw new DatabaseError(
      "Logo must be a JPEG, PNG, WebP, or SVG image."
    );
  }

  if (file.size > MAX_LOGO_BYTES) {
    throw new DatabaseError("Logo must be 5MB or smaller.");
  }

  const profile = await getOrCreateCompanyProfile();
  const supabase = getSupabaseClient();
  const safeName = sanitizeFilename(file.name);
  const storagePath = `logo/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    throw new DatabaseError(uploadError.message, uploadError);
  }

  const { data: publicData } = supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .getPublicUrl(storagePath);

  const previousUrl = profile.logoUrl;

  const data = unwrapSingle(
    await supabase
      .from("company_profile")
      .update({
        logo_url: publicData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select("*")
      .single()
  );

  // Best-effort cleanup of previous logo
  if (previousUrl) {
    const previousPath = storagePathFromPublicUrl(previousUrl);
    if (previousPath) {
      await supabase.storage.from(COMPANY_ASSETS_BUCKET).remove([previousPath]);
    }
  }

  return mapCompanyProfileRow(data);
}

/**
 * Clear logo_url. Storage removal is best-effort and must not fail the update.
 */
export async function deleteCompanyLogo(): Promise<CompanyProfile> {
  const profile = await getOrCreateCompanyProfile();
  const supabase = getSupabaseClient();
  const previousUrl = profile.logoUrl;

  const data = unwrapSingle(
    await supabase
      .from("company_profile")
      .update({
        logo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
      .select("*")
      .single()
  );

  if (previousUrl) {
    try {
      const previousPath = storagePathFromPublicUrl(previousUrl);
      if (previousPath) {
        await supabase.storage
          .from(COMPANY_ASSETS_BUCKET)
          .remove([previousPath]);
      }
    } catch {
      // Profile already cleared — ignore Storage failure
    }
  }

  return mapCompanyProfileRow(data);
}
