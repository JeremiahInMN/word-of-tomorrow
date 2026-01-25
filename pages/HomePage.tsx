import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { WordCard } from '../components/WordCard';
import { fetchWords } from '../services/store';
import { WordDefinition } from '../types';

export const HomePage: React.FC = () => {
  const [featuredWord, setFeaturedWord] = useState<WordDefinition | null>(null);
  const [recentWords, setRecentWords] = useState<WordDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [tomorrowDate, setTomorrowDate] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        // Calculate Tomorrow
        const date = new Date();
        date.setDate(date.getDate() + 1);
        setTomorrowDate(date);

        // Get words
        const words = await fetchWords('client');
        
        if (words.length > 0) {
            setFeaturedWord(words[0]);
            setRecentWords(words.slice(1, 4));
        }
        setLoading(false);
    };
    loadData();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
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
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h2 className="text-sm font-bold tracking-[0.2em] text-accent uppercase mb-2">Word of Tomorrow</h2>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-bold">
            {formatDate(tomorrowDate)}
        </h1>
        <p className="text-ink/60 mt-4 max-w-lg mx-auto">
          A glimpse into the lexicon of the future.
        </p>
      </div>

      {featuredWord ? (
        <>
          <WordCard wordData={featuredWord} />
          
          {/* Archive Link */}
          <div className="max-w-4xl mx-auto mt-8 text-center">
            <Link 
              to="/archive"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-ink/10 hover:border-accent hover:bg-accent/5 text-ink font-medium transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <Archive size={20} />
              View Past Words
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-20 opacity-50 border-2 border-dashed border-ink/10 rounded-lg max-w-2xl mx-auto">
          <p className="font-serif italic text-xl">The oracle is silent for tomorrow.</p>
          <p className="text-sm mt-2">Check back later or visit the Admin panel.</p>
        </div>
      )}

      {/* Archive / Recent Words Teaser */}
      {recentWords.length > 0 && (
        <div className="max-w-4xl mx-auto mt-20 border-t border-ink/10 pt-12">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-ink">
                <span className="w-2 h-2 bg-ink/20 rounded-full"></span>
                Past Discoveries
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {recentWords.map(word => (
                    <div key={word.id} className="bg-surface p-6 rounded border border-ink/10 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="text-xs text-ink/40 mb-2 font-mono">
                            {new Date(word.scheduledDate).toLocaleDateString()}
                        </div>
                        <h4 className="font-serif font-bold text-xl mb-1 text-ink">{word.word}</h4>
                        <p className="text-xs text-ink/50 mb-3 font-mono">{word.partOfSpeech}</p>
                        <p className="text-sm text-ink/80 line-clamp-3">{word.definition}</p>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};