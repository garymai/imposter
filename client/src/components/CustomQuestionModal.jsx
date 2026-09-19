import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Sparkles, Plus, Trash2, HelpCircle, Star, BookmarkCheck, Check } from 'lucide-react';

export default function CustomQuestionModal({ isOpen, onClose }) {
  const { gameState, addCustomQuestion, removeCustomQuestion } = useSocket();
  const [normalQuestion, setNormalQuestion] = useState('');
  const [imposterQuestion, setImposterQuestion] = useState('');
  const [tab, setTab] = useState('new'); // 'new' | 'my_questions' | 'saved'
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const myQuestions = gameState?.myCustomQuestions || [];
  const roomCount = gameState?.customQuestionsCount || 0;

  // Load saved templates from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('imposter_saved_questions');
      if (stored) {
        setSavedTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read saved questions from localStorage', e);
    }
  }, []);

  const saveToLocalStorage = (newTemplates) => {
    try {
      localStorage.setItem('imposter_saved_questions', JSON.stringify(newTemplates));
      setSavedTemplates(newTemplates);
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const cleanNorm = normalQuestion.trim();
    const cleanImp = imposterQuestion.trim();
    if (!cleanNorm || !cleanImp) return;

    addCustomQuestion(cleanNorm, cleanImp, (res) => {
      if (res?.success) {
        // Also save to user's local templates for future games
        const exists = savedTemplates.some(
          (t) => t.normalQuestion.toLowerCase() === cleanNorm.toLowerCase()
        );
        if (!exists) {
          const updated = [{ normalQuestion: cleanNorm, imposterQuestion: cleanImp }, ...savedTemplates].slice(0, 30);
          saveToLocalStorage(updated);
        }

        setNormalQuestion('');
        setImposterQuestion('');
        setFeedbackMsg('Added to room! ⭐');
        setTimeout(() => setFeedbackMsg(null), 2500);
      }
    });
  };

  const handleLoadTemplate = (tpl) => {
    setNormalQuestion(tpl.normalQuestion);
    setImposterQuestion(tpl.imposterQuestion);
    setTab('new');
  };

  const handleDeleteTemplate = (index) => {
    const updated = savedTemplates.filter((_, i) => i !== index);
    saveToLocalStorage(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-white text-base sm:text-lg leading-tight">
                Custom Question Pairs
              </h3>
              <span className="text-xs text-slate-400">
                {roomCount} custom question{roomCount !== 1 ? 's' : ''} in room
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3">
          <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab('new')}
              className={`py-2 rounded-xl transition ${
                tab === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Submit New
            </button>
            <button
              type="button"
              onClick={() => setTab('my_questions')}
              className={`py-2 rounded-xl transition ${
                tab === 'my_questions'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In Room ({myQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('saved')}
              className={`py-2 rounded-xl transition ${
                tab === 'saved'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved ({savedTemplates.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'new' && (
            <form onSubmit={handleAdd} className="space-y-4">
              {/* Normal Question */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center justify-between">
                  <span>🛡️ Normal Question (Innocents)</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {normalQuestion.length}/150
                  </span>
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={150}
                  placeholder="e.g. What is Gary's most iconic catchphrase?"
                  value={normalQuestion}
                  onChange={(e) => setNormalQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Imposter Question */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center justify-between">
                  <span>🕵️‍♂️ Imposter Question (Secret)</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {imposterQuestion.length}/150
                  </span>
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={150}
                  placeholder="e.g. What is a famous quote from a movie supervillain?"
                  value={imposterQuestion}
                  onChange={(e) => setImposterQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 transition resize-none"
                />
              </div>

              {/* Strategy Tip */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pro Tip for Great Questions</span>
                </div>
                <p>
                  Make the questions subtly related so answers can overlap! If the questions are totally unrelated, the Imposter is caught too easily.
                </p>
              </div>

              {feedbackMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{feedbackMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!normalQuestion.trim() || !imposterQuestion.trim()}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>Add Question to Room</span>
              </button>
            </form>
          )}

          {tab === 'my_questions' && (
            <div className="space-y-3">
              {myQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Star className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p>You haven't submitted any questions to this room yet.</p>
                  <button
                    onClick={() => setTab('new')}
                    className="mt-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition"
                  >
                    Submit One Now
                  </button>
                </div>
              ) : (
                myQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 relative group"
                  >
                    <div className="pr-8">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                        🛡️ Normal
                      </span>
                      <p className="text-xs font-medium text-slate-200">"{q.normalQuestion}"</p>
                    </div>
                    <div className="pr-8">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">
                        🕵️‍♂️ Imposter
                      </span>
                      <p className="text-xs font-medium text-slate-300">"{q.imposterQuestion}"</p>
                    </div>

                    <button
                      onClick={() => removeCustomQuestion(q.id)}
                      title="Remove from room"
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'saved' && (
            <div className="space-y-3">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <BookmarkCheck className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  <p>Questions you submit are automatically saved here so you can reuse them in future games!</p>
                </div>
              ) : (
                savedTemplates.map((tpl, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 overflow-hidden space-y-1">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        🛡️ "{tpl.normalQuestion}"
                      </p>
                      <p className="text-xs font-medium text-slate-400 truncate">
                        🕵️‍♂️ "{tpl.imposterQuestion}"
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLoadTemplate(tpl)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
