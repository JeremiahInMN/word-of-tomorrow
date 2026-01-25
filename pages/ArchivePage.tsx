import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { fetchWordByDate } from '../services/store';
import { WordDefinition } from '../types';

export const ArchivePage: React.FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const [word, setWord] = useState<WordDefinition | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Get yesterday as the starting point if no date param
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date;
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  useEffect(() => {
    const loadWord = async () => {
      setLoading(true);
      
      // Determine which date to load
      let targetDate: Date;
      if (date) {
        targetDate = new Date(date);
      } else {
        targetDate = getYesterday();
      }
      
      setCurrentDate(targetDate);
      
      // Fetch word for this date
      const dateStr = formatDate(targetDate);
      const fetchedWord = await fetchWordByDate(dateStr);
      setWord(fetchedWord);
      setLoading(false);
    };

    loadWord();
  }, [date]);

  const handlePrevious = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    navigate(`/archive/${formatDate(prevDate)}`);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Check if next date is tomorrow or future
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (nextDate >= tomorrow) {
      // Redirect to homepage
      navigate('/');
      return;
    }
    
    navigate(`/archive/${formatDate(nextDate)}`);
  };

  const handleBackToToday = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-12 px-4 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-ink/10 rounded mb-4"></div>
          <div className="h-8 w-64 bg-ink/10 rounded mb-8"></div>
          <div className="h-64 w-full max-w-lg bg-ink/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper py-12 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Navigation */}
        <div className="text-center mb-8">
          <h2 className="text-sm font-bold tracking-[0.2em] text-accent uppercase mb-2">Word Archive</h2>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-bold mb-6">
            {formatDisplayDate(currentDate)}
          </h1>
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 rounded border border-ink/20 hover:bg-ink/5 text-ink transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="hidden sm:inline">Previous Day</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <button
              onClick={handleBackToToday}
              className="flex items-center gap-2 px-4 py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors"
              title="Back to Word of Tomorrow"
            >
              <Home size={20} />
              <span className="hidden sm:inline">Today</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded border border-ink/20 hover:bg-ink/5 text-ink transition-colors"
            >
              <span className="hidden sm:inline">Next Day</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Word Display */}
        {word ? (
          <WordCard wordData={word} />
        ) : (
          <div className="text-center py-20 opacity-50 border-2 border-dashed border-ink/10 rounded-lg">
            <p className="font-serif italic text-xl">No word was published on this date.</p>
            <p className="text-sm mt-2">Try a different day.</p>
          </div>
        )}
      </div>
    </div>
  );
};
