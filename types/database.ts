/**
 * Supabase Database types for RestorationOS MVP tables.
 * Keep in sync with supabase/migrations/20260322000000_create_losses_rooms.sql
 *
 * TODO: Photos table is intentionally omitted. Future Digital Twin will organize
 * photos by Building → Floor → Room → Wall.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LossStatus =
  | "Initializing"
  | "Inspection"
  | "Drying"
  | "Complete";

export type Database = {
  public: {
    Tables: {
      losses: {
        Row: {
          id: string;
          address: string;
          customer: string;
          phone: string;
          insurance: string;
          claim_number: string;
          status: LossStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          address?: string;
          customer?: string;
          phone?: string;
          insurance?: string;
          claim_number?: string;
          status?: LossStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          address?: string;
          customer?: string;
          phone?: string;
          insurance?: string;
          claim_number?: string;
          status?: LossStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          loss_id: string;
          name: string;
          floor: number;
          category: number;
          class: number;
          affected: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          name: string;
          floor?: number;
          category?: number;
          class?: number;
          affected?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          name?: string;
          floor?: number;
          category?: number;
          class?: number;
          affected?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type LossRow = Database["public"]["Tables"]["losses"]["Row"];
export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
