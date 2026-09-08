import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Crown, Users, Play, Settings2, QrCode, Copy, Check, Sparkles, AlertCircle, LogOut } from 'lucide-react';
import QRCodeModal from './QRCodeModal';

const AVATARS = ['🦊', '🐱', '🐶', '🦁', '🐼', '🐨', '🦄', '🐸', '🐵', '🐙', '🦉', '🐯'];

export default function Lobby() {
  const {
    gameState,
    createRoom,
    joinRoom,
    updateSettings,
    startGame,
    leaveRoom,
    error
  } = useSocket();

  const [tab, setTab] = useState('join'); // 'join' | 'create'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check URL query parameters for ?room=ABCD
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    createRoom(playerName.trim(), avatar);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), avatar);
  };

  const handleCopyCode = () => {
    if (!gameState?.code) return;
    navigator.clipboard.writeText(gameState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If not inside a room, show Join/Create screens
  if (!gameState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Game Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 mb-4 shadow-xl text-4xl animate-float">
            🕵️‍♂️
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            THE IMPOSTER
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 font-medium">
            Find the imposter among your friends — or bluff your way to victory!
          </p>
        </div>

        {/* Auth / Entry Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-950 rounded-2xl mb-6 border border-slate-800/80">
            <button
              onClick={() => setTab('join')}
              className={`py-2.5 font-bold text-sm rounded-xl transition ${
                tab === 'join'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Join Game
            </button>
            <button
              onClick={() => setTab('create')}
              className={`py-2.5 font-bold text-sm rounded-xl transition ${
                tab === 'create'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Host Game
            </button>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'join' ? handleJoin : handleCreate} className="space-y-5">
            {/* Player Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                required
                maxLength={15}
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition text-base"
              />
            </div>

            {/* Room Code (for Join tab) */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  4-Letter Room Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="e.g. GAME"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-center font-mono font-bold tracking-widest text-2xl placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition uppercase"
                />
              </div>
            )}

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Choose Avatar
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-slate-950/60 rounded-2xl border border-slate-800/80">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`h-11 flex items-center justify-center text-2xl rounded-xl transition ${
                      avatar === emoji
                        ? 'bg-rose-500/20 border border-rose-500/50 scale-110 shadow-sm'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg shadow-rose-500/25 transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>{tab === 'join' ? 'Enter Room' : 'Create Room'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Inside Room Lobby
  const isHost = gameState.isHost;
  const minPlayers = gameState.settings.imposterCount === 2 ? 5 : 3;
  const canStart = gameState.players.length >= minPlayers;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 min-h-screen flex flex-col justify-between">
      <div>
        {/* Top Bar: Room Code & Quick Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Room Code
              </span>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-white">
                  {gameState.code}
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyCode}
                    title="Copy Code"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setShowQR(true)}
                    title="Show QR Code"
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    <QrCode className="w-5 h-5 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-sm text-slate-300">
                <Users className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">{gameState.players.length} Players</span>
              </div>
              <button
                onClick={leaveRoom}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Leave Room"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Host Game Settings */}
        {isHost ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-slate-300">
              <Settings2 className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-base">Game Settings (Host)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Number of Imposters (1 or 2) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Imposters
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => updateSettings({ imposterCount: 1 })}
                    className={`py-2 rounded-xl font-bold text-sm transition ${
                      gameState.settings.imposterCount === 1
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Imposter
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ imposterCount: 2 })}
                    className={`py-2 rounded-xl font-bold text-sm transition ${
                      gameState.settings.imposterCount === 2
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Imposters
                  </button>
                </div>
                {gameState.settings.imposterCount === 2 && (
                  <p className="text-xs text-amber-400/90 mt-1.5 flex items-center gap-1 font-medium">
                    <span>⚠️ Requires at least 5 players</span>
                  </p>
                )}
              </div>

              {/* Category Pack */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Category Pack
                </label>
                <select
                  value={gameState.settings.categoryId}
                  onChange={(e) => updateSettings({ categoryId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">🎲 Random / All Categories</option>
                  {gameState.categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 text-sm text-slate-400 flex items-center justify-between">
            <span>
              Mode: <strong className="text-slate-200">{gameState.settings.imposterCount} Imposter{gameState.settings.imposterCount > 1 ? 's' : ''}</strong>
            </span>
            <span>
              Category: <strong className="text-slate-200">{gameState.settings.categoryId === 'all' ? '🎲 Random' : gameState.settings.categoryId}</strong>
            </span>
          </div>
        )}

        {/* Players Grid */}
        <div className="mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Joined Players ({gameState.players.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                  player.id === gameState.myPlayerId
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="text-2xl">{player.avatar}</div>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-white truncate">
                      {player.name}
                    </span>
                    {player.isHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block">
                    {player.id === gameState.myPlayerId ? '(You)' : 'Ready'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        {isHost ? (
          <div>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-xl ${
                canStart
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-rose-500/25 active:scale-[0.99]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Start Game</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-amber-400 mt-2 font-medium">
                Need at least {minPlayers} players to start ({gameState.players.length}/{minPlayers} joined).
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse">
            <p className="text-slate-400 text-sm font-medium">
              Waiting for the host to start the game...
            </p>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        roomCode={gameState.code}
        serverIp={gameState.serverIp}
      />
    </div>
  );
}
