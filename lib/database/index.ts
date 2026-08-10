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
  listEquipmentByRoomId,
  type CreateEquipmentInput,
} from "@/lib/database/equipmentRepository";

export {
  createLoss,
  deleteLoss,
  getLoss,
  getLossById,
  listLosses,
  updateLoss,
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
  getPhotoById,
  getPhotos,
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
