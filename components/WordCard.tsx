import React, { useState } from 'react';
import { Share2, Volume2, Pause, Info, Maximize2, X } from 'lucide-react';
import { WordDefinition } from '../types';

interface WordCardProps {
  wordData: WordDefinition;
  preview?: boolean;
}

export const WordCard: React.FC<WordCardProps> = ({ wordData, preview = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayAudio = () => {
    if (!wordData.audioUrl) return;
    
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(wordData.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', () => {
        console.error('Error loading audio');
        setIsPlaying(false);
      });
      audio.play();
      setIsPlaying(true);
      setAudioElement(audio);
    }
  };

  return (
    <>
      <div className={`bg-surface rounded-lg border-2 border-ink/10 shadow-[4px_4px_0px_0px_rgba(var(--c-ink),0.1)] overflow-hidden max-w-4xl mx-auto transition-colors duration-300 ${preview ? 'scale-95' : ''}`}>
        <div className="p-8 sm:p-12">
          
          {/* Header: Word & Pronunciation */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-ink/10 pb-8 mb-8">
            <div>
              <h1 className="font-serif text-5xl sm:text-6xl font-bold text-ink mb-3 tracking-tight">
                {wordData.word}
              </h1>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="font-serif italic text-2xl text-ink/50">{wordData.partOfSpeech}</span>
                <span className="text-ink/40 text-lg font-sans tracking-wide">{wordData.pronunciation}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6 sm:mt-0">
              {wordData.audioUrl && (
                <button 
                  onClick={handlePlayAudio}
                  className={`p-3 rounded-full hover:bg-ink/5 text-ink transition-colors h-fit ${isPlaying ? 'bg-accent/10' : ''}`}
                  title="Listen to pronunciation"
                >
                  {isPlaying ? <Pause size={24} /> : <Volume2 size={24} />}
                </button>
              )}
              {!preview && (
                <button className="p-3 rounded-full hover:bg-ink/5 text-ink transition-colors h-fit">
                  <Share2 size={24} />
                </button>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              
              {/* Left: Definition & Examples (3/5 width) */}
              <div className="md:col-span-3 space-y-8">
                  <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-ink/40 mb-3">Definition</h3>
                      <p className="text-2xl font-serif leading-relaxed text-ink/90">
                          {wordData.definition}
                      </p>
                  </div>

                  <div className="bg-paper p-6 rounded border border-ink/5 italic text-ink/70 font-serif text-lg leading-relaxed border-l-4 border-l-accent/20">
                      "{wordData.example}"
                  </div>

                  <div>
                      <h3 className="text-xs uppercase tracking-widest font-bold text-ink/40 mb-2">Origin</h3>
                      <p className="text-base text-ink/60 leading-relaxed">
                          {wordData.origin}
                      </p>
                  </div>
              </div>

              {/* Right: Illustration (2/5 width) */}
              <div className="md:col-span-2">
                  <button 
                      onClick={() => wordData.illustrationUrl && setIsExpanded(true)}
                      disabled={!wordData.illustrationUrl}
                      className="group relative w-full aspect-square bg-paper rounded border border-ink/10 flex items-center justify-center p-4 overflow-hidden cursor-zoom-in hover:border-accent/30 hover:shadow-md transition-all duration-300 disabled:cursor-default"
                  >
                      {wordData.illustrationUrl ? (
                          <>
                            <img 
                                src={wordData.illustrationUrl} 
                                alt={`Illustration of ${wordData.word}`} 
                                className="w-full h-full object-contain mix-blend-multiply opacity-90 dark:mix-blend-screen dark:invert transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-surface/80 backdrop-blur text-ink px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                                    <Maximize2 size={12} /> Enlarge
                                </span>
                            </div>
                          </>
                      ) : (
                          <div className="text-ink/20 flex flex-col items-center">
                              <Info size={48} strokeWidth={1.5} />
                              <span className="text-sm mt-3 font-medium">No Illustration</span>
                          </div>
                      )}
                  </button>
                  <div className="mt-3 text-center text-[10px] text-ink/30 uppercase tracking-widest font-mono">
                      Fig. 1 — Artist's Interpretation
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isExpanded && wordData.illustrationUrl && (
        <div 
            className="fixed inset-0 z-[100] bg-paper/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
            onClick={() => setIsExpanded(false)}
        >
            <div 
                className="relative max-w-5xl w-full max-h-[90vh] aspect-square flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} 
            >
                <img 
                   src={wordData.illustrationUrl} 
                   alt={`Illustration of ${wordData.word}`}
                   className="w-full h-full object-contain mix-blend-multiply opacity-100 dark:mix-blend-screen dark:invert p-4"
                />
                
                <button 
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-4 right-4 p-3 bg-surface border border-ink/10 rounded-full text-ink hover:bg-ink hover:text-paper transition-colors shadow-lg z-10"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
                 <h2 className="font-serif text-3xl text-ink font-bold">{wordData.word}</h2>
                 <p className="text-ink/50 text-sm mt-1">Figure 1</p>
            </div>
        </div>
      )}
    </>
  );
};