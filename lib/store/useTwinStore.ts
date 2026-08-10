import { create } from "zustand";

import {
  createLoss,
  createRoom,
  deleteRoom as removePersistedRoom,
  getLoss,
  getPhotos,
  getRooms,
  updateRoom as persistRoomUpdate,
  uploadRoomPhoto,
  type CreateLossInput,
  type CreateRoomInput,
  type UpdateRoomInput,
} from "@/lib/database";
import { getErrorMessage } from "@/lib/database/errors";
import type { Loss } from "@/lib/domain/Loss";
import type { Photo } from "@/lib/domain/Photo";
import type { Room } from "@/lib/domain/Room";
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

  activeLossId: string | null;
  activeLoss: Loss | null;

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

  loadRoomPhotos: (roomId: string) => Promise<Photo[]>;
  uploadRoomPhotos: (roomId: string, files: File[]) => Promise<Photo[]>;
  clearPhotoError: () => void;

  setActiveLossId: (lossId: string | null) => void;
  clearError: () => void;

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

  const loss = await createLoss({
    address: "Pending address",
    customer: "Pending customer",
    phone: "",
    insurance: "",
    claimNumber: "",
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

  activeLossId: null,
  activeLoss: null,

  status: "idle",
  error: null,

  setAddress: (address) => set({ address }),

  setCustomer: (customer) => set({ customer }),

  setActiveLossId: (lossId) => {
    writeStoredLossId(lossId);
    set({ activeLossId: lossId });
  },

  clearError: () => set({ error: null, status: "idle" }),

  clearPhotoError: () => set({ photoError: null, photoStatus: "idle" }),

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

  createLossRemote: async (input) =>
    runAsyncAction(set, async () => {
      const loss = await createLoss(input);

      writeStoredLossId(loss.id);
      set({
        activeLossId: loss.id,
        activeLoss: loss,
        address: loss.address,
        customer: loss.customer,
        status: "idle",
      });

      return loss;
    }),

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
