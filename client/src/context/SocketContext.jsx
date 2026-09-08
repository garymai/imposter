import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In dev with Vite proxy, connecting to origin connects through proxy to backend
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('🔌 Connected to game server:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Disconnected from game server');
      setIsConnected(false);
    });

    s.on('room_state', (state) => {
      console.log('🔄 Room state updated:', state);
      setGameState(state);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Clear error after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const createRoom = useCallback((playerName, avatar) => {
    if (!socket) return;
    setError(null);
    socket.emit('create_room', { playerName, avatar }, (res) => {
      if (res?.error) {
        setError(res.error);
      } else if (res?.state) {
        setGameState(res.state);
      }
    });
  }, [socket]);

  const joinRoom = useCallback((roomCode, playerName, avatar) => {
    if (!socket) return;
    setError(null);
    socket.emit('join_room', { roomCode, playerName, avatar }, (res) => {
      if (res?.error) {
        setError(res.error);
      } else if (res?.state) {
        setGameState(res.state);
      }
    });
  }, [socket]);

  const updateSettings = useCallback((newSettings) => {
    if (!socket) return;
    socket.emit('update_settings', { newSettings }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket) return;
    socket.emit('start_game', {}, (res) => {
      if (res?.error) setError(res.error);
    });
  }, [socket]);

  const playerReady = useCallback(() => {
    if (!socket) return;
    socket.emit('player_ready');
  }, [socket]);

  const nextClue = useCallback(() => {
    if (!socket) return;
    socket.emit('next_clue');
  }, [socket]);

  const startVoting = useCallback(() => {
    if (!socket) return;
    socket.emit('start_voting');
  }, [socket]);

  const submitVote = useCallback((targetIds) => {
    if (!socket) return;
    socket.emit('submit_vote', { targetIds }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, [socket]);

  const submitImposterGuess = useCallback((guessedWord) => {
    if (!socket) return;
    socket.emit('submit_imposter_guess', { guessedWord }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, [socket]);

  const playAgain = useCallback(() => {
    if (!socket) return;
    socket.emit('play_again', {}, (res) => {
      if (res?.error) setError(res.error);
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    setGameState(null);
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        isConnected,
        error,
        setError,
        createRoom,
        joinRoom,
        updateSettings,
        startGame,
        playerReady,
        nextClue,
        startVoting,
        submitVote,
        submitImposterGuess,
        playAgain,
        leaveRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
