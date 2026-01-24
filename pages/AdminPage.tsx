import React, { useState, useEffect } from 'react';
import { Wand2, Save, Trash2, CheckCircle, Image as ImageIcon, Mic, Calendar, Download, Database } from 'lucide-react';
import { generateWordMetadata, generateIllustration, generatePronunciation } from '../services/gemini';
import { publishWord, fetchWords, deleteWord, fetchSubmissions } from '../services/store';
import { isSupabaseConfigured } from '../services/supabase';
import { WordDefinition } from '../types';
import { WordCard } from '../components/WordCard';

export const AdminPage: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [currentDraft, setCurrentDraft] = useState<WordDefinition | null>(null);
  const [previousWords, setPreviousWords] = useState<WordDefinition[]>([]);

  const refreshList = async () => {
    const words = await fetchWords('admin');
    setPreviousWords(words);
  };

  useEffect(() => {
    refreshList();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Consulting the linguistic oracle...');
    setCurrentDraft(null);

    try {
      // 1. Generate Metadata
      const metadata = await generateWordMetadata(topic);
      setStatus(`Discovered "${metadata.word}". Sketching...`);

      // 2. Generate Illustration (Parallel could be faster, but sequential is safer for errors)
      let imageUrl = '';
      try {
        imageUrl = await generateIllustration(metadata.word, metadata.definition);
      } catch (err) {
        console.error("Image generation failed", err);
      }

      // 3. Generate Audio
      setStatus(`Recording pronunciation for "${metadata.word}"...`);
      let audioBase64 = '';
      try {
        audioBase64 = await generatePronunciation(metadata.word);
      } catch (err) {
        console.error("Audio generation failed", err);
      }

      // Construct Draft
      const newWord: WordDefinition = {
        id: Date.now().toString(),
        ...metadata,
        illustrationUrl: imageUrl,
        audioBase64: audioBase64,
        createdAt: new Date().toISOString(),
        scheduledDate: '', // Will be assigned on publish
        status: 'draft',
        votes: 0
      };

      setCurrentDraft(newWord);
      setStatus('');

    } catch (error) {
      console.error(error);
      setStatus('Failed to generate word. Check API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentDraft) return;
    await publishWord(currentDraft);
    await refreshList();
    setCurrentDraft(null);
    setTopic('');
  };

  const handleDelete = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this word?')) {
        await deleteWord(id);
        await refreshList();
    }
  };

  const handleBackup = async () => {
    const words = await fetchWords('admin');
    const submissions = await fetchSubmissions();
    const backup = {
        timestamp: new Date().toISOString(),
        environment: isSupabaseConfigured() ? 'supabase' : 'local',
        words,
        submissions
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wot-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isFuture = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0,0,0,0);
      return new Date(dateStr) > tomorrow;
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 transition-colors duration-300">
      <div className="flex flex-col md:flex-row gap-12">
        
        {/* Left Column: Generator & Tools */}
        <div className="w-full md:w-1/3 space-y-8">
          
          {/* Generator Card */}
          <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
            <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2 text-ink">
              <Wand2 className="text-accent" /> Word Smith
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">
                  Vibe / Topic / Context
                </label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Kitchen accidents, Politicians, Space travel"
                  className="w-full px-4 py-2 rounded border border-ink/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-paper text-ink"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-ink text-paper py-3 rounded font-medium hover:bg-ink/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Forging...' : 'Generate Word'}
              </button>
            </form>
            
            {status && (
              <div className="mt-4 p-3 bg-secondary/10 text-secondary-dark text-sm rounded animate-pulse text-ink">
                {status}
              </div>
            )}
          </div>

          {/* System & Backup Card */}
          <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40 mb-4 flex items-center gap-2">
                <Database size={14} /> System
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm p-2 bg-paper rounded border border-ink/5">
                <span className="text-ink/60">Storage Engine</span>
                <span className={`font-mono px-2 py-0.5 rounded text-xs font-bold ${isSupabaseConfigured() ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                    {isSupabaseConfigured() ? 'Supabase' : 'Local Browser'}
                </span>
                </div>
                <button 
                onClick={handleBackup}
                className="w-full flex items-center justify-center gap-2 py-2 border border-ink/20 rounded hover:bg-ink/5 text-sm transition-colors text-ink"
                >
                <Download size={16} /> Download Data Backup
                </button>
            </div>
          </div>

          {/* List of Existing Words */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40">Queue & Archive</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {previousWords.map(word => {
                  const isQueued = isFuture(word.scheduledDate);
                  return (
                    <div key={word.id} className={`p-3 rounded border flex justify-between items-center group transition-colors ${isQueued ? 'bg-secondary/5 border-secondary/20' : 'bg-surface border-ink/5'}`}>
                      <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold font-serif text-ink">{word.word}</span>
                            {isQueued && <span className="text-[10px] bg-secondary text-white px-1 rounded uppercase font-bold">Queued</span>}
                        </div>
                        <div className="text-xs text-ink/40 flex items-center gap-1 mt-1">
                            <Calendar size={12} /> {word.scheduledDate}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(word.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="w-full md:w-2/3">
          {currentDraft ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif text-ink">Draft Preview</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCurrentDraft(null)}
                    className="px-4 py-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={handlePublish}
                    className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <CheckCircle size={16} /> Add to Queue
                  </button>
                </div>
              </div>

              <WordCard wordData={currentDraft} preview={true} />
              
              <div className="grid grid-cols-3 gap-4 text-xs text-ink/40 mt-4">
                 <div className="flex items-center gap-1">
                    <ImageIcon size={14} className={currentDraft.illustrationUrl ? "text-green-500" : "text-red-400"} />
                    Illustration {currentDraft.illustrationUrl ? 'Ready' : 'Failed'}
                 </div>
                 <div className="flex items-center gap-1">
                    <Mic size={14} className={currentDraft.audioBase64 ? "text-green-500" : "text-red-400"} />
                    Pronunciation {currentDraft.audioBase64 ? 'Ready' : 'Failed'}
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-ink/10 rounded-lg text-ink/30">
              <Wand2 size={48} className="mb-4 opacity-50" />
              <p>Ready to invent the future of language.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};