/**
 * Supabase Database types for RestorationOS MVP tables.
 * Keep in sync with:
 * - supabase/migrations/20260322000000_create_losses_rooms.sql
 * - supabase/migrations/20260810000000_create_photos_and_room_photos_bucket.sql
 * - supabase/migrations/20260810010000_create_moisture_readings.sql
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

export const ROOM_PHOTOS_BUCKET = "room-photos" as const;
