export interface WordDefinition {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  origin: string;
  illustrationUrl?: string; // Base64 or URL
  audioBase64?: string; // Raw PCM data base64 encoded
  createdAt: string;
  scheduledDate: string; // YYYY-MM-DD
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