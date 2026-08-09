/**
 * Drying / mitigation equipment placed in a room.
 * TODO: Finalize fields when equipment schema is designed.
 */
export interface Equipment {
  id: string;
  roomId: string;
  name: string;
  createdAt: string;
}
