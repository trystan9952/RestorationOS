/**
 * Global company branding for estimates, PDF, and email.
 *
 * MVP: singleton profile (no auth / multi-tenancy).
 * TODO: Scope by authenticated organization/tenant before beta.
 */

export interface CompanyProfile {
  id: string;
  companyName: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CompanyProfileInput = {
  companyName: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
};
