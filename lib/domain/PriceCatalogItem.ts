/**
 * Company-owned reusable price catalog item.
 *
 * Estimate line items snapshot description/unit/unitPrice when selected.
 * They must NOT depend on this row after creation — catalog edits must not
 * silently change existing estimates.
 *
 * TODO: Future company/tenant scoping will own this catalog per organization.
 */

export interface PriceCatalogItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
