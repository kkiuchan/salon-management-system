import { Database } from "./supabase";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert =
  Database["public"]["Tables"]["customers"]["Insert"];
export type CustomerUpdate =
  Database["public"]["Tables"]["customers"]["Update"];

export type Treatment = Database["public"]["Tables"]["treatments"]["Row"];
export type TreatmentInsert =
  Database["public"]["Tables"]["treatments"]["Insert"];
export type TreatmentUpdate =
  Database["public"]["Tables"]["treatments"]["Update"];

export type TreatmentImage =
  Database["public"]["Tables"]["treatment_images"]["Row"];
export type TreatmentImageInsert =
  Database["public"]["Tables"]["treatment_images"]["Insert"];

export interface TreatmentWithImages extends Treatment {
  treatment_images: TreatmentImage[];
}

export interface CustomerWithTreatments extends Customer {
  treatments: TreatmentWithImages[];
}

// 管理者型定義を追加
export interface Admin {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
