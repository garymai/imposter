import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { HelpCircle, Send, CheckCircle2, Eye, EyeOff, Lock, Users, Sparkles } from 'lucide-react';

export default function QuestionAnswering() {
  const { gameState, submitAnswer } = useSocket();
  const [answerInput, setAnswerInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const roleInfo = gameState?.roleInfo;
  const question = roleInfo?.question;
  const category = roleInfo?.category;
  const players = gameState?.players || [];
  const answeredCount = players.filter((p) => p.hasAnswered).length;
  const totalPlayers = players.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;
    submitAnswer(answerInput.trim());
    setHasSubmitted(true);
  };

  return (
    <div className="max-w-lg mx-auto w-full p-4 min-h-[100dvh] flex flex-col justify-between select-none">
      {/* Header */}
      <div className="text-center pt-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full inline-block">
          Phase 1: Question Round
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
          Your Secret Question
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Answer the question shown on your screen. Keep it private!
        </p>
      </div>

      {/* Secret Question Card */}
      <div className="my-auto py-2">
        <div
          className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 border shadow-2xl relative overflow-hidden min-h-[220px] flex flex-col justify-between ${
            isRevealed
              ? 'bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-950 border-indigo-500/50 shadow-indigo-950/50 ring-2 ring-indigo-500/20'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {isRevealed ? (
            <div className="flex-1 flex flex-col justify-between text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Category Badge */}
              <div className="flex items-center justify-between">
                {category ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                ) : <div />}
                <button
                  type="button"
                  onClick={() => setIsRevealed(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                  title="Hide question"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>

              {/* Question Text Box */}
              <div className="py-4 px-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner my-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                  Question
                </span>
                <div className="text-lg sm:text-xl font-bold text-white tracking-wide leading-relaxed">
                  "{question || 'Loading question...'}"
                </div>
              </div>

              {/* Hint */}
              <p className="text-[11px] text-slate-400">
                💡 Tip: Give an answer that proves you belong without being overly obvious!
              </p>
            </div>
          ) : (
            <div
              onClick={() => setIsRevealed(true)}
              className="flex-1 flex flex-col items-center justify-center text-center py-8 cursor-pointer"
            >
              <div className="w-16 h-16 mb-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-lg">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white mb-1">Question Is Hidden</h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4">
                Tap anywhere to reveal your secret question
              </p>
              <div className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30">
                <Eye className="w-4 h-4" />
                <span>Tap to Reveal</span>
              </div>
            </div>
          )}
        </div>

        {/* Answering Form or Confirmation */}
        <div className="mt-4">
          {hasSubmitted ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2 animate-in fade-in">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Answer Submitted!</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 font-semibold text-sm">
                "{answerInput.trim()}"
              </div>
              <p className="text-xs text-slate-400">
                Waiting for remaining players to submit their answers...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  Your Answer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="Type a word or short phrase..."
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-base"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-slate-500 font-mono">
                    {answerInput.length}/60
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!answerInput.trim()}
                className={`w-full py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition shadow-xl ${
                  answerInput.trim()
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-indigo-500/25 active:scale-[0.99]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Submit Answer</span>
              </button>
            </form>
          )}
        </div>

        {/* Live Submission Progress */}
        <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Answers Submitted</span>
            </span>
            <strong className="text-slate-200">
              {answeredCount} / {totalPlayers}
            </strong>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {players.map((p) => (
              <div
                key={p.id}
                className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 border transition ${
                  p.hasAnswered
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="truncate max-w-[70px]">{p.name}</span>
                {p.hasAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-[11px] text-slate-500 py-1">
        Once everyone answers, the question and answers will be revealed for group debate!
      </div>
    </div>
  );
}
