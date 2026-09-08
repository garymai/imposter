import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Vote, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Voting() {
  const { gameState, submitVote, error } = useSocket();
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const requiredVotes = gameState?.settings?.imposterCount || 1;
  const myPlayerId = gameState?.myPlayerId;
  const players = gameState?.players || [];

  // Candidates to vote for (cannot vote for yourself)
  const candidates = players.filter((p) => p.id !== myPlayerId);

  const handleToggleSelect = (targetId) => {
    if (submitted) return;

    if (requiredVotes === 1) {
      setSelectedIds([targetId]);
    } else {
      // 2 votes mode
      if (selectedIds.includes(targetId)) {
        setSelectedIds(selectedIds.filter((id) => id !== targetId));
      } else {
        if (selectedIds.length < requiredVotes) {
          setSelectedIds([...selectedIds, targetId]);
        } else {
          // If already selected 2, replace the oldest selection
          setSelectedIds([selectedIds[1], targetId]);
        }
      }
    }
  };

  const handleConfirmVote = () => {
    if (selectedIds.length !== requiredVotes) return;
    submitVote(selectedIds);
    setSubmitted(true);
  };

  const votedCount = players.filter((p) => p.hasVoted).length;
  const totalPlayers = players.length;

  return (
    <div className="max-w-lg mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
            Phase 3: Voting
          </span>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Discussion & Ballot</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Who is the Imposter?
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {requiredVotes === 1 ? (
              <span>Select <strong>1 player</strong> you suspect is the Imposter.</span>
            ) : (
              <span>
                There are <strong>2 Imposters</strong>! Select <strong>2 suspects</strong>.
              </span>
            )}
          </p>

          {/* Selection counter badge */}
          <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800">
            <span>Selected:</span>
            <span
              className={
                selectedIds.length === requiredVotes
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }
            >
              {selectedIds.length} / {requiredVotes}
            </span>
          </div>
        </div>

        {/* Suspect Candidate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {candidates.map((player) => {
            const isSelected = selectedIds.includes(player.id);

            return (
              <button
                key={player.id}
                type="button"
                disabled={submitted}
                onClick={() => handleToggleSelect(player.id)}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                  submitted ? 'cursor-default' : 'active:scale-[0.98]'
                } ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-950/40 ring-2 ring-rose-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{player.avatar}</span>
                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">
                      {player.name}
                    </h4>
                    <span className="text-xs text-slate-400">Suspect</span>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  {isSelected && <Vote className="w-3.5 h-3.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Voting Progress */}
        <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Votes Submitted</span>
            <strong className="text-slate-200">
              {votedCount} / {totalPlayers} players
            </strong>
          </div>

          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <div
                key={p.id}
                className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 border ${
                  p.hasVoted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="truncate max-w-[80px]">{p.name}</span>
                {p.hasVoted && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Submit Action (Sticky at bottom so always visible) */}
      <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-800/80 -mx-4 px-4 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]">
        {submitted ? (
          <div className="py-3.5 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Ballot Submitted! Waiting for results...</span>
          </div>
        ) : (
          <button
            onClick={handleConfirmVote}
            disabled={selectedIds.length !== requiredVotes}
            className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition shadow-xl ${
              selectedIds.length === requiredVotes
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/25 active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span>
              {selectedIds.length === requiredVotes
                ? `Confirm Vote for ${selectedIds.length} Suspect${selectedIds.length > 1 ? 's' : ''}`
                : `Select ${requiredVotes - selectedIds.length} More Suspect${requiredVotes - selectedIds.length > 1 ? 's' : ''}`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
