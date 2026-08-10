/**
 * Deterministic scope description → price catalog matching.
 * No AI / fuzzy libraries — normalized token overlap + synonyms.
 */

import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import type { ScopeItem } from "@/lib/domain/ScopeItem";

export type MatchConfidence = "high" | "medium" | "low" | "none";

export type CatalogMatchCandidate = {
  catalogItem: PriceCatalogItem;
  score: number;
  confidence: MatchConfidence;
  matchReason: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "with",
  "from",
  "in",
  "on",
  "at",
  "by",
  "into",
  "wet",
  "damaged",
  "dirty",
  "old",
  "new",
  "all",
  "any",
  "item",
  "items",
  "material",
  "materials",
]);

/** Lightweight synonyms so field language maps to catalog verbs/nouns. */
const SYNONYMS: Record<string, string> = {
  demo: "remove",
  demolish: "remove",
  demolition: "remove",
  tearout: "remove",
  "tear-out": "remove",
  ripout: "remove",
  extract: "remove",
  haul: "remove",
  set: "place",
  place: "place",
  install: "install",
  drywall: "drywall",
  sheetrock: "drywall",
  gypsum: "drywall",
  baseboard: "baseboard",
  base: "baseboard",
  trim: "baseboard",
  flooring: "flooring",
  floor: "flooring",
  carpet: "flooring",
  ceiling: "ceiling",
  insulation: "insulation",
  blower: "air",
  airmover: "air",
  dehumidifier: "dehumidifier",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeToken(token: string): string {
  const mapped = SYNONYMS[token] ?? token;
  return SYNONYMS[mapped] ?? mapped;
}

export function tokenizeForMatch(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(" ")
    .map(canonicalizeToken)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function sharedTokens(a: Set<string>, b: Set<string>): string[] {
  const shared: string[] = [];
  for (const token of a) {
    if (b.has(token)) {
      shared.push(token);
    }
  }
  return shared.sort();
}

/** Distinctive content tokens (not alone-sufficient action verbs). */
const WEAK_ALONE = new Set([
  "remove",
  "install",
  "clean",
  "place",
  "apply",
  "protect",
  "reset",
]);

function hasDistinctiveShared(shared: string[]): boolean {
  return shared.some((token) => !WEAK_ALONE.has(token));
}

function confidenceFromScore(
  score: number,
  shared: string[],
  containment: boolean
): MatchConfidence {
  if (shared.length === 0) {
    return "none";
  }

  // Generic verb-only overlap must not become high confidence
  if (!hasDistinctiveShared(shared)) {
    if (score >= 0.5 || containment) {
      return "low";
    }
    return "none";
  }

  if (score >= 0.55 || (containment && shared.length >= 2)) {
    return "high";
  }
  if (score >= 0.35 || (containment && shared.length >= 1)) {
    return "medium";
  }
  if (score >= 0.2) {
    return "low";
  }
  return "none";
}

function scoreCatalogItem(
  scopeTokens: Set<string>,
  scopeNormalized: string,
  item: PriceCatalogItem
): CatalogMatchCandidate | null {
  const nameNormalized = normalizeText(item.name);
  const descNormalized = item.description
    ? normalizeText(item.description)
    : "";
  const codeNormalized = item.code
    ? item.code.toLowerCase().trim()
    : "";
  const nameTokens = new Set(tokenizeForMatch(item.name));
  const descTokens = new Set(
    item.description ? tokenizeForMatch(item.description) : []
  );
  // Category is available for display/filtering; short section codes (WTR/HMR)
  // must not alone boost every item in that section.
  const catalogTokens = new Set([...nameTokens, ...descTokens]);

  // Exact catalog code mentioned in scope (e.g. "WTRINS") — high confidence.
  // Absence of a code in scope must not lower confidence for text matches.
  if (codeNormalized) {
    const codeAsToken = codeNormalized.replace(/[^a-z0-9]/g, "");
    const scopeHasCode =
      scopeTokens.has(codeAsToken) ||
      scopeNormalized.split(" ").includes(codeNormalized) ||
      new RegExp(`\\b${codeNormalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
        scopeNormalized
      );

    if (scopeHasCode) {
      return {
        catalogItem: item,
        score: 1,
        confidence: "high",
        matchReason: `Matched catalog code: ${item.code}`,
      };
    }
  }

  if (catalogTokens.size === 0) {
    return null;
  }

  const nameJaccard = jaccard(scopeTokens, nameTokens);
  const allJaccard = jaccard(scopeTokens, catalogTokens);
  const score = Math.max(nameJaccard, allJaccard * 0.9);

  const nameContained =
    scopeNormalized.includes(nameNormalized) ||
    nameNormalized.includes(scopeNormalized);
  const shared = sharedTokens(scopeTokens, nameTokens);
  const sharedAll = sharedTokens(scopeTokens, catalogTokens);
  const bestShared = shared.length >= sharedAll.length ? shared : sharedAll;

  // Exact normalized name match
  if (scopeNormalized && scopeNormalized === nameNormalized) {
    return {
      catalogItem: item,
      score: 1,
      confidence: "high",
      matchReason: `Matched catalog name: ${item.name}`,
    };
  }

  // Description equality (imports often set name === description)
  if (
    descNormalized &&
    scopeNormalized === descNormalized &&
    scopeNormalized !== nameNormalized
  ) {
    return {
      catalogItem: item,
      score: 0.98,
      confidence: "high",
      matchReason: `Matched catalog description: ${item.description}`,
    };
  }

  const confidence = confidenceFromScore(score, bestShared, nameContained);
  if (confidence === "none") {
    return null;
  }

  const reason =
    bestShared.length > 0
      ? `Matched shared terms: ${bestShared.join(", ")}`
      : `Matched catalog name: ${item.name}`;

  return {
    catalogItem: item,
    score,
    confidence,
    matchReason: reason,
  };
}

/**
 * Rank active catalog items for a scope description.
 * Inactive catalog items are ignored.
 */
export function matchScopeToCatalog(
  scopeItem: Pick<ScopeItem, "description">,
  catalogItems: PriceCatalogItem[]
): CatalogMatchCandidate[] {
  const scopeNormalized = normalizeText(scopeItem.description);
  const scopeTokens = new Set(tokenizeForMatch(scopeItem.description));

  if (!scopeNormalized || scopeTokens.size === 0) {
    return [];
  }

  const active = catalogItems.filter((item) => item.active);
  const candidates: CatalogMatchCandidate[] = [];

  for (const item of active) {
    const match = scoreCatalogItem(scopeTokens, scopeNormalized, item);
    if (match) {
      candidates.push(match);
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.catalogItem.name.localeCompare(b.catalogItem.name);
  });

  return candidates;
}

export function getBestCatalogMatch(
  scopeItem: Pick<ScopeItem, "description">,
  catalogItems: PriceCatalogItem[]
): CatalogMatchCandidate | null {
  const matches = matchScopeToCatalog(scopeItem, catalogItems);
  return matches[0] ?? null;
}
