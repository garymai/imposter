import React from 'react';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Vote, AlertTriangle, ShieldCheck, Skull, Sparkles, HelpCircle } from 'lucide-react';

export default function QuestionReveal() {
  const { gameState, startVoting } = useSocket();

  const isHost = gameState?.isHost;
  const revealedQuestion = gameState?.revealedQuestion;
  const answers = gameState?.answers || [];
  const roleInfo = gameState?.roleInfo;
  const isImposter = roleInfo?.role === 'imposter';
  const myPlayerId = gameState?.myPlayerId;

  return (
    <div className="max-w-lg mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            Phase 2: Discussion
          </span>
          <div className="text-xs text-indigo-400 flex items-center gap-1 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Debate Time!</span>
          </div>
        </div>

        {/* Revealed Normal Question Hero Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl mb-4 text-center">
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400 block mb-1">
            The Revealed Question Is
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            "{revealedQuestion}"
          </h2>

          <div className="mt-3 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>One player answered a <strong>completely different secret question</strong>!</span>
          </div>
        </div>

        {/* Private Role Alert for the Player */}
        <div className="mb-4">
          {isImposter ? (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-left">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide mb-1">
                <Skull className="w-4 h-4" />
                <span>You are the Imposter!</span>
              </div>
              <p className="text-xs text-slate-300">
                Your question was: <strong className="text-white">"{roleInfo?.myQuestion}"</strong>.
              </p>
              <p className="text-[11px] text-rose-300/90 mt-1 font-medium">
                Bluff! Defend your answer and convince the group it makes sense for the revealed question!
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>You are Innocent. Find out whose answer is suspicious!</span>
              </div>
            </div>
          )}
        </div>

        {/* Answers List */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 px-1 flex items-center justify-between">
            <span>Submitted Answers ({answers.length})</span>
            <span className="text-[11px] text-slate-500 font-normal">Cross-examine each other!</span>
          </h4>

          <div className="space-y-2.5">
            {answers.map((item) => {
              const isMe = item.playerId === myPlayerId;
              return (
                <div
                  key={item.playerId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isMe
                      ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.avatar}</span>
                      <span className="font-bold text-sm text-white">{item.name}</span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-slate-100 bg-slate-950/80 px-3.5 py-2.5 rounded-xl border border-slate-800/80 tracking-wide">
                    "{item.answer}"
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Actions (Sticky at bottom) */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 -mx-4 px-4 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
        {isHost ? (
          <button
            onClick={startVoting}
            className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Vote className="w-5 h-5" />
            <span>Start Imposter Voting</span>
          </button>
        ) : (
          <div className="text-center py-3 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse">
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Discuss with your friends! The host will start voting when everyone is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
