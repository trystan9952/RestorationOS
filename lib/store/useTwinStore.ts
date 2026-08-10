import { create } from "zustand";

import {
  createEquipment,
  createEstimate,
  createEstimateArea,
  createEstimateLineItem,
  createLoss,
  createMoistureReading,
  createRoom,
  createRoomNote,
  createScopeItem,
  deleteEstimateArea as removePersistedEstimateArea,
  deleteEstimateLineItem as removePersistedEstimateLineItem,
  deleteRoom as removePersistedRoom,
  deleteScopeItem as removePersistedScopeItem,
  getEquipment,
  getEstimateAreas,
  getEstimateByLossId,
  getEstimateLineItems,
  getLoss,
  getLosses,
  getMoistureReadings,
  getPhotos,
  getRoomNotes,
  getRooms,
  getScopeItems,
  updateEquipmentStatus as persistEquipmentStatus,
  updateEstimateArea as persistEstimateAreaUpdate,
  updateEstimateLineItem as persistEstimateLineItemUpdate,
  updateEstimateStatus as persistEstimateStatus,
  updateLoss as persistLossUpdate,
  updateLossStatus as persistLossStatus,
  deleteLoss as removePersistedLoss,
  updateRoom as persistRoomUpdate,
  updateScopeItem as persistScopeItemUpdate,
  uploadRoomPhoto,
  type CreateLossInput,
  type CreateRoomInput,
  type UpdateLossInput,
  type UpdateRoomInput,
} from "@/lib/database";
import { getErrorMessage } from "@/lib/database/errors";
import type { Equipment, EquipmentStatus } from "@/lib/domain/Equipment";
import type { Estimate, EstimateStatus } from "@/lib/domain/Estimate";
import type { EstimateArea } from "@/lib/domain/EstimateArea";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import type { Loss, LossStatus } from "@/lib/domain/Loss";
import type { MoistureReading } from "@/lib/domain/MoistureReading";
import type { Photo } from "@/lib/domain/Photo";
import type { Room } from "@/lib/domain/Room";
import type { RoomNote } from "@/lib/domain/RoomNote";
import type { ScopeItem } from "@/lib/domain/ScopeItem";
import { runAsyncAction } from "@/lib/store/async";
import type { AsyncStatus } from "@/types";

export type { Room };

const ACTIVE_LOSS_STORAGE_KEY = "restorationos.activeLossId";

