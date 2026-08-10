/**
 * Supabase Database types for RestorationOS MVP tables.
 * Keep in sync with:
 * - supabase/migrations/20260322000000_create_losses_rooms.sql
 * - supabase/migrations/20260810000000_create_photos_and_room_photos_bucket.sql
 * - supabase/migrations/20260810010000_create_moisture_readings.sql
 * - supabase/migrations/20260810020000_create_room_notes.sql
 * - supabase/migrations/20260810030000_create_equipment.sql
 * - supabase/migrations/20260810040000_add_loss_details_fields.sql
 *
 * TODO: Future Digital Twin will organize photos by Building → Floor → Room → Wall.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type LossType = "Water" | "Fire" | "Mold" | "Other";

export type LossStatus =
  | "New"
  | "Inspection"
  | "Mitigation"
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
          loss_type: LossType;
          date_of_loss: string;
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
          loss_type: LossType;
          date_of_loss: string;
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
          loss_type?: LossType;
          date_of_loss?: string;
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
      photos: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          storage_path: string;
          public_url: string;
          original_filename: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          storage_path: string;
          public_url: string;
          original_filename: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          storage_path?: string;
          public_url?: string;
          original_filename?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "photos_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      moisture_readings: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          material: string;
          reading: number;
          location: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          material: string;
          reading: number;
          location: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          material?: string;
          reading?: number;
          location?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moisture_readings_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moisture_readings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      room_notes: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          note: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_notes_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_notes_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          equipment_type: string;
          asset_number: string | null;
          status: string;
          location: string;
          placed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          equipment_type: string;
          asset_number?: string | null;
          status: string;
          location: string;
          placed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          equipment_type?: string;
          asset_number?: string | null;
          status?: string;
          location?: string;
          placed_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
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
export type PhotoRow = Database["public"]["Tables"]["photos"]["Row"];
export type MoistureReadingRow =
  Database["public"]["Tables"]["moisture_readings"]["Row"];
export type RoomNoteRow = Database["public"]["Tables"]["room_notes"]["Row"];
export type EquipmentRow = Database["public"]["Tables"]["equipment"]["Row"];

export const ROOM_PHOTOS_BUCKET = "room-photos" as const;
