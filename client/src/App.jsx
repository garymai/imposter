import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import Lobby from './components/Lobby';
import RoleCard from './components/RoleCard';
import ClueRound from './components/ClueRound';
import Voting from './components/Voting';
import ImposterGuess from './components/ImposterGuess';
import Results from './components/Results';
import { WifiOff } from 'lucide-react';

function GameContainer() {
  const { gameState, isConnected } = useSocket();

  const renderCurrentPhase = () => {
    if (!gameState || gameState.phase === 'lobby') {
      return <Lobby />;
    }

    switch (gameState.phase) {
      case 'role_reveal':
        return <RoleCard />;
      case 'clue_round':
        return <ClueRound />;
      case 'voting':
        return <Voting />;
      case 'imposter_guess':
        return <ImposterGuess />;
      case 'results':
        return <Results />;
      default:
        return <Lobby />;
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Offline Alert Bar */}
      {!isConnected && (
        <div className="bg-amber-500/90 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Connecting to game server...</span>
        </div>
      )}

      {/* Main Game Phase View */}
      <main className="flex-1 w-full">{renderCurrentPhase()}</main>

      {/* Subtle Game Footer */}
      <footer className="py-3 text-center text-[11px] text-slate-600 border-t border-slate-900">
        The Imposter Game • Online Multi-Device Room
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <GameContainer />
    </SocketProvider>
  );
}
