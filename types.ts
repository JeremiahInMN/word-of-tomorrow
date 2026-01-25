export interface WordDefinition {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  origin: string;
  illustrationUrl?: string; // Supabase Storage URL
  audioUrl?: string; // Supabase Storage URL for audio
  audioBase64?: string; // DEPRECATED: Raw PCM data base64 encoded
  createdAt: string;
  scheduledDate: string | null; // YYYY-MM-DD or NULL for unassigned
  status: 'draft' | 'published' | 'archived';
  votes: number;
}

export interface UserSubmission {
  id: string;
  word: string;
  definition: string;
  user: string;
  votes: number;
  createdAt: string;
}

export interface GeminiGeneratedWord {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  origin: string;
}

// Helper types for Gemini Schema
export enum SchemaType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT'
}

// Auth types
export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}