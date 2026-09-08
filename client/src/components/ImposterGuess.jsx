import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Sparkles, HelpCircle, Send, AlertTriangle } from 'lucide-react';

export default function ImposterGuess() {
  const { gameState, submitImposterGuess } = useSocket();
  const [customGuess, setCustomGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isImposter = gameState?.roleInfo?.role === 'imposter';
  const guessOptions = gameState?.guessOptions || [];
  const category = gameState?.roleInfo?.category;

  const handleSelectOption = (word) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    submitImposterGuess(word);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customGuess.trim() || isSubmitting) return;
    setIsSubmitting(true);
    submitImposterGuess(customGuess.trim());
  };

  if (!isImposter) {
    // Innocent view: waiting for imposter to guess
    return (
      <div className="max-w-md mx-auto w-full p-4 min-h-[100dvh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 animate-pulse">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
          Suspense Round
        </span>

        <h2 className="text-3xl font-black text-white mb-2">Imposter Was Caught!</h2>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          The Innocents correctly identified the Imposter. However, the Imposter gets one last-chance attempt to guess the secret word and steal the victory!
        </p>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 text-slate-300 text-sm">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span>Waiting for Imposter's secret guess...</span>
        </div>
      </div>
    );
  }

  // Imposter view: Guess the word
  return (
    <div className="max-w-md mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div>
        <div className="text-center pt-4 mb-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3 shadow-lg shadow-rose-950/50">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            Last Chance
          </span>

          <h2 className="text-3xl font-black text-white mt-2">Steal the Win!</h2>
          <p className="text-xs text-slate-400 mt-1">
            You were accused! If you guess the secret word correctly, you win!
          </p>

          {category && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
              <span>{category.icon}</span>
              <span>Category: {category.name}</span>
            </div>
          )}
        </div>

        {/* Multiple choice word options */}
        {guessOptions.length > 0 && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
              Pick a Word
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {guessOptions.map((word) => (
                <button
                  key={word}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelectOption(word)}
                  className="py-3.5 px-5 bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/50 rounded-2xl text-left font-bold text-base text-white transition active:scale-[0.99] flex items-center justify-between group"
                >
                  <span>{word}</span>
                  <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Or custom word input */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Or Type Your Guess
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type word..."
              value={customGuess}
              disabled={isSubmitting}
              onChange={(e) => setCustomGuess(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={!customGuess.trim() || isSubmitting}
              className="px-5 py-3 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 disabled:bg-slate-800 disabled:text-slate-600 text-white transition flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <div className="pb-4 text-center text-xs text-slate-500">
        Carefully recall the clues given during the round!
      </div>
    </div>
  );
}
