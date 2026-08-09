export type RoomCategory = 1 | 2 | 3;
export type RoomClass = 1 | 2 | 3 | 4;

/**
 * Room within a loss / digital twin.
 * MVP UI may populate only id + name; persistence fills the rest.
 */
export interface Room {
  id: string;
  name: string;
  lossId?: string;
  floor?: number;
  category?: RoomCategory;
  class?: RoomClass;
  affected?: boolean;
  createdAt?: string;
}
