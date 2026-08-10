import {
  getCompanyProfile,
  getEstimateAreas,
  getEstimateById,
  getEstimateLineItems,
  getLossById,
  getRooms,
} from "@/lib/database";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import {
  buildEstimateDocumentData,
  type EstimateDocumentData,
} from "@/lib/utils/estimateDocument";

/**
 * Server-side loader: estimate ID → persisted data → EstimateDocumentData.
 * Does NOT use activeLossId. Totals are derived from persisted line items.
 *
 * TODO: Add authenticated authorization before beta.
 */
export async function loadEstimateDocumentById(
  estimateId: string
): Promise<EstimateDocumentData> {
  const trimmedId = estimateId.trim();
  if (!trimmedId) {
    throw new Error("Estimate ID is required.");
  }

  const estimate = await getEstimateById(trimmedId);
  if (!estimate) {
    throw new Error("Estimate not found.");
  }

  const loss = await getLossById(estimate.lossId);
  if (!loss) {
    throw new Error("Loss for this estimate was not found.");
  }

  const [areas, rooms, company] = await Promise.all([
    getEstimateAreas(estimate.id),
    getRooms(loss.id),
    getCompanyProfile(),
  ]);

  const lineItemEntries = await Promise.all(
    areas.map(async (area) => {
      const items = await getEstimateLineItems(area.id);
      return [area.id, items] as const;
    })
  );

  const lineItemsByAreaId: Record<string, EstimateLineItem[]> = {};
  for (const [areaId, items] of lineItemEntries) {
    lineItemsByAreaId[areaId] = items;
  }

  return buildEstimateDocumentData({
    company,
    estimate,
    loss,
    areas,
    lineItemsByAreaId,
    rooms,
  });
}
