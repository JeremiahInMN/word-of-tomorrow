import { WordDefinition, UserSubmission } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  WORDS: 'wot_words',
  SUBMISSIONS: 'wot_submissions'
};

const getTomorrow = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// --- Mappers for DB snake_case <-> App camelCase ---

const mapWordFromDB = (row: any): WordDefinition => ({
    id: row.id,
    word: row.word,
    pronunciation: row.pronunciation,
    partOfSpeech: row.part_of_speech,
    definition: row.definition,
    example: row.example,
    origin: row.origin,
    illustrationUrl: row.illustration_url,
    audioBase64: row.audio_base64,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date,
    status: row.status as 'draft' | 'published' | 'archived',
    votes: row.votes
});

const mapWordToDB = (word: WordDefinition) => ({
    id: word.id,
    word: word.word,
    pronunciation: word.pronunciation,
    part_of_speech: word.partOfSpeech,
    definition: word.definition,
    example: word.example,
    origin: word.origin,
    illustration_url: word.illustrationUrl,
    audio_base64: word.audioBase64,
    created_at: word.createdAt,
    scheduled_date: word.scheduledDate,
    status: word.status,
    votes: word.votes
});

// --- Store Actions ---

export const initializeStore = async () => {
    // No-op for Supabase, but useful for LocalStorage init if needed
    if (!isSupabaseConfigured()) {
        const SEED_DATA: WordDefinition[] = [
            {
              id: '1',
              word: 'Glombus',
              pronunciation: 'glom-BUS',
              partOfSpeech: 'noun',
              definition: 'The vague sense of melancholy one feels when dropping a piece of toast butter-side down.',
              example: '"After losing his keys and his lunch, Arthur was overcome with a deep glombus."',
              origin: 'Old Glomish, derived from "glom" (to look sad) and "bus" (transportation that is late).',
              illustrationUrl: 'https://picsum.photos/400/400?grayscale',
              createdAt: new Date().toISOString(),
              scheduledDate: formatDate(getTomorrow()),
              status: 'published',
              votes: 42
            }
          ];
        if (!localStorage.getItem(STORAGE_KEYS.WORDS)) {
            localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(SEED_DATA));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
        }
    }
};

export const fetchWords = async (mode: 'client' | 'admin' = 'client'): Promise<WordDefinition[]> => {
    if (isSupabaseConfigured() && supabase) {
        let query = supabase.from('words').select('*').order('scheduled_date', { ascending: false });
        
        if (mode === 'client') {
            const tomorrowStr = formatDate(getTomorrow());
            query = query.eq('status', 'published').lte('scheduled_date', tomorrowStr);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Supabase fetch error:", error);
            return [];
        }
        return (data || []).map(mapWordFromDB);
    } 
    
    // LocalStorage Fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    const sortedWords = words.sort((a, b) => 
        new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );

    if (mode === 'admin') return sortedWords;
    
    const tomorrowStr = formatDate(getTomorrow());
    return sortedWords.filter(w => w.status === 'published' && w.scheduledDate <= tomorrowStr);
};

export const getNextAvailableDate = async (): Promise<string> => {
    // Get latest scheduled date
    let latestDateStr = '';
    
    if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('words')
            .select('scheduled_date')
            .eq('status', 'published')
            .order('scheduled_date', { ascending: false })
            .limit(1);
        if (data && data.length > 0) latestDateStr = data[0].scheduled_date;
    } else {
        const words = await fetchWords('admin');
        const published = words.filter(w => w.status === 'published');
        if (published.length > 0) latestDateStr = published[0].scheduledDate;
    }

    const tomorrow = getTomorrow();
    
    if (!latestDateStr) return formatDate(tomorrow);
    
    const latestDate = new Date(latestDateStr);
    if (latestDate < tomorrow) return formatDate(tomorrow);
    
    const nextDate = new Date(latestDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return formatDate(nextDate);
};

export const publishWord = async (draft: WordDefinition) => {
    const nextDate = await getNextAvailableDate();
    const wordToSave: WordDefinition = {
        ...draft,
        status: 'published',
        scheduledDate: nextDate
    };

    if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('words').upsert(mapWordToDB(wordToSave));
        if (error) console.error("Supabase publish error:", error);
    } else {
        const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
        const index = words.findIndex((w: WordDefinition) => w.id === wordToSave.id);
        if (index >= 0) words[index] = wordToSave;
        else words.unshift(wordToSave);
        localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
    }
};

export const deleteWord = async (id: string) => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('words').delete().eq('id', id);
    } else {
        let words = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
        words = words.filter((w: WordDefinition) => w.id !== id);
        localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
    }
};

export const fetchSubmissions = async (): Promise<UserSubmission[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
        return (data || []).map((row: any) => ({
            id: row.id,
            word: row.word,
            definition: row.definition,
            user: row.user,
            votes: row.votes,
            createdAt: row.created_at
        }));
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || '[]');
};

export const addSubmission = async (sub: UserSubmission) => {
    if (isSupabaseConfigured() && supabase) {
        await supabase.from('submissions').insert({
            id: sub.id,
            word: sub.word,
            definition: sub.definition,
            user: sub.user,
            votes: sub.votes,
            created_at: sub.createdAt
        });
    } else {
        const subs = await fetchSubmissions();
        subs.unshift(sub);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
    }
};

export const voteSubmission = async (id: string) => {
    if (isSupabaseConfigured() && supabase) {
        // Simple increment, slightly race-condition prone but fine for this demo
        // Better: using an rpc call
        const { data } = await supabase.from('submissions').select('votes').eq('id', id).single();
        if (data) {
            await supabase.from('submissions').update({ votes: data.votes + 1 }).eq('id', id);
        }
    } else {
        const subs = await fetchSubmissions();
        const sub = subs.find(s => s.id === id);
        if (sub) {
            sub.votes += 1;
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(subs));
        }
    }
};