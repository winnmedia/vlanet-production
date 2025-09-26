/**
 * Supabase Database Types
 * 데이터베이스 스키마에 기반한 TypeScript 타입 정의
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User Role Enum
export type UserRole = 'CREATOR' | 'FUNDER' | 'VIEWER';

// Video Status Enum
export type VideoStatus = 'uploading' | 'processing' | 'published' | 'failed' | 'deleted';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: UserRole;
          avatar_url: string | null;
          bio: string | null;
          company: string | null;
          website: string | null;
          onboarding_completed: boolean;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: UserRole;
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          website?: string | null;
          onboarding_completed?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: UserRole;
          avatar_url?: string | null;
          bio?: string | null;
          company?: string | null;
          website?: string | null;
          onboarding_completed?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          tags: string[];
          ai_model: string | null;
          prompt: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          file_name: string | null;
          file_size: number | null;
          duration: number | null;
          width: number | null;
          height: number | null;
          fps: number | null;
          format: string;
          status: VideoStatus;
          upload_progress: number;
          error_message: string | null;
          is_public: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          tags?: string[];
          ai_model?: string | null;
          prompt?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          duration?: number | null;
          width?: number | null;
          height?: number | null;
          fps?: number | null;
          format?: string;
          status?: VideoStatus;
          upload_progress?: number;
          error_message?: string | null;
          is_public?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          tags?: string[];
          ai_model?: string | null;
          prompt?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          duration?: number | null;
          width?: number | null;
          height?: number | null;
          fps?: number | null;
          format?: string;
          status?: VideoStatus;
          upload_progress?: number;
          error_message?: string | null;
          is_public?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          deleted_at?: string | null;
        };
      };
      video_stats: {
        Row: {
          video_id: string;
          view_count: number;
          unique_view_count: number;
          like_count: number;
          dislike_count: number;
          comment_count: number;
          share_count: number;
          investment_interest_count: number;
          total_investment_amount: number;
          total_revenue: number;
          creator_earnings: number;
          last_viewed_at: string | null;
          trending_score: number;
          updated_at: string;
        };
        Insert: {
          video_id: string;
          view_count?: number;
          unique_view_count?: number;
          like_count?: number;
          dislike_count?: number;
          comment_count?: number;
          share_count?: number;
          investment_interest_count?: number;
          total_investment_amount?: number;
          total_revenue?: number;
          creator_earnings?: number;
          last_viewed_at?: string | null;
          trending_score?: number;
          updated_at?: string;
        };
        Update: {
          video_id?: string;
          view_count?: number;
          unique_view_count?: number;
          like_count?: number;
          dislike_count?: number;
          comment_count?: number;
          share_count?: number;
          investment_interest_count?: number;
          total_investment_amount?: number;
          total_revenue?: number;
          creator_earnings?: number;
          last_viewed_at?: string | null;
          trending_score?: number;
          updated_at?: string;
        };
      };
      video_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      video_category_relations: {
        Row: {
          video_id: string;
          category_id: string;
        };
        Insert: {
          video_id: string;
          category_id: string;
        };
        Update: {
          video_id?: string;
          category_id?: string;
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
      user_role: UserRole;
      video_status: VideoStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}