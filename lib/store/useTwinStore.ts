import { create } from "zustand";

export type Room = {
  id: string;
  name: string;
};

type TwinState = {
  address: string;
  customer: string;
  rooms: Room[];

  setAddress: (address: string) => void;
  setCustomer: (customer: string) => void;
  addRoom: (name: string) => void;
};

export const useTwinStore = create<TwinState>((set) => ({
  address: "",
  customer: "",
  rooms: [],

  setAddress: (address) => set({ address }),

  setCustomer: (customer) => set({ customer }),

  addRoom: (name) =>
    set((state) => ({
      rooms: [
        ...state.rooms,
        {
          id: crypto.randomUUID(),
          name,
        },
      ],
    })),
}));