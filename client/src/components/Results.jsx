import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ShieldCheck, Skull, Vote, Award } from 'lucide-react';

export default function Results() {
  const { gameState, playAgain } = useSocket();

  const isHost = gameState?.isHost;
  const innocentsWon = gameState?.winner === 'innocents';
  const winReason = gameState?.winReason;
  const secretWord = gameState?.secretWord;
  const players = gameState?.players || [];
  const voteResults = gameState?.voteResults;
  const voteCounts = voteResults?.voteCounts || {};

  useEffect(() => {
    // Trigger celebratory confetti on victory
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti effect ignored:', e);
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between">
      <div>
        {/* Victory Hero Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl text-center border shadow-2xl mb-6 relative overflow-hidden ${
            innocentsWon
              ? 'bg-gradient-to-b from-emerald-950/80 to-slate-900 border-emerald-500/50 shadow-emerald-950/50'
              : 'bg-gradient-to-b from-rose-950/80 to-slate-900 border-rose-500/50 shadow-rose-950/50'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-center text-4xl shadow-inner animate-float">
            {innocentsWon ? '🎉' : '🕵️‍♂️'}
          </div>

          <span
            className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border mb-2 inline-block ${
              innocentsWon
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            Game Concluded
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            {innocentsWon ? 'Innocents Win!' : 'Imposters Win!'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
            {winReason}
          </p>

          {/* Revealed Secret Word */}
          <div className="mt-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl inline-block w-full">
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-500 block mb-1">
              The Secret Word Was
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {secretWord}
            </span>
          </div>
        </div>

        {/* Players & Roles Breakdown */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Players, Roles & Votes</span>
          </h4>

          <div className="space-y-2">
            {players.map((player) => {
              const isImp = player.role === 'imposter';
              const votesReceived = voteCounts[player.id] || 0;
              const isAccused = voteResults?.accusedIds?.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    isImp
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{player.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-white text-sm">
                          {player.name}
                        </h5>
                        {player.id === gameState.myPlayerId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isImp ? (
                          <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                            <Skull className="w-3 h-3" /> Imposter
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Innocent
                          </span>
                        )}
                        {isAccused && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 rounded">
                            Accused
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vote Count Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                    <Vote className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-200">{votesReceived} vote{votesReceived !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Host Rematch Button (Sticky at bottom so always visible) */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 -mx-4 px-4 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
        {isHost ? (
          <button
            onClick={playAgain}
            className="w-full py-3.5 sm:py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Play Again (Same Room)</span>
          </button>
        ) : (
          <div className="text-center py-3 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse">
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              Waiting for the host to start another round...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
