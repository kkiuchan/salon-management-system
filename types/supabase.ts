export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          gender: string | null;
          date_of_birth: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          gender?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          gender?: string | null;
          date_of_birth?: string | null;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      treatments: {
        Row: {
          id: string;
          customer_id: string;
          date: string;
          menu: string;
          stylist_name: string;
          price: number | null;
          duration: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          date: string;
          menu: string;
          stylist_name: string;
          price?: number | null;
          duration?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          date?: string;
          menu?: string;
          stylist_name?: string;
          price?: number | null;
          duration?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      treatment_images: {
        Row: {
          id: string;
          treatment_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          treatment_id: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          treatment_id?: string;
          image_url?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
