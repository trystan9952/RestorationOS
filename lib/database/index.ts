/**
 * Repository layer for RestorationOS.
 * Pages/stores import from here — not from Supabase directly.
 */

export {
  DatabaseError,
  getErrorMessage,
  unwrapQuery,
  unwrapSingle,
} from "@/lib/database/errors";

export {
  createBuilding,
  deleteBuilding,
  getBuilding,
  getBuildings,
  updateBuilding,
  type CreateBuildingInput,
  type UpdateBuildingInput,
} from "@/lib/database/buildingRepository";

export {
  createEquipment,
  deleteEquipment,
  getEquipment,
  listEquipmentByRoomId,
  updateEquipmentStatus,
  type CreateEquipmentInput,
} from "@/lib/database/equipmentRepository";

export {
  createLoss,
  deleteLoss,
  getLoss,
  getLossById,
  getLosses,
  listLosses,
  updateLoss,
  updateLossStatus,
  type CreateLossInput,
  type UpdateLossInput,
} from "@/lib/database/lossRepository";

export {
  createMoistureReading,
  deleteMoistureReading,
  getMoistureReadings,
  listMoistureReadingsByRoomId,
  type CreateMoistureReadingInput,
} from "@/lib/database/moistureRepository";

export {
  createPhoto,
  deletePhoto,
  deleteRoomPhotoFiles,
  getPhotoById,
  getPhotos,
  getPhotosByLossId,
  listPhotosByRoomId,
  updatePhoto,
  uploadRoomPhoto,
  type CreatePhotoInput,
  type UpdatePhotoInput,
  type UploadRoomPhotoInput,
} from "@/lib/database/photoRepository";

export {
  createRoom,
  deleteRoom,
  getRoomById,
  getRooms,
  listRoomsByLossId,
  updateRoom,
  type CreateRoomInput,
  type UpdateRoomInput,
} from "@/lib/database/roomRepository";

export {
  createRoomNote,
  getRoomNotes,
  type CreateRoomNoteInput,
} from "@/lib/database/roomNoteRepository";

export {
  createScopeItem,
  deleteScopeItem,
  getScopeItems,
  updateScopeItem,
  type CreateScopeItemInput,
  type UpdateScopeItemInput,
} from "@/lib/database/scopeRepository";

export {
  createEstimate,
  createEstimateArea,
  createEstimateLineItem,
  deleteEstimateArea,
  deleteEstimateLineItem,
  getEstimateAreas,
  getEstimateByLossId,
  getEstimateLineItems,
  updateEstimateArea,
  updateEstimateLineItem,
  updateEstimateStatus,
  type CreateEstimateAreaInput,
  type CreateEstimateLineItemInput,
  type UpdateEstimateAreaInput,
  type UpdateEstimateLineItemInput,
} from "@/lib/database/estimateRepository";

export {
  createRoomMeasurement,
  deleteRoomMeasurement,
  getRoomMeasurement,
  updateRoomMeasurement,
  type CreateRoomMeasurementInput,
  type UpdateRoomMeasurementInput,
} from "@/lib/database/roomMeasurementRepository";

export {
  createPriceCatalogItem,
  deletePriceCatalogItem,
  getActivePriceCatalogItems,
  getPriceCatalogCategories,
  getPriceCatalogItems,
  setPriceCatalogItemActive,
  updatePriceCatalogItem,
  type CreatePriceCatalogItemInput,
  type UpdatePriceCatalogItemInput,
} from "@/lib/database/priceCatalogRepository";
