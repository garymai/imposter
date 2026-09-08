import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Mic, ArrowRight, Vote, Check, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function ClueRound() {
  const { gameState, nextClue, startVoting } = useSocket();
  const [showWordReminder, setShowWordReminder] = useState(false);

  const isHost = gameState?.isHost;
  const clueOrder = gameState?.clueOrder || [];
  const currentIndex = gameState?.currentClueIndex || 0;
  const currentSpeakerId = clueOrder[currentIndex];
  const isMyTurn = currentSpeakerId === gameState?.myPlayerId;
  const isLastSpeaker = currentIndex === clueOrder.length - 1;

  const currentSpeaker = gameState?.players.find((p) => p.id === currentSpeakerId);
  const roleInfo = gameState?.roleInfo;

  return (
    <div className="max-w-lg mx-auto p-4 min-h-screen flex flex-col justify-between">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            Phase 2: Clue Round
          </span>
          <div className="text-xs text-slate-400">
            Turn <strong className="text-white">{currentIndex + 1}</strong> of {clueOrder.length}
          </div>
        </div>

        {/* Category Banner */}
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{roleInfo?.category?.icon}</span>
            <span className="text-slate-300 font-semibold">{roleInfo?.category?.name}</span>
          </div>

          {/* Quick Word Reminder (Innocents only) */}
          {roleInfo?.role === 'innocent' && (
            <button
              onClick={() => setShowWordReminder(!showWordReminder)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 border border-slate-700"
            >
              {showWordReminder ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showWordReminder ? roleInfo.word : 'Peek Word'}</span>
            </button>
          )}
        </div>

        {/* Current Turn Hero Card */}
        <div
          className={`text-center p-8 rounded-3xl border transition-all duration-300 shadow-2xl mb-6 ${
            isMyTurn
              ? 'bg-gradient-to-b from-rose-950/70 to-slate-900 border-rose-500 shadow-rose-900/30 ring-2 ring-rose-500/50 animate-pulse-glow'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="text-6xl mb-3 animate-float inline-block">
            {currentSpeaker?.avatar || '🗣️'}
          </div>

          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
            {isMyTurn ? '🚨 Your Turn to Speak!' : 'Currently Speaking'}
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            {isMyTurn ? 'Say Your Clue!' : `${currentSpeaker?.name}'s Turn`}
          </h2>

          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            {isMyTurn
              ? 'Give a 1-word or short clue out loud to the group!'
              : `Listen carefully to ${currentSpeaker?.name}'s clue to spot any suspicion.`}
          </p>
        </div>

        {/* Turn Order List */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Turn Order
          </h4>
          <div className="space-y-1.5">
            {clueOrder.map((pid, idx) => {
              const player = gameState?.players.find((p) => p.id === pid);
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div
                  key={pid}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-sm transition ${
                    isCurrent
                      ? 'bg-rose-500/10 border-rose-500/50 text-white font-bold'
                      : isPast
                      ? 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs font-mono text-slate-500">
                      {idx + 1}.
                    </span>
                    <span className="text-base">{player?.avatar}</span>
                    <span>{player?.name}</span>
                    {player?.id === gameState.myPlayerId && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        You
                      </span>
                    )}
                  </div>

                  <div>
                    {isPast && <Check className="w-4 h-4 text-emerald-500" />}
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-semibold">
                        Speaking
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
        {/* Next Turn button (visible to current speaker or host) */}
        {(isMyTurn || isHost) && (
          <button
            onClick={nextClue}
            className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            {isLastSpeaker ? (
              <>
                <Vote className="w-5 h-5" />
                <span>Finish Clues & Start Voting</span>
              </>
            ) : (
              <>
                <span>Done! Next Player</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}

        {/* Host quick skip to voting */}
        {isHost && !isLastSpeaker && (
          <button
            onClick={startVoting}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            Host: Skip Directly to Discussion & Voting
          </button>
        )}
      </div>
    </div>
  );
}
