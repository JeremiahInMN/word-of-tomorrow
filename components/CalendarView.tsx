import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { WordDefinition } from '../types';

interface CalendarViewProps {
  viewMode: 'week' | 'month';
  startDate: Date;
  wordsMap: Map<string, WordDefinition>;
  onDateClick: (date: string) => void;
  selectedDate: string | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewMode,
  startDate,
  wordsMap,
  onDateClick,
  selectedDate
}) => {
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };
  
  const isTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(date) === formatDate(tomorrow);
  };
  
  const isPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  // Generate array of dates to display
  const generateDates = (): Date[] => {
    const dates: Date[] = [];
    const daysToShow = viewMode === 'week' ? 7 : 30;
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dates = generateDates();
  
  return (
    <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-2`}>
      {dates.map((date) => {
        const dateStr = formatDate(date);
        const word = wordsMap.get(dateStr);
        const past = isPast(date);
        const today = isToday(date);
        const tomorrow = isTomorrow(date);
        const isSelected = dateStr === selectedDate;
        
        return (
          <button
            key={dateStr}
            onClick={() => !past && onDateClick(dateStr)}
            disabled={past}
            className={`
              relative p-3 rounded border text-left transition-all
              ${past ? 'bg-ink/5 cursor-not-allowed opacity-60' : 'hover:border-accent hover:shadow-md cursor-pointer'}
              ${today ? 'border-yellow-400 border-2 bg-yellow-50 dark:bg-yellow-900/20' : ''}
              ${tomorrow ? 'border-accent border-2 bg-accent/5' : ''}
              ${isSelected && !past ? 'ring-2 ring-accent ring-offset-2' : ''}
              ${!today && !tomorrow && !past ? 'border-ink/20 bg-surface' : ''}
              ${word && !past ? 'border-green-500/30 bg-green-50 dark:bg-green-900/20' : ''}
              ${!word && !past && !today && !tomorrow ? 'border-dashed' : ''}
            `}
          >
            {/* Date Header */}
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-mono ${past ? 'text-ink/40' : 'text-ink/60'}`}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              {past && <Lock size={12} className="text-ink/30" />}
              {today && <span className="text-[10px] bg-yellow-500 text-white px-1 rounded font-bold">TODAY</span>}
              {tomorrow && <span className="text-[10px] bg-accent text-white px-1 rounded font-bold">NEXT</span>}
            </div>
            
            {/* Day of Week */}
            <div className={`text-[10px] uppercase tracking-wider mb-2 ${past ? 'text-ink/30' : 'text-ink/50'}`}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            
            {/* Word or Empty State */}
            {word ? (
              <div className="mt-1">
                <div className="text-xs font-bold text-ink truncate">{word.word}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] text-ink/60">Assigned</span>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                {past ? (
                  <span className="text-[10px] text-ink/30">No word</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle size={12} className="text-orange-400" />
                    <span className="text-[10px] text-orange-600 dark:text-orange-400">Empty</span>
                  </div>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
