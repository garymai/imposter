const roomManager = require('./roomManager');

function broadcastRoomState(io, room) {
  if (!room) return;
  room.players.forEach(player => {
    const clientState = roomManager.getClientState(room, player.id);
    io.to(player.id).emit('room_state', clientState);
  });
}

function registerSocketHandlers(io, socket) {
  // 1. Create Room
  socket.on('create_room', ({ playerName, avatar }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, playerName, avatar);
      socket.join(`room_${room.code}`);
      const clientState = roomManager.getClientState(room, socket.id);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: room.code, state: clientState });
      }
      broadcastRoomState(io, room);
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  // 2. Join Room
  socket.on('join_room', ({ roomCode, playerName, avatar }, callback) => {
    try {
      const res = roomManager.joinRoom(roomCode, socket.id, playerName, avatar);
      if (res.error) {
        if (typeof callback === 'function') callback({ error: res.error });
        return;
      }

      socket.join(`room_${res.room.code}`);
      const clientState = roomManager.getClientState(res.room, socket.id);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode: res.room.code, state: clientState, reconnected: res.reconnected });
      }
      broadcastRoomState(io, res.room);
    } catch (err) {
      if (typeof callback === 'function') callback({ error: err.message });
    }
  });

  // 3. Update Settings (Host only)
  socket.on('update_settings', ({ newSettings }, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const res = roomManager.updateSettings(roomCode, socket.id, newSettings);
    if (res.error) {
      if (typeof callback === 'function') callback({ error: res.error });
      return;
    }
    broadcastRoomState(io, res.room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 4. Start Game (Host only)
  socket.on('start_game', (_, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const res = roomManager.startGame(roomCode, socket.id);
    if (res.error) {
      if (typeof callback === 'function') callback({ error: res.error });
      return;
    }
    broadcastRoomState(io, res.room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 5. Player Ready (viewed role)
  socket.on('player_ready', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomManager.playerReady(roomCode, socket.id);
    if (room) {
      broadcastRoomState(io, room);
    }
  });

  // 6. Next Clue / Clues Done
  socket.on('next_clue', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomManager.nextClue(roomCode, socket.id);
    if (room) {
      broadcastRoomState(io, room);
    }
  });

  // 7. Start Voting
  socket.on('start_voting', () => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = roomManager.startVoting(roomCode, socket.id);
    if (room) {
      broadcastRoomState(io, room);
    }
  });

  // 8. Submit Vote (Supports 1 or 2 suspect IDs)
  socket.on('submit_vote', ({ targetIds }, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const res = roomManager.submitVote(roomCode, socket.id, targetIds);
    if (res.error) {
      if (typeof callback === 'function') callback({ error: res.error });
      return;
    }

    broadcastRoomState(io, res.room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 9. Imposter Word Guess
  socket.on('submit_imposter_guess', ({ guessedWord }, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const res = roomManager.submitImposterGuess(roomCode, socket.id, guessedWord);
    if (res.error) {
      if (typeof callback === 'function') callback({ error: res.error });
      return;
    }

    broadcastRoomState(io, res.room);
    if (typeof callback === 'function') callback({ success: true, isCorrect: res.isCorrect });
  });

  // 10. Play Again (Host only)
  socket.on('play_again', (_, callback) => {
    const roomCode = roomManager.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const res = roomManager.playAgain(roomCode, socket.id);
    if (res.error) {
      if (typeof callback === 'function') callback({ error: res.error });
      return;
    }

    broadcastRoomState(io, res.room);
    if (typeof callback === 'function') callback({ success: true });
  });

  // 11. Disconnect
  socket.on('disconnect', () => {
    const res = roomManager.leaveRoom(socket.id);
    if (res && res.room && !res.deleted) {
      broadcastRoomState(io, res.room);
    }
  });
}

module.exports = { registerSocketHandlers, broadcastRoomState };
