import React, { useState, useEffect } from 'react';
import { Send, ThumbsUp, MessageSquare } from 'lucide-react';
import { fetchSubmissions, addSubmission, voteSubmission } from '../services/store';
import { UserSubmission } from '../types';

export const CommunityPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<UserSubmission[]>([]);
  const [formData, setFormData] = useState({ word: '', definition: '', user: '' });
  const [loading, setLoading] = useState(false);

  const refreshList = async () => {
    const subs = await fetchSubmissions();
    setSubmissions(subs);
  };

  useEffect(() => {
    refreshList();
  }, []);

  const isValid = formData.word.trim().length > 0 && formData.definition.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);

    const newSub: UserSubmission = {
      id: Date.now().toString(),
      word: formData.word,
      definition: formData.definition,
      user: formData.user || 'Anonymous',
      votes: 0,
      createdAt: new Date().toISOString()
    };

    await addSubmission(newSub);
    await refreshList();
    setFormData({ word: '', definition: '', user: '' });
    setLoading(false);
  };

  const handleVote = async (id: string) => {
    await voteSubmission(id);
    await refreshList();
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 transition-colors duration-300">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold mb-4 text-ink">The People's Dictionary</h1>
        <p className="text-ink/60">Suggest words for the official Word of Tomorrow consideration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Submission Form */}
        <div className="bg-surface p-8 rounded-lg border border-ink/10 shadow-sm h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-ink">
            <Send size={18} className="text-accent" /> Submit an Idea
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-1">Word</label>
              <input 
                value={formData.word}
                onChange={e => setFormData({...formData, word: e.target.value})}
                className="w-full p-2 bg-paper border border-ink/20 rounded focus:border-accent outline-none text-ink placeholder:text-ink/30"
                placeholder="e.g. Blurgle"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-1">Definition</label>
              <textarea 
                value={formData.definition}
                onChange={e => setFormData({...formData, definition: e.target.value})}
                className="w-full p-2 bg-paper border border-ink/20 rounded focus:border-accent outline-none h-24 resize-none text-ink placeholder:text-ink/30"
                placeholder="What does it mean?"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink/40 mb-1">Username (Optional)</label>
              <input 
                 value={formData.user}
                 onChange={e => setFormData({...formData, user: e.target.value})}
                 className="w-full p-2 bg-paper border border-ink/20 rounded focus:border-accent outline-none text-ink placeholder:text-ink/30"
                 placeholder="LexiconLover99"
              />
            </div>
            
            {/* The "Save" Button that lights up */}
            <button 
                type="submit" 
                disabled={!isValid || loading}
                className={`w-full py-2 rounded font-medium transition-all duration-300 ${
                    isValid && !loading
                    ? 'bg-ink text-paper hover:bg-ink/90 shadow-md' 
                    : 'bg-ink/10 text-ink/30 cursor-not-allowed'
                }`}
            >
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </form>
        </div>

        {/* Voting List */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-ink">
            <MessageSquare size={18} className="text-secondary" /> Latest Suggestions
          </h3>
          
          {submissions.length === 0 && (
            <p className="text-ink/40 italic">No submissions yet. Be the first!</p>
          )}

          {submissions.map(sub => (
            <div key={sub.id} className="bg-surface p-5 rounded border border-ink/5 hover:border-ink/20 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-serif font-bold text-xl text-ink">{sub.word}</h4>
                <button 
                  onClick={() => handleVote(sub.id)}
                  className="flex items-center gap-1 text-xs font-bold text-ink/50 hover:text-accent transition-colors bg-paper px-2 py-1 rounded-full border border-ink/5"
                >
                  <ThumbsUp size={14} /> {sub.votes}
                </button>
              </div>
              <p className="text-ink/80 text-sm mb-3 leading-relaxed">
                {sub.definition}
              </p>
              <div className="text-[10px] text-ink/30 uppercase tracking-widest flex justify-between">
                <span>By {sub.user}</span>
                <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};