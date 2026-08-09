import type { Building } from "@/lib/domain/Building";

/**
 * Building persistence.
 * TODO: Implement against final Digital Twin schema (Building as source of truth).
 * Do not invent tables here — schema will be designed manually.
 */

export type CreateBuildingInput = {
  address: string;
  customer: string;
  phone: string;
  insurance: string;
  claimNumber: string;
};

export type UpdateBuildingInput = {
  address?: string;
  customer?: string;
  phone?: string;
  insurance?: string;
  claimNumber?: string;
};

export async function createBuilding(
  _input: CreateBuildingInput
): Promise<Building> {
  // TODO: Save building to database
  throw new Error("TODO: Implement createBuilding once buildings schema exists");
}

export async function getBuilding(_id: string): Promise<Building | null> {
  // TODO: Load building from database
  return null;
}

export async function getBuildings(): Promise<Building[]> {
  // TODO: List buildings from database
  return [];
}

export async function updateBuilding(
  _id: string,
  _input: UpdateBuildingInput
): Promise<Building> {
  // TODO: Update building in database
  throw new Error("TODO: Implement updateBuilding once buildings schema exists");
}

export async function deleteBuilding(_id: string): Promise<void> {
  // TODO: Delete building from database
  throw new Error("TODO: Implement deleteBuilding once buildings schema exists");
}
