import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Eye, EyeOff, ShieldCheck, Skull, CheckCircle2, HelpCircle } from 'lucide-react';

export default function RoleCard() {
  const { gameState, playerReady } = useSocket();
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const roleInfo = gameState?.roleInfo;
  const isImposter = roleInfo?.role === 'imposter';
  const readyCount = gameState?.players.filter((p) => p.ready).length || 0;
  const totalPlayers = gameState?.players.length || 0;

  const handleConfirmReady = () => {
    setHasConfirmed(true);
    playerReady();
  };

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col justify-between">
      {/* Header */}
      <div className="text-center pt-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          Phase 1: Secret Roles
        </span>
        <h2 className="text-2xl font-bold text-white mt-3">Your Secret Assignment</h2>
        <p className="text-sm text-slate-400 mt-1">
          Keep your screen hidden from nearby players!
        </p>
      </div>

      {/* Secret Card */}
      <div className="my-auto py-6">
        <div
          className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 border shadow-2xl overflow-hidden ${
            isRevealed
              ? isImposter
                ? 'bg-gradient-to-b from-rose-950/80 to-slate-900 border-rose-500/50 shadow-rose-950/50'
                : 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500/50 shadow-emerald-950/50'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          {isRevealed ? (
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Role Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black tracking-wide uppercase border shadow-md">
                {isImposter ? (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Skull className="w-4 h-4" /> You are an Imposter
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" /> You are Innocent
                  </span>
                )}
              </div>

              {/* Category */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                  Category
                </span>
                <div className="text-lg font-bold text-slate-200 flex items-center justify-center gap-2">
                  <span>{roleInfo?.category?.icon}</span>
                  <span>{roleInfo?.category?.name}</span>
                </div>
              </div>

              {/* Secret Word Box */}
              <div className="py-5 px-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">
                  {isImposter ? 'Secret Word' : 'The Secret Word Is'}
                </span>
                {isImposter ? (
                  <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-wider">
                    ??? HIDDEN ???
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-wider">
                    {roleInfo?.word}
                  </div>
                )}
              </div>

              {/* Strategic Tip */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-left text-slate-300">
                {isImposter ? (
                  <div>
                    <strong className="text-rose-400 block mb-1">Bluff Guide:</strong>
                    You don't know the word! Listen to others' clues, stay confident, and give vague or related hints.
                    {roleInfo?.fellowImposters?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-amber-300">
                        🤝 Fellow Imposter:{' '}
                        <strong>{roleInfo.fellowImposters.join(', ')}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <strong className="text-emerald-400 block mb-1">Innocent Guide:</strong>
                    Give a subtle clue that only other innocents will understand. Don't make it so obvious that the Imposter guesses the word!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
                <EyeOff className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Role Is Hidden</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                Tap and hold the peek button below when no one is looking at your screen.
              </p>
            </div>
          )}

          {/* Peek Toggle Button */}
          <button
            type="button"
            onPointerDown={() => setIsRevealed(true)}
            onPointerUp={() => setIsRevealed(false)}
            onPointerLeave={() => setIsRevealed(false)}
            className={`w-full mt-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition ${
              isRevealed
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/20'
            }`}
          >
            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{isRevealed ? 'Release to Hide' : 'Press & Hold to Peek'}</span>
          </button>
        </div>
      </div>

      {/* Ready Action Footer */}
      <div className="space-y-3 pb-4">
        <button
          onClick={handleConfirmReady}
          disabled={hasConfirmed}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition ${
            hasConfirmed
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white active:scale-[0.99]'
          }`}
        >
          {hasConfirmed ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Ready! Waiting for other players...</span>
            </>
          ) : (
            <span>I've Memorized My Role (Ready)</span>
          )}
        </button>

        <div className="text-center text-xs text-slate-400">
          Ready: <strong className="text-slate-200">{readyCount}</strong> / {totalPlayers} players
        </div>
      </div>
    </div>
  );
}
