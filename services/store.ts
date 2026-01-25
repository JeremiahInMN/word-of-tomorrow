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
    audioUrl: row.audio_url,
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
    audio_url: word.audioUrl,
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

// --- New Functions for Scheduling System ---

// Fetch word by specific date
export const fetchWordByDate = async (date: string): Promise<WordDefinition | null> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .eq('scheduled_date', date)
            .eq('status', 'published')
            .single();
        
        if (error || !data) return null;
        return mapWordFromDB(data);
    }
    
    // LocalStorage fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    return words.find(w => w.scheduledDate === date && w.status === 'published') || null;
};

// Get all unassigned words (scheduled_date is NULL)
export const fetchUnassignedWords = async (): Promise<WordDefinition[]> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .is('scheduled_date', null)
            .eq('status', 'draft')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Supabase fetch unassigned error:", error);
            return [];
        }
        return (data || []).map(mapWordFromDB);
    }
    
    // LocalStorage fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    return words.filter(w => !w.scheduledDate && w.status === 'draft');
};

// Check if a specific date already has a word assigned
export const checkDateHasWord = async (date: string): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('words')
            .select('id')
            .eq('scheduled_date', date)
            .eq('status', 'published');
        
        if (error) return false;
        return (data || []).length > 0;
    }
    
    // LocalStorage fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    return words.some(w => w.scheduledDate === date && w.status === 'published');
};

// Update word's scheduled date
export const updateWordSchedule = async (wordId: string, newDate: string | null): Promise<boolean> => {
    if (isSupabaseConfigured() && supabase) {
        // If assigning a date, check if that date already has a word
        if (newDate) {
            const hasWord = await checkDateHasWord(newDate);
            if (hasWord) {
                throw new Error('This date already has a word assigned. Please choose another date.');
            }
        }
        
        const updateData: any = {
            scheduled_date: newDate,
            status: newDate ? 'published' : 'draft'
        };
        
        const { error } = await supabase
            .from('words')
            .update(updateData)
            .eq('id', wordId);
        
        if (error) {
            console.error("Supabase update schedule error:", error);
            return false;
        }
        return true;
    }
    
    // LocalStorage fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    const word = words.find(w => w.id === wordId);
    if (word) {
        word.scheduledDate = newDate;
        word.status = newDate ? 'published' : 'draft';
        localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
        return true;
    }
    return false;
};

// Get words grouped by date for calendar view
export const fetchWordsGroupedByDate = async (startDate: string, endDate: string): Promise<Map<string, WordDefinition>> => {
    if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
            .from('words')
            .select('*')
            .not('scheduled_date', 'is', null)
            .gte('scheduled_date', startDate)
            .lte('scheduled_date', endDate)
            .eq('status', 'published')
            .order('scheduled_date', { ascending: true });
        
        if (error) {
            console.error("Supabase fetch grouped error:", error);
            return new Map();
        }
        
        const map = new Map<string, WordDefinition>();
        (data || []).forEach(row => {
            const word = mapWordFromDB(row);
            if (word.scheduledDate) {
                map.set(word.scheduledDate, word);
            }
        });
        return map;
    }
    
    // LocalStorage fallback
    const words: WordDefinition[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WORDS) || '[]');
    const map = new Map<string, WordDefinition>();
    words.forEach(w => {
        if (w.scheduledDate && w.scheduledDate >= startDate && w.scheduledDate <= endDate && w.status === 'published') {
            map.set(w.scheduledDate, w);
        }
    });
    return map;
};

// Auto-assign unassigned words to empty dates
export const autoAssignWords = async (numberOfDays: number): Promise<{ success: boolean; message: string; assigned: number }> => {
    // Get unassigned words
    const unassignedWords = await fetchUnassignedWords();
    
    if (unassignedWords.length === 0) {
        return { success: false, message: 'No unassigned words available.', assigned: 0 };
    }
    
    // Generate list of dates starting from tomorrow
    const tomorrow = getTomorrow();
    const dates: string[] = [];
    for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(tomorrow);
        date.setDate(date.getDate() + i);
        dates.push(formatDate(date));
    }
    
    // Find empty dates
    const emptyDates: string[] = [];
    for (const date of dates) {
        const hasWord = await checkDateHasWord(date);
        if (!hasWord) {
            emptyDates.push(date);
        }
    }
    
    if (emptyDates.length === 0) {
        return { success: false, message: `All dates in the next ${numberOfDays} days already have words assigned.`, assigned: 0 };
    }
    
    // Check if we have enough words
    if (unassignedWords.length < emptyDates.length) {
        return { 
            success: false, 
            message: `Not enough unassigned words. You have ${unassignedWords.length} unassigned word(s), but need ${emptyDates.length} to fill the next ${numberOfDays} days.`, 
            assigned: 0 
        };
    }
    
    // Assign words to empty dates
    let assigned = 0;
    for (let i = 0; i < emptyDates.length; i++) {
        const success = await updateWordSchedule(unassignedWords[i].id, emptyDates[i]);
        if (success) assigned++;
    }
    
    return { 
        success: true, 
        message: `Successfully assigned ${assigned} word(s) to empty dates.`, 
        assigned 
    };
};