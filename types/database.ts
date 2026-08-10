/**
 * Supabase Database types for RestorationOS MVP tables.
 * Keep in sync with:
 * - supabase/migrations/20260322000000_create_losses_rooms.sql
 * - supabase/migrations/20260810000000_create_photos_and_room_photos_bucket.sql
 * - supabase/migrations/20260810010000_create_moisture_readings.sql
 * - supabase/migrations/20260810020000_create_room_notes.sql
 * - supabase/migrations/20260810030000_create_equipment.sql
 * - supabase/migrations/20260810040000_add_loss_details_fields.sql
 * - supabase/migrations/20260810050000_create_room_scope_items.sql
 * - supabase/migrations/20260810060000_create_estimate_foundation.sql
 * - supabase/migrations/20260810070000_create_room_measurements.sql
 * - supabase/migrations/20260810080000_add_quantity_source_to_estimate_line_items.sql
 * - supabase/migrations/20260810090000_create_price_catalog.sql
 * - supabase/migrations/20260810100000_add_estimate_line_item_id_to_room_scope_items.sql
 * - supabase/migrations/20260810110000_add_estimate_notes.sql
 * - supabase/migrations/20260810120000_create_company_profile.sql
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
      company_profile: {
        Row: {
          id: string;
          singleton_key: boolean;
          company_name: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          address: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          singleton_key?: boolean;
          company_name: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          singleton_key?: boolean;
          company_name?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
      room_scope_items: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          description: string;
          completed: boolean;
          estimate_line_item_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          description: string;
          completed?: boolean;
          estimate_line_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          description?: string;
          completed?: boolean;
          estimate_line_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_scope_items_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_scope_items_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_scope_items_estimate_line_item_id_fkey";
            columns: ["estimate_line_item_id"];
            isOneToOne: false;
            referencedRelation: "estimate_line_items";
            referencedColumns: ["id"];
          },
        ];
      };
      estimates: {
        Row: {
          id: string;
          loss_id: string;
          status: "Draft" | "Complete";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          status?: "Draft" | "Complete";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          status?: "Draft" | "Complete";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimates_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: true;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
        ];
      };
      estimate_areas: {
        Row: {
          id: string;
          estimate_id: string;
          room_id: string | null;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estimate_id: string;
          room_id?: string | null;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estimate_id?: string;
          room_id?: string | null;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimate_areas_estimate_id_fkey";
            columns: ["estimate_id"];
            isOneToOne: false;
            referencedRelation: "estimates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "estimate_areas_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      estimate_line_items: {
        Row: {
          id: string;
          estimate_area_id: string;
          description: string;
          quantity: number;
          unit: string;
          unit_price: number;
          quantity_source:
            | "manual"
            | "floor_area"
            | "ceiling_area"
            | "wall_area"
            | "perimeter";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estimate_area_id: string;
          description: string;
          quantity?: number;
          unit: string;
          unit_price?: number;
          quantity_source?:
            | "manual"
            | "floor_area"
            | "ceiling_area"
            | "wall_area"
            | "perimeter";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estimate_area_id?: string;
          description?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          quantity_source?:
            | "manual"
            | "floor_area"
            | "ceiling_area"
            | "wall_area"
            | "perimeter";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_area_id_fkey";
            columns: ["estimate_area_id"];
            isOneToOne: false;
            referencedRelation: "estimate_areas";
            referencedColumns: ["id"];
          },
        ];
      };
      price_catalog_items: {
        Row: {
          id: string;
          category: string;
          name: string;
          description: string | null;
          unit: string;
          unit_price: number;
          active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          name: string;
          description?: string | null;
          unit: string;
          unit_price?: number;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          name?: string;
          description?: string | null;
          unit?: string;
          unit_price?: number;
          active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_measurements: {
        Row: {
          id: string;
          loss_id: string;
          room_id: string;
          length_ft: number;
          width_ft: number;
          ceiling_height_ft: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          loss_id: string;
          room_id: string;
          length_ft: number;
          width_ft: number;
          ceiling_height_ft: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          loss_id?: string;
          room_id?: string;
          length_ft?: number;
          width_ft?: number;
          ceiling_height_ft?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_measurements_loss_id_fkey";
            columns: ["loss_id"];
            isOneToOne: false;
            referencedRelation: "losses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_measurements_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: true;
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
export type ScopeItemRow =
  Database["public"]["Tables"]["room_scope_items"]["Row"];
export type EstimateRow = Database["public"]["Tables"]["estimates"]["Row"];
export type EstimateAreaRow =
  Database["public"]["Tables"]["estimate_areas"]["Row"];
export type EstimateLineItemRow =
  Database["public"]["Tables"]["estimate_line_items"]["Row"];
export type RoomMeasurementRow =
  Database["public"]["Tables"]["room_measurements"]["Row"];
export type PriceCatalogItemRow =
  Database["public"]["Tables"]["price_catalog_items"]["Row"];
export type CompanyProfileRow =
  Database["public"]["Tables"]["company_profile"]["Row"];

export const ROOM_PHOTOS_BUCKET = "room-photos" as const;
export const COMPANY_ASSETS_BUCKET = "company-assets" as const;
