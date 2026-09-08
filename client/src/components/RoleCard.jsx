import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Eye, EyeOff, ShieldCheck, Skull, CheckCircle2, Lock, Unlock } from 'lucide-react';

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

  const toggleReveal = () => {
    setIsRevealed((prev) => !prev);
  };

  return (
    <div className="max-w-lg mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between select-none">
      {/* Header */}
      <div className="text-center pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full inline-block">
          Phase 1: Secret Roles
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
          Your Secret Assignment
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isRevealed
            ? 'Keep your screen hidden from other players!'
            : 'Make sure no one is looking, then tap to reveal.'}
        </p>
      </div>

      {/* Secret Card (Interactive Tap to Reveal / Hide) */}
      <div className="my-auto py-2">
        <div
          onClick={toggleReveal}
          className={`cursor-pointer rounded-3xl p-5 sm:p-6 transition-all duration-300 border shadow-2xl relative overflow-hidden min-h-[250px] flex flex-col justify-between ${
            isRevealed
              ? isImposter
                ? 'bg-gradient-to-b from-rose-950/90 via-slate-900 to-slate-950 border-rose-500/60 shadow-rose-950/60 ring-2 ring-rose-500/30'
                : 'bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-950 border-emerald-500/60 shadow-emerald-950/60 ring-2 ring-emerald-500/30'
              : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          {isRevealed ? (
            <div className="flex-1 flex flex-col justify-between text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Role Header Badge */}
              <div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black tracking-wide uppercase border shadow-md ${
                    isImposter
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isImposter ? (
                    <>
                      <Skull className="w-4 h-4 text-rose-400" />
                      <span>You are an Imposter</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>You are Innocent</span>
                    </>
                  )}
                </div>

                {/* Category */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                    Category
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-200 flex items-center justify-center gap-2">
                    <span className="text-xl">{roleInfo?.category?.icon}</span>
                    <span>{roleInfo?.category?.name}</span>
                  </div>
                </div>
              </div>

              {/* Secret Word Display Box */}
              <div className="py-5 px-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner my-auto">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
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

              {/* Strategy / Bluff Tips */}
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-left text-slate-300">
                {isImposter ? (
                  <div>
                    <strong className="text-rose-400 block mb-0.5">Bluff Strategy:</strong>
                    You don't know the word! Listen carefully to earlier clues, stay calm, and give a related hint.
                    {roleInfo?.fellowImposters?.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-amber-300">
                        🤝 Fellow Imposter: <strong>{roleInfo.fellowImposters.join(', ')}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <strong className="text-emerald-400 block mb-0.5">Innocent Strategy:</strong>
                    Give a subtle clue to prove you know the word without making it obvious to the Imposter!
                  </div>
                )}
              </div>

              {/* Tap to Hide Indicator */}
              <div className="pt-1">
                <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Tap card anytime to hide</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-20 h-20 mb-4 rounded-3xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-rose-400 shadow-xl group-hover:scale-105 transition">
                <Lock className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Role Is Hidden</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto mb-6">
                Tap anywhere on this card to reveal your secret word and role.
              </p>
              <div className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25">
                <Eye className="w-4 h-4" />
                <span>Tap to Reveal</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer (Sticky at bottom so always visible) */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 -mx-4 px-4 space-y-2 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
        {/* Toggle Button */}
        <button
          type="button"
          onClick={toggleReveal}
          className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border transition active:scale-[0.99] ${
            isRevealed
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              : 'bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-500/20'
          }`}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide My Role</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Tap to Reveal Role</span>
            </>
          )}
        </button>

        {/* Ready Button */}
        <button
          onClick={handleConfirmReady}
          disabled={hasConfirmed}
          className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition ${
            hasConfirmed
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
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

        <div className="text-center text-[11px] text-slate-400">
          Ready: <strong className="text-slate-200">{readyCount}</strong> / {totalPlayers} players
        </div>
      </div>
    </div>
  );
}
