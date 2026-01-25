import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Trash2, Download, Database, Save, X, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchUnassignedWords, fetchWordsGroupedByDate, updateWordSchedule, deleteWord, autoAssignWords, fetchSubmissions } from '../services/store';
import { isSupabaseConfigured } from '../services/supabase';
import { WordDefinition } from '../types';
import { WordCard } from '../components/WordCard';
import { CalendarView } from '../components/CalendarView';

export const AdminPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentStartDate, setCurrentStartDate] = useState<Date>(new Date());
  const [unassignedWords, setUnassignedWords] = useState<WordDefinition[]>([]);
  const [wordsMap, setWordsMap] = useState<Map<string, WordDefinition>>(new Map());
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isRefreshingUnassigned, setIsRefreshingUnassigned] = useState(false);
  
  // Auto-assign state
  const [autoAssignUnit, setAutoAssignUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [autoAssignAmount, setAutoAssignAmount] = useState<number>(7);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const loadData = async () => {
    setLoading(true);
    
    // Load unassigned words
    const unassigned = await fetchUnassignedWords();
    setUnassignedWords(unassigned);
    
    // Load words for calendar view
    const daysToShow = viewMode === 'week' ? 7 : 30;
    const endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + daysToShow - 1);
    
    const grouped = await fetchWordsGroupedByDate(
      formatDate(currentStartDate),
      formatDate(endDate)
    );
    setWordsMap(grouped);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentStartDate, viewMode]);

  const handlePrevious = () => {
    const newDate = new Date(currentStartDate);
    const daysToMove = viewMode === 'week' ? 7 : 30;
    newDate.setDate(newDate.getDate() - daysToMove);
    setCurrentStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentStartDate);
    const daysToMove = viewMode === 'week' ? 7 : 30;
    newDate.setDate(newDate.getDate() + daysToMove);
    setCurrentStartDate(newDate);
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    const word = wordsMap.get(date);
    if (word) {
      setSelectedWord(word);
      setNewScheduleDate(date);
    } else {
      setSelectedWord(null);
      setNewScheduleDate(date);
    }
  };

  const handleWordClick = (word: WordDefinition) => {
    setSelectedWord(word);
    setNewScheduleDate(word.scheduledDate || '');
    setSelectedDate(word.scheduledDate);
  };

  const handleRefreshUnassigned = async () => {
    setIsRefreshingUnassigned(true);
    
    const currentCount = unassignedWords.length;
    const freshUnassigned = await fetchUnassignedWords();
    setUnassignedWords(freshUnassigned);
    
    const newCount = freshUnassigned.length;
    const diff = newCount - currentCount;
    
    if (diff > 0) {
      setMessage({ 
        type: 'success', 
        text: `Found ${diff} new unassigned word${diff > 1 ? 's' : ''}! Total: ${newCount}` 
      });
    } else if (diff < 0) {
      setMessage({ 
        type: 'success', 
        text: `${Math.abs(diff)} word${Math.abs(diff) > 1 ? 's' : ''} removed. Total: ${newCount}` 
      });
    } else {
      setMessage({ 
        type: 'success', 
        text: `No changes. Still ${newCount} unassigned word${newCount !== 1 ? 's' : ''}.` 
      });
    }
    
    setIsRefreshingUnassigned(false);
  };

  const handleSaveSchedule = async () => {
    if (!selectedWord) return;
    
    // Check if word is locked (past date)
    if (selectedWord.scheduledDate) {
      const scheduledDate = new Date(selectedWord.scheduledDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      scheduledDate.setHours(0, 0, 0, 0);
      
      if (scheduledDate < today) {
        setMessage({ type: 'error', text: 'Cannot move past words. This word is locked.' });
        return;
      }
    }
    
    try {
      const success = await updateWordSchedule(
        selectedWord.id, 
        newScheduleDate || null
      );
      
      if (success) {
        setMessage({ type: 'success', text: 'Word schedule updated successfully!' });
        await loadData();
        setSelectedWord(null);
        setSelectedDate(null);
      } else {
        setMessage({ type: 'error', text: 'Failed to update schedule.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error updating schedule.' });
    }
  };

  const handleDelete = async (wordId: string) => {
    if (!window.confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
      return;
    }
    
    await deleteWord(wordId);
    setMessage({ type: 'success', text: 'Word deleted successfully.' });
    await loadData();
    setSelectedWord(null);
  };

  const handleAutoAssign = async () => {
    // Calculate total days based on unit and amount
    let totalDays = autoAssignAmount;
    if (autoAssignUnit === 'weeks') {
      totalDays = autoAssignAmount * 7;
    } else if (autoAssignUnit === 'months') {
      totalDays = autoAssignAmount * 30;
    }
    
    const result = await autoAssignWords(totalDays);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      await loadData();
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };

  const handleBackup = async () => {
    const words = Array.from(wordsMap.values()).concat(unassignedWords);
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

  const isWordLocked = (word: WordDefinition): boolean => {
    if (!word.scheduledDate) return false;
    const scheduledDate = new Date(word.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduledDate.setHours(0, 0, 0, 0);
    return scheduledDate < today;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 transition-colors duration-300">
      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' : 
          'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-4">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif text-ink mb-2">Word Scheduling</h1>
        <p className="text-ink/60">Manage your word calendar and assignments</p>
      </div>

      {/* Calendar Section */}
      <div className="bg-surface rounded-lg border border-ink/10 shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="text-accent" size={24} />
            <h2 className="text-xl font-bold font-serif text-ink">Calendar View</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex border border-ink/20 rounded overflow-hidden">
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-accent text-white' : 'bg-surface text-ink hover:bg-ink/5'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-accent text-white' : 'bg-surface text-ink hover:bg-ink/5'
                }`}
              >
                Month
              </button>
            </div>
            
            {/* Navigation */}
            <button
              onClick={handlePrevious}
              className="p-2 rounded border border-ink/20 hover:bg-ink/5 text-ink transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded border border-ink/20 hover:bg-ink/5 text-ink transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <CalendarView
          viewMode={viewMode}
          startDate={currentStartDate}
          wordsMap={wordsMap}
          onDateClick={handleDateClick}
          selectedDate={selectedDate}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Tools & Unassigned Words */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Auto-Assign Section */}
          <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40 mb-4">Auto-Assign Words</h3>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={autoAssignAmount}
                  onChange={(e) => setAutoAssignAmount(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 rounded border border-ink/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-paper text-ink"
                />
                <select
                  value={autoAssignUnit}
                  onChange={(e) => setAutoAssignUnit(e.target.value as 'days' | 'weeks' | 'months')}
                  className="flex-1 px-3 py-2 rounded border border-ink/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-paper text-ink"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
              
              <button
                onClick={handleAutoAssign}
                className="w-full bg-accent text-white py-3 rounded font-medium hover:bg-accent/90 transition-colors flex justify-center items-center gap-2"
              >
                Auto-Assign
              </button>
              
              <p className="text-xs text-ink/60">
                Fills empty dates with unassigned words starting from tomorrow
              </p>
            </div>
          </div>

          {/* Unassigned Words Pool */}
          <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40">Unassigned Words</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleRefreshUnassigned}
                  disabled={isRefreshingUnassigned}
                  className="p-1.5 rounded hover:bg-ink/5 transition-colors disabled:opacity-50"
                  title="Refresh unassigned words from database"
                >
                  <RefreshCw 
                    size={16} 
                    className={isRefreshingUnassigned ? 'animate-spin text-accent' : 'text-ink/60 hover:text-ink'}
                  />
                </button>
                <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded">{unassignedWords.length}</span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {unassignedWords.length === 0 ? (
                <p className="text-sm text-ink/40 italic text-center py-4">No unassigned words</p>
              ) : (
                unassignedWords.map(word => (
                  <button
                    key={word.id}
                    onClick={() => handleWordClick(word)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedWord?.id === word.id ? 'border-accent bg-accent/5' : 'border-ink/10 hover:border-accent/50 hover:bg-ink/5'
                    }`}
                  >
                    <div className="font-bold font-serif text-ink">{word.word}</div>
                    <div className="text-xs text-ink/40 mt-1">
                      Created {new Date(word.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-widest text-ink/40 mb-4 flex items-center gap-2">
              <Database size={14} /> System
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm p-2 bg-paper rounded border border-ink/5">
                <span className="text-ink/60">Storage</span>
                <span className={`font-mono px-2 py-0.5 rounded text-xs font-bold ${
                  isSupabaseConfigured() ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' : 
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                }`}>
                  {isSupabaseConfigured() ? 'Supabase' : 'Local'}
                </span>
              </div>
              <button 
                onClick={handleBackup}
                className="w-full flex items-center justify-center gap-2 py-2 border border-ink/20 rounded hover:bg-ink/5 text-sm transition-colors text-ink"
              >
                <Download size={16} /> Backup Data
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Word Details */}
        <div className="lg:col-span-2">
          {selectedWord ? (
            <div className="bg-surface p-6 rounded-lg border border-ink/10 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-serif text-ink">Word Details</h3>
                <button 
                  onClick={() => setSelectedWord(null)}
                  className="p-2 hover:bg-ink/5 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Word Preview */}
              <WordCard wordData={selectedWord} preview={true} />

              {/* Scheduling Controls */}
              <div className="border-t border-ink/10 pt-6 space-y-4">
                {isWordLocked(selectedWord) ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-red-800 dark:text-red-200">Word is Locked</p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        This word was published on {selectedWord.scheduledDate} and cannot be moved. 
                        Past words are locked to preserve the archive.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-ink/70 mb-2">
                        Schedule Date
                      </label>
                      <input
                        type="date"
                        value={newScheduleDate}
                        onChange={(e) => setNewScheduleDate(e.target.value)}
                        className="w-full px-4 py-2 rounded border border-ink/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-paper text-ink"
                      />
                      <p className="text-xs text-ink/50 mt-1">
                        Leave empty to unassign this word
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveSchedule}
                        className="flex-1 bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                      <button
                        onClick={() => handleDelete(selectedWord.id)}
                        className="px-6 py-3 rounded border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-ink/10 rounded-lg text-ink/30 bg-surface">
              <Calendar size={48} className="mb-4 opacity-50" />
              <p>Select a word or date to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