type TwinState = {
  address: string;
  customer: string;
  rooms: Room[];

  /** Frontend cache of persisted photos, keyed by room id. */
  photosByRoomId: Record<string, Photo[]>;
  photoStatus: AsyncStatus;
  photoError: string | null;
  isUploadingPhotos: boolean;

  /** Frontend cache of persisted moisture readings, keyed by room id. */
  moistureByRoomId: Record<string, MoistureReading[]>;
  moistureError: string | null;
  isSavingMoisture: boolean;

  /** Frontend cache of persisted room notes, keyed by room id. */
  notesByRoomId: Record<string, RoomNote[]>;
  noteError: string | null;
  isSavingNote: boolean;

  /** Frontend cache of persisted equipment, keyed by room id. */
  equipmentByRoomId: Record<string, Equipment[]>;
  equipmentError: string | null;
  isSavingEquipment: boolean;
  isUpdatingEquipmentStatus: boolean;

  /** Frontend cache of persisted room scope items, keyed by room id. */
  scopeItemsByRoomId: Record<string, ScopeItem[]>;
  scopeError: string | null;
  isSavingScope: boolean;
  isUpdatingScope: boolean;
  isDeletingScope: boolean;

  /** Frontend cache of estimates (one per loss in MVP). */
  estimateByLossId: Record<string, Estimate>;
  estimateAreasByEstimateId: Record<string, EstimateArea[]>;
  estimateLineItemsByAreaId: Record<string, EstimateLineItem[]>;
  estimateStatus: AsyncStatus;
  estimateError: string | null;
  isSavingEstimateArea: boolean;
  isSavingEstimateLineItem: boolean;
  isUpdatingEstimate: boolean;
  isDeletingEstimateArea: boolean;
  isDeletingEstimateLineItem: boolean;

  activeLossId: string | null;
  activeLoss: Loss | null;
  isUpdatingLossStatus: boolean;
  isUpdatingLoss: boolean;
  isDeletingLoss: boolean;
  lossError: string | null;

  /** Frontend cache of all losses for the Jobs home list. */
  losses: Loss[];
  lossesStatus: AsyncStatus;
  lossesError: string | null;

  status: AsyncStatus;
  error: string | null;

  setAddress: (address: string) => void;
  setCustomer: (customer: string) => void;

  /**
   * Persist room to Supabase, then reload rooms into the Zustand cache.
   */
  addRoom: (name: string) => Promise<void>;

  /**
   * Hydrate active loss + rooms from Supabase (after refresh).
   */
  hydrateFromDatabase: () => Promise<void>;

  /**
   * Load photos/moisture/notes/equipment for every room in the active loss.
   * Reuses existing repositories and room-keyed caches (for dashboard counts/activity).
   */
  loadLossRoomDetails: () => Promise<void>;

  loadRoomPhotos: (roomId: string) => Promise<Photo[]>;
  uploadRoomPhotos: (roomId: string, files: File[]) => Promise<Photo[]>;
  clearPhotoError: () => void;

  loadMoistureReadings: (roomId: string) => Promise<MoistureReading[]>;
  saveMoistureReading: (input: {
    roomId: string;
    material: string;
    reading: number;
    location: string;
  }) => Promise<MoistureReading>;
  clearMoistureError: () => void;

  loadRoomNotes: (roomId: string) => Promise<RoomNote[]>;
  saveRoomNote: (roomId: string, note: string) => Promise<RoomNote>;
  clearNoteError: () => void;

  loadRoomEquipment: (roomId: string) => Promise<Equipment[]>;
  saveEquipment: (
    roomId: string,
    equipment: {
      equipmentType: string;
      assetNumber?: string | null;
      status: EquipmentStatus;
      location: string;
    }
  ) => Promise<Equipment>;
  updateEquipmentStatus: (
    roomId: string,
    equipmentId: string,
    status: EquipmentStatus
  ) => Promise<Equipment>;
  clearEquipmentError: () => void;

  loadRoomScope: (roomId: string) => Promise<ScopeItem[]>;
  saveScopeItem: (roomId: string, description: string) => Promise<ScopeItem>;
  toggleScopeItem: (roomId: string, scopeItemId: string) => Promise<ScopeItem>;
  deleteScopeItem: (roomId: string, scopeItemId: string) => Promise<void>;
  clearScopeError: () => void;

  /**
   * Load or create the single estimate for a loss, then hydrate areas/line items.
   */
  loadEstimateForLoss: (lossId: string) => Promise<Estimate>;
  createEstimateForLoss: (lossId: string) => Promise<Estimate>;
  loadEstimateAreas: (estimateId: string) => Promise<EstimateArea[]>;
  saveEstimateArea: (input: {
    estimateId: string;
    name: string;
    roomId?: string | null;
  }) => Promise<EstimateArea>;
  updateEstimateArea: (
    estimateId: string,
    areaId: string,
    name: string
  ) => Promise<EstimateArea>;
  deleteEstimateArea: (estimateId: string, areaId: string) => Promise<void>;
  loadEstimateLineItems: (areaId: string) => Promise<EstimateLineItem[]>;
  saveEstimateLineItem: (input: {
    areaId: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }) => Promise<EstimateLineItem>;
  updateEstimateLineItem: (
    areaId: string,
    lineItemId: string,
    input: {
      description: string;
      quantity: number;
      unit: string;
      unitPrice: number;
    }
  ) => Promise<EstimateLineItem>;
  deleteEstimateLineItem: (areaId: string, lineItemId: string) => Promise<void>;
  updateEstimateStatus: (
    estimateId: string,
    status: EstimateStatus
  ) => Promise<Estimate>;
  clearEstimateError: () => void;

  setActiveLossId: (lossId: string | null) => void;
  clearError: () => void;
  clearLossError: () => void;
  clearLossesError: () => void;
  updateLossStatus: (status: LossStatus) => Promise<Loss>;

  /** Update job/customer fields on the active loss (status excluded). */
  updateLossDetails: (
    input: Omit<UpdateLossInput, "status">
  ) => Promise<Loss>;

  /**
   * Delete a loss after Storage cleanup. Clears caches / activeLossId when
   * the deleted loss was active. Returns whether it was the active job.
   */
  deleteLoss: (lossId: string) => Promise<{ wasActive: boolean }>;

  /** Load all losses from Supabase for the Jobs list. */
  loadLosses: () => Promise<Loss[]>;

  /**
   * Set the active loss (localStorage + store), clear prior job room caches,
   * and load that loss for the Dashboard.
   */
  openLoss: (lossId: string) => Promise<Loss | null>;

  createLossRemote: (input: CreateLossInput) => Promise<Loss>;
  loadLoss: (lossId: string) => Promise<Loss | null>;
  loadRooms: (lossId: string) => Promise<Room[]>;
  createRoomRemote: (
    input: Omit<CreateRoomInput, "lossId"> & { lossId?: string }
  ) => Promise<Room>;
  updateRoomRemote: (id: string, input: UpdateRoomInput) => Promise<Room>;
  removeRoomRemote: (id: string) => Promise<void>;
};

function toUiRoom(room: Room): Room {
  return {
    id: room.id,
    name: room.name,
  };
}

function readStoredLossId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_LOSS_STORAGE_KEY);
}

function writeStoredLossId(lossId: string | null) {
  if (typeof window === "undefined") return;
  if (lossId) {
    window.localStorage.setItem(ACTIVE_LOSS_STORAGE_KEY, lossId);
  } else {
    window.localStorage.removeItem(ACTIVE_LOSS_STORAGE_KEY);
  }
}

async function ensureActiveLossId(
  get: () => TwinState,
  set: (
    partial: Partial<TwinState> | ((state: TwinState) => Partial<TwinState>)
  ) => void
): Promise<string> {
  const existing = get().activeLossId ?? readStoredLossId();

  if (existing) {
    if (!get().activeLossId) {
      set({ activeLossId: existing });
    }
    return existing;
  }

  const today = new Date().toISOString().slice(0, 10);

  const loss = await createLoss({
    address: "Pending address",
    customer: "Pending customer",
    phone: "",
    insurance: "",
    claimNumber: "",
    lossType: "Other",
    dateOfLoss: today,
    status: "New",
  });

  writeStoredLossId(loss.id);
  set({
    activeLossId: loss.id,
    activeLoss: loss,
    address: loss.address,
    customer: loss.customer,
  });

  return loss.id;
}

export const useTwinStore = create<TwinState>((set, get) => ({
  address: "",
  customer: "",
  rooms: [],

  photosByRoomId: {},
  photoStatus: "idle",
  photoError: null,
  isUploadingPhotos: false,

  moistureByRoomId: {},
  moistureError: null,
  isSavingMoisture: false,

  notesByRoomId: {},
  noteError: null,
  isSavingNote: false,

  equipmentByRoomId: {},
  equipmentError: null,
  isSavingEquipment: false,
  isUpdatingEquipmentStatus: false,

  scopeItemsByRoomId: {},
  scopeError: null,
  isSavingScope: false,
  isUpdatingScope: false,
  isDeletingScope: false,

  estimateByLossId: {},
  estimateAreasByEstimateId: {},
  estimateLineItemsByAreaId: {},
  estimateStatus: "idle",
  estimateError: null,
  isSavingEstimateArea: false,
  isSavingEstimateLineItem: false,
  isUpdatingEstimate: false,
  isDeletingEstimateArea: false,
  isDeletingEstimateLineItem: false,

  activeLossId: null,
  activeLoss: null,
  isUpdatingLossStatus: false,
  isUpdatingLoss: false,
  isDeletingLoss: false,
  lossError: null,

  losses: [],
  lossesStatus: "idle",
  lossesError: null,

  status: "idle",
  error: null,

  setAddress: (address) => set({ address }),

  setCustomer: (customer) => set({ customer }),

  setActiveLossId: (lossId) => {
    writeStoredLossId(lossId);
    set({ activeLossId: lossId });
  },

  clearError: () => set({ error: null, status: "idle" }),

  clearLossError: () => set({ lossError: null }),

  clearLossesError: () => set({ lossesError: null, lossesStatus: "idle" }),

  clearPhotoError: () => set({ photoError: null, photoStatus: "idle" }),

  clearMoistureError: () => set({ moistureError: null }),

  clearNoteError: () => set({ noteError: null }),

  clearEquipmentError: () => set({ equipmentError: null }),

  clearScopeError: () => set({ scopeError: null }),

  clearEstimateError: () =>
    set({ estimateError: null, estimateStatus: "idle" }),

  hydrateFromDatabase: async () =>
    runAsyncAction(set, async () => {
      const lossId = get().activeLossId ?? readStoredLossId();

      if (!lossId) {
        set({ rooms: [], status: "idle" });
        return;
      }

      const loss = await getLoss(lossId);
      const rooms = await getRooms(lossId);

      writeStoredLossId(lossId);
      set({
        activeLossId: lossId,
        activeLoss: loss,
        address: loss?.address ?? get().address,
        customer: loss?.customer ?? get().customer,
        rooms: rooms.map(toUiRoom),
        status: "idle",
      });
    }),

  loadLossRoomDetails: async () => {
    const rooms = get().rooms;

    if (rooms.length === 0) {
      return;
    }

    try {
      const results = await Promise.all(
        rooms.map(async (room) => {
          const [photos, moistureReadings, notes, equipment] =
            await Promise.all([
              getPhotos(room.id),
              getMoistureReadings(room.id),
              getRoomNotes(room.id),
              getEquipment(room.id),
            ]);

          return {
            roomId: room.id,
            photos,
            moistureReadings,
            notes,
            equipment,
          };
        })
      );

      set((state) => {
        const photosByRoomId = { ...state.photosByRoomId };
        const moistureByRoomId = { ...state.moistureByRoomId };
        const notesByRoomId = { ...state.notesByRoomId };
        const equipmentByRoomId = { ...state.equipmentByRoomId };

        for (const row of results) {
          photosByRoomId[row.roomId] = row.photos;
          moistureByRoomId[row.roomId] = row.moistureReadings;
          notesByRoomId[row.roomId] = row.notes;
          equipmentByRoomId[row.roomId] = row.equipment;
        }

        return {
          photosByRoomId,
          moistureByRoomId,
          notesByRoomId,
          equipmentByRoomId,
        };
      });
    } catch (error) {
      set({
        error: getErrorMessage(error),
        status: "error",
      });
      throw error;
    }
  },

  loadRoomPhotos: async (roomId) => {
    set({ photoStatus: "loading", photoError: null });

    try {
      const photos = await getPhotos(roomId);

      set((state) => ({
        photosByRoomId: {
          ...state.photosByRoomId,
          [roomId]: photos,
        },
        photoStatus: "idle",
        photoError: null,
      }));

      return photos;
    } catch (error) {
      set({
        photoStatus: "error",
        photoError: getErrorMessage(error),
      });
      throw error;
    }
  },

  uploadRoomPhotos: async (roomId, files) => {
    if (files.length === 0) {
      return get().photosByRoomId[roomId] ?? [];
    }

    if (get().isUploadingPhotos) {
      return get().photosByRoomId[roomId] ?? [];
    }

    set({
      photoStatus: "loading",
      photoError: null,
      isUploadingPhotos: true,
    });

    try {
      const lossId = await ensureActiveLossId(get, set);
      const uploaded: Photo[] = [];

      for (const file of files) {
        const photo = await uploadRoomPhoto({
          lossId,
          roomId,
          file,
        });
        uploaded.push(photo);
      }

      const photos = await getPhotos(roomId);

      set((state) => ({
        photosByRoomId: {
          ...state.photosByRoomId,
          [roomId]: photos,
        },
        photoStatus: "idle",
        photoError: null,
        isUploadingPhotos: false,
      }));

      return uploaded;
    } catch (error) {
      set({
        photoStatus: "error",
        photoError: getErrorMessage(error),
        isUploadingPhotos: false,
      });
      throw error;
    }
  },

  loadMoistureReadings: async (roomId) => {
    set({ moistureError: null });

    try {
      const readings = await getMoistureReadings(roomId);

      set((state) => ({
        moistureByRoomId: {
          ...state.moistureByRoomId,
          [roomId]: readings,
        },
        moistureError: null,
      }));

      return readings;
    } catch (error) {
      set({
        moistureError: getErrorMessage(error),
      });
      throw error;
    }
  },

  saveMoistureReading: async (input) => {
    if (get().isSavingMoisture) {
      throw new Error("A moisture reading is already being saved");
    }

    set({
      isSavingMoisture: true,
      moistureError: null,
    });

    try {
      const lossId = await ensureActiveLossId(get, set);

      await createMoistureReading({
        lossId,
        roomId: input.roomId,
        material: input.material,
        reading: input.reading,
        location: input.location,
      });

      const readings = await getMoistureReadings(input.roomId);

      set((state) => ({
        moistureByRoomId: {
          ...state.moistureByRoomId,
          [input.roomId]: readings,
        },
        isSavingMoisture: false,
        moistureError: null,
      }));

      return readings[0]!;
    } catch (error) {
      set({
        isSavingMoisture: false,
        moistureError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadRoomNotes: async (roomId) => {
    set({ noteError: null });

    try {
      const notes = await getRoomNotes(roomId);

      set((state) => ({
        notesByRoomId: {
          ...state.notesByRoomId,
          [roomId]: notes,
        },
        noteError: null,
      }));

      return notes;
    } catch (error) {
      set({
        noteError: getErrorMessage(error),
      });
      throw error;
    }
  },

  saveRoomNote: async (roomId, note) => {
    if (get().isSavingNote) {
      throw new Error("A room note is already being saved");
    }

    const trimmed = note.trim();
    if (!trimmed) {
      const message = "Note cannot be empty.";
      set({ noteError: message });
      throw new Error(message);
    }

    set({
      isSavingNote: true,
      noteError: null,
    });

    try {
      const lossId = await ensureActiveLossId(get, set);

      await createRoomNote({
        lossId,
        roomId,
        note: trimmed,
      });

      const notes = await getRoomNotes(roomId);

      set((state) => ({
        notesByRoomId: {
          ...state.notesByRoomId,
          [roomId]: notes,
        },
        isSavingNote: false,
        noteError: null,
      }));

      return notes[0]!;
    } catch (error) {
      set({
        isSavingNote: false,
        noteError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadRoomEquipment: async (roomId) => {
    set({ equipmentError: null });

    try {
      const equipment = await getEquipment(roomId);

      set((state) => ({
        equipmentByRoomId: {
          ...state.equipmentByRoomId,
          [roomId]: equipment,
        },
        equipmentError: null,
      }));

      return equipment;
    } catch (error) {
      set({
        equipmentError: getErrorMessage(error),
      });
      throw error;
    }
  },

  saveEquipment: async (roomId, equipment) => {
    if (get().isSavingEquipment) {
      throw new Error("Equipment is already being saved");
    }

    const trimmedType = equipment.equipmentType.trim();
    const trimmedLocation = equipment.location.trim();

    if (!trimmedType || !trimmedLocation) {
      const message = "Equipment type and location are required.";
      set({ equipmentError: message });
      throw new Error(message);
    }

    set({
      isSavingEquipment: true,
      equipmentError: null,
    });

    try {
      const lossId = await ensureActiveLossId(get, set);

      await createEquipment({
        lossId,
        roomId,
        equipmentType: trimmedType,
        assetNumber: equipment.assetNumber,
        status: equipment.status,
        location: trimmedLocation,
      });

      const items = await getEquipment(roomId);

      set((state) => ({
        equipmentByRoomId: {
          ...state.equipmentByRoomId,
          [roomId]: items,
        },
        isSavingEquipment: false,
        equipmentError: null,
      }));

      return items[0]!;
    } catch (error) {
      set({
        isSavingEquipment: false,
        equipmentError: getErrorMessage(error),
      });
      throw error;
    }
  },

  updateEquipmentStatus: async (roomId, equipmentId, status) => {
    if (get().isUpdatingEquipmentStatus) {
      throw new Error("Equipment status is already being updated");
    }

    set({
      isUpdatingEquipmentStatus: true,
      equipmentError: null,
    });

    try {
      await persistEquipmentStatus(equipmentId, status);

      const items = await getEquipment(roomId);

      set((state) => ({
        equipmentByRoomId: {
          ...state.equipmentByRoomId,
          [roomId]: items,
        },
        isUpdatingEquipmentStatus: false,
        equipmentError: null,
      }));

      const updated = items.find((item) => item.id === equipmentId);
      if (!updated) {
        throw new Error("Equipment was updated but could not be reloaded");
      }

      return updated;
    } catch (error) {
      set({
        isUpdatingEquipmentStatus: false,
        equipmentError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadRoomScope: async (roomId) => {
    set({ scopeError: null });

    try {
      const items = await getScopeItems(roomId);

      set((state) => ({
        scopeItemsByRoomId: {
          ...state.scopeItemsByRoomId,
          [roomId]: items,
        },
        scopeError: null,
      }));

      return items;
    } catch (error) {
      set({
        scopeError: getErrorMessage(error),
      });
      throw error;
    }
  },

  saveScopeItem: async (roomId, description) => {
    if (get().isSavingScope) {
      throw new Error("A scope item is already being saved");
    }

    const trimmed = description.trim();
    if (!trimmed) {
      const message = "Scope description is required.";
      set({ scopeError: message });
      throw new Error(message);
    }

    set({
      isSavingScope: true,
      scopeError: null,
    });

    try {
      const lossId = await ensureActiveLossId(get, set);

      await createScopeItem({
        lossId,
        roomId,
        description: trimmed,
      });

      const items = await getScopeItems(roomId);

      set((state) => ({
        scopeItemsByRoomId: {
          ...state.scopeItemsByRoomId,
          [roomId]: items,
        },
        isSavingScope: false,
        scopeError: null,
      }));

      return items[items.length - 1]!;
    } catch (error) {
      set({
        isSavingScope: false,
        scopeError: getErrorMessage(error),
      });
      throw error;
    }
  },

  toggleScopeItem: async (roomId, scopeItemId) => {
    if (get().isUpdatingScope) {
      throw new Error("A scope item is already being updated");
    }

    const current = (get().scopeItemsByRoomId[roomId] ?? []).find(
      (item) => item.id === scopeItemId
    );
    if (!current) {
      const message = "Scope item not found.";
      set({ scopeError: message });
      throw new Error(message);
    }

    set({
      isUpdatingScope: true,
      scopeError: null,
    });

    try {
      await persistScopeItemUpdate(scopeItemId, {
        completed: !current.completed,
      });

      const items = await getScopeItems(roomId);

      set((state) => ({
        scopeItemsByRoomId: {
          ...state.scopeItemsByRoomId,
          [roomId]: items,
        },
        isUpdatingScope: false,
        scopeError: null,
      }));

      const updated = items.find((item) => item.id === scopeItemId);
      if (!updated) {
        throw new Error("Scope item was updated but could not be reloaded");
      }

      return updated;
    } catch (error) {
      set({
        isUpdatingScope: false,
        scopeError: getErrorMessage(error),
      });
      throw error;
    }
  },

  deleteScopeItem: async (roomId, scopeItemId) => {
    if (get().isDeletingScope) {
      throw new Error("A scope item is already being deleted");
    }

    set({
      isDeletingScope: true,
      scopeError: null,
    });

    try {
      await removePersistedScopeItem(scopeItemId);

      const items = await getScopeItems(roomId);

      set((state) => ({
        scopeItemsByRoomId: {
          ...state.scopeItemsByRoomId,
          [roomId]: items,
        },
        isDeletingScope: false,
        scopeError: null,
      }));
    } catch (error) {
      set({
        isDeletingScope: false,
        scopeError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadEstimateForLoss: async (lossId) => {
    set({ estimateStatus: "loading", estimateError: null });

    try {
      let estimate = await getEstimateByLossId(lossId);

      if (!estimate) {
        try {
          estimate = await createEstimate(lossId);
        } catch (error) {
          // Unique loss_id race: another create may have won — reload.
          const existing = await getEstimateByLossId(lossId);
          if (!existing) {
            throw error;
          }
          estimate = existing;
        }
      }

      const areas = await getEstimateAreas(estimate.id);
      const lineItemEntries = await Promise.all(
        areas.map(async (area) => {
          const items = await getEstimateLineItems(area.id);
          return [area.id, items] as const;
        })
      );

      const nextLineItems: Record<string, EstimateLineItem[]> = {};
      for (const [areaId, items] of lineItemEntries) {
        nextLineItems[areaId] = items;
      }

      set((state) => ({
        estimateByLossId: {
          ...state.estimateByLossId,
          [lossId]: estimate,
        },
        estimateAreasByEstimateId: {
          ...state.estimateAreasByEstimateId,
          [estimate.id]: areas,
        },
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          ...nextLineItems,
        },
        estimateStatus: "idle",
        estimateError: null,
      }));

      return estimate;
    } catch (error) {
      set({
        estimateStatus: "error",
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  createEstimateForLoss: async (lossId) => {
    set({ estimateStatus: "loading", estimateError: null });

    try {
      let estimate: Estimate;
      try {
        estimate = await createEstimate(lossId);
      } catch (error) {
        const existing = await getEstimateByLossId(lossId);
        if (!existing) {
          throw error;
        }
        estimate = existing;
      }

      set((state) => ({
        estimateByLossId: {
          ...state.estimateByLossId,
          [lossId]: estimate,
        },
        estimateAreasByEstimateId: {
          ...state.estimateAreasByEstimateId,
          [estimate.id]: state.estimateAreasByEstimateId[estimate.id] ?? [],
        },
        estimateStatus: "idle",
        estimateError: null,
      }));

      return estimate;
    } catch (error) {
      set({
        estimateStatus: "error",
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadEstimateAreas: async (estimateId) => {
    set({ estimateError: null });

    try {
      const areas = await getEstimateAreas(estimateId);

      set((state) => ({
        estimateAreasByEstimateId: {
          ...state.estimateAreasByEstimateId,
          [estimateId]: areas,
        },
        estimateError: null,
      }));

      return areas;
    } catch (error) {
      set({ estimateError: getErrorMessage(error) });
      throw error;
    }
  },

  saveEstimateArea: async (input) => {
    if (get().isSavingEstimateArea) {
      throw new Error("An estimate area is already being saved");
    }

    const name = input.name.trim();
    if (!name) {
      const message = "Area name is required.";
      set({ estimateError: message });
      throw new Error(message);
    }

    set({
      isSavingEstimateArea: true,
      estimateError: null,
    });

    try {
      const existingAreas =
        get().estimateAreasByEstimateId[input.estimateId] ?? [];
      const area = await createEstimateArea({
        estimateId: input.estimateId,
        name,
        roomId: input.roomId ?? null,
        sortOrder: existingAreas.length,
      });

      const areas = await getEstimateAreas(input.estimateId);

      set((state) => ({
        estimateAreasByEstimateId: {
          ...state.estimateAreasByEstimateId,
          [input.estimateId]: areas,
        },
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          [area.id]: state.estimateLineItemsByAreaId[area.id] ?? [],
        },
        isSavingEstimateArea: false,
        estimateError: null,
      }));

      return area;
    } catch (error) {
      set({
        isSavingEstimateArea: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  updateEstimateArea: async (estimateId, areaId, name) => {
    if (get().isSavingEstimateArea) {
      throw new Error("An estimate area is already being saved");
    }

    const trimmed = name.trim();
    if (!trimmed) {
      const message = "Area name is required.";
      set({ estimateError: message });
      throw new Error(message);
    }

    set({
      isSavingEstimateArea: true,
      estimateError: null,
    });

    try {
      await persistEstimateAreaUpdate(areaId, { name: trimmed });
      const areas = await getEstimateAreas(estimateId);

      set((state) => ({
        estimateAreasByEstimateId: {
          ...state.estimateAreasByEstimateId,
          [estimateId]: areas,
        },
        isSavingEstimateArea: false,
        estimateError: null,
      }));

      const updated = areas.find((area) => area.id === areaId);
      if (!updated) {
        throw new Error("Estimate area was updated but could not be reloaded");
      }

      return updated;
    } catch (error) {
      set({
        isSavingEstimateArea: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  deleteEstimateArea: async (estimateId, areaId) => {
    if (get().isDeletingEstimateArea) {
      throw new Error("An estimate area is already being deleted");
    }

    set({
      isDeletingEstimateArea: true,
      estimateError: null,
    });

    try {
      await removePersistedEstimateArea(areaId);
      const areas = await getEstimateAreas(estimateId);

      set((state) => {
        const nextLineItems = { ...state.estimateLineItemsByAreaId };
        delete nextLineItems[areaId];

        return {
          estimateAreasByEstimateId: {
            ...state.estimateAreasByEstimateId,
            [estimateId]: areas,
          },
          estimateLineItemsByAreaId: nextLineItems,
          isDeletingEstimateArea: false,
          estimateError: null,
        };
      });
    } catch (error) {
      set({
        isDeletingEstimateArea: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadEstimateLineItems: async (areaId) => {
    set({ estimateError: null });

    try {
      const items = await getEstimateLineItems(areaId);

      set((state) => ({
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          [areaId]: items,
        },
        estimateError: null,
      }));

      return items;
    } catch (error) {
      set({ estimateError: getErrorMessage(error) });
      throw error;
    }
  },

  saveEstimateLineItem: async (input) => {
    if (get().isSavingEstimateLineItem) {
      throw new Error("A line item is already being saved");
    }

    const description = input.description.trim();
    const unit = input.unit.trim();
    if (!description) {
      const message = "Description is required.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!unit) {
      const message = "Unit is required.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      const message = "Quantity must be a valid non-negative number.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
      const message = "Unit price must be a valid non-negative number.";
      set({ estimateError: message });
      throw new Error(message);
    }

    set({
      isSavingEstimateLineItem: true,
      estimateError: null,
    });

    try {
      const existingItems =
        get().estimateLineItemsByAreaId[input.areaId] ?? [];
      await createEstimateLineItem({
        estimateAreaId: input.areaId,
        description,
        quantity: input.quantity,
        unit,
        unitPrice: input.unitPrice,
        sortOrder: existingItems.length,
      });

      const items = await getEstimateLineItems(input.areaId);

      set((state) => ({
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          [input.areaId]: items,
        },
        isSavingEstimateLineItem: false,
        estimateError: null,
      }));

      return items[items.length - 1]!;
    } catch (error) {
      set({
        isSavingEstimateLineItem: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  updateEstimateLineItem: async (areaId, lineItemId, input) => {
    if (get().isSavingEstimateLineItem) {
      throw new Error("A line item is already being saved");
    }

    const description = input.description.trim();
    const unit = input.unit.trim();
    if (!description) {
      const message = "Description is required.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!unit) {
      const message = "Unit is required.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      const message = "Quantity must be a valid non-negative number.";
      set({ estimateError: message });
      throw new Error(message);
    }
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
      const message = "Unit price must be a valid non-negative number.";
      set({ estimateError: message });
      throw new Error(message);
    }

    set({
      isSavingEstimateLineItem: true,
      estimateError: null,
    });

    try {
      await persistEstimateLineItemUpdate(lineItemId, {
        description,
        quantity: input.quantity,
        unit,
        unitPrice: input.unitPrice,
      });

      const items = await getEstimateLineItems(areaId);

      set((state) => ({
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          [areaId]: items,
        },
        isSavingEstimateLineItem: false,
        estimateError: null,
      }));

      const updated = items.find((item) => item.id === lineItemId);
      if (!updated) {
        throw new Error("Line item was updated but could not be reloaded");
      }

      return updated;
    } catch (error) {
      set({
        isSavingEstimateLineItem: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  deleteEstimateLineItem: async (areaId, lineItemId) => {
    if (get().isDeletingEstimateLineItem) {
      throw new Error("A line item is already being deleted");
    }

    set({
      isDeletingEstimateLineItem: true,
      estimateError: null,
    });

    try {
      await removePersistedEstimateLineItem(lineItemId);
      const items = await getEstimateLineItems(areaId);

      set((state) => ({
        estimateLineItemsByAreaId: {
          ...state.estimateLineItemsByAreaId,
          [areaId]: items,
        },
        isDeletingEstimateLineItem: false,
        estimateError: null,
      }));
    } catch (error) {
      set({
        isDeletingEstimateLineItem: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  updateEstimateStatus: async (estimateId, status) => {
    if (get().isUpdatingEstimate) {
      throw new Error("Estimate status is already being updated");
    }

    set({
      isUpdatingEstimate: true,
      estimateError: null,
    });

    try {
      const estimate = await persistEstimateStatus(estimateId, status);

      set((state) => ({
        estimateByLossId: {
          ...state.estimateByLossId,
          [estimate.lossId]: estimate,
        },
        isUpdatingEstimate: false,
        estimateError: null,
      }));

      return estimate;
    } catch (error) {
      set({
        isUpdatingEstimate: false,
        estimateError: getErrorMessage(error),
      });
      throw error;
    }
  },

  addRoom: async (name) =>
    runAsyncAction(set, async () => {
      const lossId = await ensureActiveLossId(get, set);

      await createRoom({ lossId, name });

      // Immediately reload rooms into the frontend cache
      const rooms = await getRooms(lossId);

      set({
        rooms: rooms.map(toUiRoom),
        status: "idle",
      });
    }),

  loadLosses: async () => {
    set({ lossesStatus: "loading", lossesError: null });

    try {
      const losses = await getLosses();

      set({
        losses,
        lossesStatus: "idle",
        lossesError: null,
      });

      return losses;
    } catch (error) {
      set({
        lossesStatus: "error",
        lossesError: getErrorMessage(error),
      });
      throw error;
    }
  },

  openLoss: async (lossId) => {
    writeStoredLossId(lossId);

    set({
      activeLossId: lossId,
      rooms: [],
      photosByRoomId: {},
      moistureByRoomId: {},
      notesByRoomId: {},
      equipmentByRoomId: {},
      scopeItemsByRoomId: {},
      estimateByLossId: {},
      estimateAreasByEstimateId: {},
      estimateLineItemsByAreaId: {},
      estimateStatus: "idle",
      estimateError: null,
      lossError: null,
      error: null,
    });

    try {
      const loss = await getLoss(lossId);

      set({
        activeLossId: loss?.id ?? lossId,
        activeLoss: loss,
        address: loss?.address ?? "",
        customer: loss?.customer ?? "",
      });

      return loss;
    } catch (error) {
      set({
        lossError: getErrorMessage(error),
      });
      throw error;
    }
  },

  createLossRemote: async (input) =>
    runAsyncAction(set, async () => {
      const loss = await createLoss(input);

      writeStoredLossId(loss.id);
      set((state) => ({
        activeLossId: loss.id,
        activeLoss: loss,
        address: loss.address,
        customer: loss.customer,
        rooms: [],
        photosByRoomId: {},
        moistureByRoomId: {},
        notesByRoomId: {},
        equipmentByRoomId: {},
        scopeItemsByRoomId: {},
        estimateByLossId: {},
        estimateAreasByEstimateId: {},
        estimateLineItemsByAreaId: {},
        estimateStatus: "idle",
        estimateError: null,
        losses: [
          loss,
          ...state.losses.filter((existing) => existing.id !== loss.id),
        ],
        lossError: null,
        status: "idle",
      }));

      return loss;
    }),

  updateLossStatus: async (nextStatus) => {
    if (get().isUpdatingLossStatus) {
      throw new Error("Loss status is already being updated");
    }

    const lossId = get().activeLossId ?? readStoredLossId();
    if (!lossId) {
      const message = "No active loss to update.";
      set({ lossError: message });
      throw new Error(message);
    }

    set({
      isUpdatingLossStatus: true,
      lossError: null,
    });

    try {
      const loss = await persistLossStatus(lossId, nextStatus);

      set((state) => ({
        activeLossId: loss.id,
        activeLoss: loss,
        address: loss.address,
        customer: loss.customer,
        losses: state.losses.map((existing) =>
          existing.id === loss.id ? loss : existing
        ),
        isUpdatingLossStatus: false,
        lossError: null,
      }));

      return loss;
    } catch (error) {
      set({
        isUpdatingLossStatus: false,
        lossError: getErrorMessage(error),
      });
      throw error;
    }
  },

  updateLossDetails: async (input) => {
    if (get().isUpdatingLoss) {
      throw new Error("Loss details are already being updated");
    }

    const lossId = get().activeLossId ?? readStoredLossId();
    if (!lossId) {
      const message = "No active loss to update.";
      set({ lossError: message });
      throw new Error(message);
    }

    set({
      isUpdatingLoss: true,
      lossError: null,
    });

    try {
      const loss = await persistLossUpdate(lossId, {
        address: input.address,
        customer: input.customer,
        phone: input.phone,
        insurance: input.insurance,
        claimNumber: input.claimNumber,
        lossType: input.lossType,
        dateOfLoss: input.dateOfLoss,
      });

      set((state) => ({
        activeLossId: loss.id,
        activeLoss: loss,
        address: loss.address,
        customer: loss.customer,
        losses: state.losses.map((existing) =>
          existing.id === loss.id ? loss : existing
        ),
        isUpdatingLoss: false,
        lossError: null,
      }));

      return loss;
    } catch (error) {
      set({
        isUpdatingLoss: false,
        lossError: getErrorMessage(error),
      });
      throw error;
    }
  },

  deleteLoss: async (lossId) => {
    if (get().isDeletingLoss) {
      throw new Error("A job is already being deleted");
    }

    set({
      isDeletingLoss: true,
      lossError: null,
      lossesError: null,
    });

    try {
      const wasActive =
        get().activeLossId === lossId || readStoredLossId() === lossId;

      await removePersistedLoss(lossId);

      const nextLosses = get().losses.filter((loss) => loss.id !== lossId);

      if (wasActive) {
        writeStoredLossId(null);
        set({
          activeLossId: null,
          activeLoss: null,
          address: "",
          customer: "",
          rooms: [],
          photosByRoomId: {},
          moistureByRoomId: {},
          notesByRoomId: {},
          equipmentByRoomId: {},
          scopeItemsByRoomId: {},
          estimateByLossId: {},
          estimateAreasByEstimateId: {},
          estimateLineItemsByAreaId: {},
          estimateStatus: "idle",
          estimateError: null,
          losses: nextLosses,
          isDeletingLoss: false,
          lossError: null,
        });
      } else {
        const removedEstimate = get().estimateByLossId[lossId];
        set((state) => {
          const nextEstimates = { ...state.estimateByLossId };
          delete nextEstimates[lossId];

          const nextAreas = { ...state.estimateAreasByEstimateId };
          const nextLineItems = { ...state.estimateLineItemsByAreaId };

          if (removedEstimate) {
            const areas = nextAreas[removedEstimate.id] ?? [];
            for (const area of areas) {
              delete nextLineItems[area.id];
            }
            delete nextAreas[removedEstimate.id];
          }

          return {
            losses: nextLosses,
            estimateByLossId: nextEstimates,
            estimateAreasByEstimateId: nextAreas,
            estimateLineItemsByAreaId: nextLineItems,
            isDeletingLoss: false,
            lossError: null,
          };
        });
      }

      return { wasActive };
    } catch (error) {
      set({
        isDeletingLoss: false,
        lossError: getErrorMessage(error),
        lossesError: getErrorMessage(error),
      });
      throw error;
    }
  },

  loadLoss: async (lossId) =>
    runAsyncAction(set, async () => {
      const loss = await getLoss(lossId);

      writeStoredLossId(loss?.id ?? null);
      set({
        activeLossId: loss?.id ?? null,
        activeLoss: loss,
        address: loss?.address ?? get().address,
        customer: loss?.customer ?? get().customer,
        status: "idle",
      });

      return loss;
    }),

  loadRooms: async (lossId) =>
    runAsyncAction(
      set,
      async () => {
        const rooms = await getRooms(lossId);

        writeStoredLossId(lossId);
        set({
          rooms: rooms.map(toUiRoom),
          status: "idle",
        });

        return rooms;
      },
      { activeLossId: lossId }
    ),

  createRoomRemote: async (input) => {
    const lossId =
      input.lossId ?? get().activeLossId ?? (await ensureActiveLossId(get, set));

    return runAsyncAction(set, async () => {
      await createRoom({
        ...input,
        lossId,
      });

      const rooms = await getRooms(lossId);

      set({
        rooms: rooms.map(toUiRoom),
        status: "idle",
      });

      const created = rooms[rooms.length - 1];
      if (!created) {
        throw new Error("Room was created but could not be reloaded");
      }

      return created;
    });
  },

  updateRoomRemote: async (id, input) =>
    runAsyncAction(set, async () => {
      const room = await persistRoomUpdate(id, input);
      const lossId = room.lossId ?? get().activeLossId;

      if (lossId) {
        const rooms = await getRooms(lossId);
        set({
          rooms: rooms.map(toUiRoom),
          status: "idle",
        });
      } else {
        set((state) => ({
          rooms: state.rooms.map((existing) =>
            existing.id === room.id ? toUiRoom(room) : existing
          ),
          status: "idle",
        }));
      }

      return room;
    }),

  removeRoomRemote: async (id) =>
    runAsyncAction(set, async () => {
      await removePersistedRoom(id);

      const lossId = get().activeLossId ?? readStoredLossId();
      if (lossId) {
        const rooms = await getRooms(lossId);
        set({
          rooms: rooms.map(toUiRoom),
          status: "idle",
        });
      } else {
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
          status: "idle",
        }));
      }
    }),
}));
