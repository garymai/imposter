const fs = require('fs');
const path = require('path');
const { getLocalIpAddress } = require('./networkUtils');

// Load curated words
const categoriesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'words.json'), 'utf-8')
);

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> roomData
    this.socketToRoom = new Map(); // socketId -> roomCode
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded I, O to avoid confusion
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostSocketId, playerName, avatar = '🦊') {
    const roomCode = this.generateRoomCode();
    const hostPlayer = {
      id: hostSocketId,
      name: playerName.trim() || 'Host',
      avatar,
      isHost: true,
      isConnected: true,
      ready: false
    };

    const room = {
      code: roomCode,
      hostId: hostSocketId,
      players: [hostPlayer],
      settings: {
        imposterCount: 1, // 1 or 2
        categoryId: 'all', // 'all' or category id
        discussionTime: 90, // seconds
        allowImposterTeammateReveal: true // whether 2 imposters know each other
      },
      phase: 'lobby', // 'lobby' | 'role_reveal' | 'clue_round' | 'voting' | 'imposter_guess' | 'results'
      currentCategory: null,
      currentWord: null,
      imposterIds: [],
      clueOrder: [],
      currentClueIndex: 0,
      readyPlayers: new Set(),
      votes: {}, // voterId -> [targetId1, ...]
      voteResults: null, // { accusedIds, voteCounts, tied }
      guessOptions: [],
      winner: null,
      winReason: null
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(hostSocketId, roomCode);
    return room;
  }

  joinRoom(roomCode, socketId, playerName, avatar = '🐱') {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      return { error: 'Room not found. Check the 4-letter code!' };
    }

    // Check if re-joining by name
    const existingPlayer = room.players.find(
      p => p.name.toLowerCase() === playerName.trim().toLowerCase()
    );

    if (existingPlayer) {
      // Reconnect existing player
      this.socketToRoom.delete(existingPlayer.id);
      existingPlayer.id = socketId;
      existingPlayer.isConnected = true;
      if (existingPlayer.isHost) {
        room.hostId = socketId;
      }
      this.socketToRoom.set(socketId, code);
      return { room, reconnected: true };
    }

    if (room.phase !== 'lobby') {
      return { error: 'Game is already in progress in this room!' };
    }

    if (room.players.length >= 16) {
      return { error: 'Room is full (maximum 16 players)!' };
    }

    const newPlayer = {
      id: socketId,
      name: playerName.trim() || `Player ${room.players.length + 1}`,
      avatar,
      isHost: false,
      isConnected: true,
      ready: false
    };

    room.players.push(newPlayer);
    this.socketToRoom.set(socketId, code);
    return { room, reconnected: false };
  }

  leaveRoom(socketId) {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const playerIndex = room.players.findIndex(p => p.id === socketId);
    if (playerIndex === -1) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const player = room.players[playerIndex];

    if (room.phase === 'lobby') {
      // Remove completely if in lobby
      room.players.splice(playerIndex, 1);
      this.socketToRoom.delete(socketId);

      if (room.players.length === 0) {
        this.rooms.delete(code);
        return { roomCode: code, deleted: true };
      }

      // Reassign host if host left
      if (player.isHost) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
    } else {
      // In-game: mark as disconnected so they can reconnect if page refreshed
      player.isConnected = false;
      this.socketToRoom.delete(socketId);

      // Check if all connected players have voted during voting phase
      if (room.phase === 'voting') {
        const connectedPlayers = room.players.filter(p => p.isConnected);
        const allVoted = connectedPlayers.every(p => room.votes[p.id]);
        if (allVoted && connectedPlayers.length > 0) {
          this.tallyVotes(code);
        }
      }
    }

    return { roomCode: code, room, deleted: false };
  }

  updateSettings(roomCode, requesterId, newSettings) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can modify settings' };
    if (room.phase !== 'lobby') return { error: 'Settings can only be changed in the lobby' };

    if (typeof newSettings.imposterCount === 'number') {
      room.settings.imposterCount = Math.max(1, Math.min(2, newSettings.imposterCount));
    }
    if (newSettings.categoryId) {
      room.settings.categoryId = newSettings.categoryId;
    }
    if (typeof newSettings.discussionTime === 'number') {
      room.settings.discussionTime = Math.max(30, Math.min(300, newSettings.discussionTime));
    }
    if (typeof newSettings.allowImposterTeammateReveal === 'boolean') {
      room.settings.allowImposterTeammateReveal = newSettings.allowImposterTeammateReveal;
    }

    return { room };
  }

  startGame(roomCode, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can start the game' };

    const minPlayers = room.settings.imposterCount === 2 ? 5 : 3;
    const connectedPlayers = room.players.filter(p => p.isConnected);

    if (connectedPlayers.length < minPlayers) {
      return {
        error: `Need at least ${minPlayers} players to start with ${room.settings.imposterCount} imposter(s)!`
      };
    }

    // Select category & word
    let categoryPool = categoriesData;
    if (room.settings.categoryId && room.settings.categoryId !== 'all') {
      const selected = categoriesData.find(c => c.id === room.settings.categoryId);
      if (selected) categoryPool = [selected];
    }

    const chosenCat = categoryPool[Math.floor(Math.random() * categoryPool.length)];
    const chosenWord = chosenCat.words[Math.floor(Math.random() * chosenCat.words.length)];

    // Select Imposters
    const playerIds = connectedPlayers.map(p => p.id);
    const shuffledIds = [...playerIds].sort(() => 0.5 - Math.random());
    const imposterIds = shuffledIds.slice(0, room.settings.imposterCount);

    // Randomize Clue Turn Order
    const clueOrder = [...playerIds].sort(() => 0.5 - Math.random());

    // Generate Multiple Choice Guess Options for Imposters (Real word + 4 distractors from same category)
    const otherWords = chosenCat.words.filter(w => w !== chosenWord);
    const distractors = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 4);
    const guessOptions = [chosenWord, ...distractors].sort(() => 0.5 - Math.random());

    room.phase = 'role_reveal';
    room.currentCategory = { id: chosenCat.id, name: chosenCat.name, icon: chosenCat.icon };
    room.currentWord = chosenWord;
    room.imposterIds = imposterIds;
    room.clueOrder = clueOrder;
    room.currentClueIndex = 0;
    room.readyPlayers = new Set();
    room.votes = {};
    room.voteResults = null;
    room.guessOptions = guessOptions;
    room.winner = null;
    room.winReason = null;

    return { room };
  }

  playerReady(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'role_reveal') return null;

    room.readyPlayers.add(socketId);
    const connectedCount = room.players.filter(p => p.isConnected).length;

    // Advance to clue round if everyone is ready
    if (room.readyPlayers.size >= connectedCount) {
      room.phase = 'clue_round';
      room.currentClueIndex = 0;
    }

    return room;
  }

  nextClue(roomCode, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'clue_round') return null;

    room.currentClueIndex += 1;
    if (room.currentClueIndex >= room.clueOrder.length) {
      room.phase = 'voting';
      room.votes = {};
    }
    return room;
  }

  startVoting(roomCode, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.hostId !== requesterId && room.phase !== 'clue_round') return null;

    room.phase = 'voting';
    room.votes = {};
    return room;
  }

  submitVote(roomCode, voterId, targetIds) {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'voting') {
      return { error: 'Voting is not active' };
    }

    if (!Array.isArray(targetIds)) {
      return { error: 'Invalid vote format' };
    }

    const requiredVotes = room.settings.imposterCount;
    if (targetIds.length !== requiredVotes) {
      return { error: `You must vote for exactly ${requiredVotes} suspect(s)!` };
    }

    // Disallow duplicates in the same ballot
    const uniqueTargets = new Set(targetIds);
    if (uniqueTargets.size !== requiredVotes) {
      return { error: 'You cannot vote for the same suspect twice!' };
    }

    // Verify all targets are valid connected players and not the voter
    const validPlayerIds = new Set(room.players.map(p => p.id));
    for (const tid of targetIds) {
      if (!validPlayerIds.has(tid)) {
        return { error: 'Voted for an invalid player!' };
      }
      if (tid === voterId) {
        return { error: 'You cannot vote for yourself!' };
      }
    }

    room.votes[voterId] = targetIds;

    // Check if all connected players have voted
    const connectedPlayers = room.players.filter(p => p.isConnected);
    const allVoted = connectedPlayers.every(p => room.votes[p.id]);

    if (allVoted) {
      this.tallyVotes(roomCode);
    }

    return { room, allVoted };
  }

  tallyVotes(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const voteCounts = {};
    // Initialize count for all players
    room.players.forEach(p => {
      voteCounts[p.id] = 0;
    });

    // Count all votes
    Object.values(room.votes).forEach(targets => {
      targets.forEach(tid => {
        if (voteCounts[tid] !== undefined) {
          voteCounts[tid] += 1;
        }
      });
    });

    // Sort players descending by votes
    const sorted = Object.entries(voteCounts)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);

    const requiredAccusedCount = room.settings.imposterCount;
    let accusedIds = [];

    if (sorted.length > 0) {
      if (requiredAccusedCount === 1) {
        const topCount = sorted[0].count;
        // Include all players who tied for 1st place
        accusedIds = sorted.filter(p => p.count === topCount && p.count > 0).map(p => p.id);
      } else {
        // 2 Imposters mode
        if (sorted.length >= 2) {
          const secondCount = sorted[1].count;
          // Take all who have >= secondCount votes (as long as > 0)
          accusedIds = sorted.filter(p => p.count >= secondCount && p.count > 0).map(p => p.id);
          // If less than 2 had votes, fallback to top 2
          if (accusedIds.length < 2) {
            accusedIds = sorted.slice(0, 2).map(p => p.id);
          }
        } else {
          accusedIds = sorted.map(p => p.id);
        }
      }
    }

    // Check if all imposters are in accusedIds
    const allImpostersCaught =
      room.imposterIds.length > 0 &&
      room.imposterIds.every(impId => accusedIds.includes(impId));

    room.voteResults = {
      accusedIds,
      voteCounts,
      allImpostersCaught
    };

    if (allImpostersCaught) {
      // Imposters are caught! They get one final chance to guess the secret word
      room.phase = 'imposter_guess';
    } else {
      // Imposters win because at least one evaded accusation
      room.phase = 'results';
      room.winner = 'imposters';
      room.winReason =
        room.settings.imposterCount === 2
          ? 'The Imposters escaped detection! Not all imposters were voted out.'
          : 'The Imposter escaped detection! The innocents voted out an innocent!';
    }

    return room;
  }

  submitImposterGuess(roomCode, guesserId, guessedWord) {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'imposter_guess') {
      return { error: 'Not in imposter guess phase' };
    }

    if (!room.imposterIds.includes(guesserId)) {
      return { error: 'Only a caught imposter can submit the guess' };
    }

    const cleanGuess = (guessedWord || '').trim().toLowerCase();
    const cleanActual = room.currentWord.trim().toLowerCase();
    const isCorrect = cleanGuess === cleanActual;

    room.phase = 'results';

    if (isCorrect) {
      room.winner = 'imposters';
      room.winReason = `The Imposter guessed the secret word ("${room.currentWord}") correctly and stole the victory!`;
    } else {
      room.winner = 'innocents';
      room.winReason = `The Imposters were caught and failed their secret word guess! (Guessed: "${guessedWord}", Actual: "${room.currentWord}").`;
    }

    return { room, isCorrect };
  }

  playAgain(roomCode, requesterId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.hostId !== requesterId) return { error: 'Only the host can reset the game' };

    room.phase = 'lobby';
    room.currentCategory = null;
    room.currentWord = null;
    room.imposterIds = [];
    room.clueOrder = [];
    room.currentClueIndex = 0;
    room.readyPlayers.clear();
    room.votes = {};
    room.voteResults = null;
    room.guessOptions = [];
    room.winner = null;
    room.winReason = null;

    room.players.forEach(p => {
      p.ready = false;
    });

    return { room };
  }

  // Security: Sanitize room state so players only see what their role allows
  getClientState(room, socketId) {
    if (!room) return null;

    const player = room.players.find(p => p.id === socketId);
    const isImposter = room.imposterIds.includes(socketId);
    const isHost = room.hostId === socketId;

    // In lobby or after game ends (results), full transparency is allowed
    const showAllSecrets = room.phase === 'results';

    let roleInfo = null;
    if (room.phase !== 'lobby') {
      if (isImposter) {
        const fellowImposters =
          room.settings.imposterCount === 2 && room.settings.allowImposterTeammateReveal
            ? room.players
                .filter(p => room.imposterIds.includes(p.id) && p.id !== socketId)
                .map(p => p.name)
            : [];

        roleInfo = {
          role: 'imposter',
          word: showAllSecrets ? room.currentWord : null,
          category: room.currentCategory,
          fellowImposters
        };
      } else {
        roleInfo = {
          role: 'innocent',
          word: room.currentWord,
          category: room.currentCategory
        };
      }
    }

    // Map who has voted without leaking target votes
    const votedPlayerIds = Object.keys(room.votes);

    return {
      code: room.code,
      phase: room.phase,
      isHost,
      myPlayerId: socketId,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHost: p.isHost,
        isConnected: p.isConnected,
        ready: room.readyPlayers ? room.readyPlayers.has(p.id) : false,
        hasVoted: votedPlayerIds.includes(p.id),
        // Reveal imposter role only during results phase
        role: showAllSecrets
          ? room.imposterIds.includes(p.id)
            ? 'imposter'
            : 'innocent'
          : undefined
      })),
      settings: room.settings,
      roleInfo,
      clueOrder: room.clueOrder,
      currentClueIndex: room.currentClueIndex,
      currentCluePlayerId: room.clueOrder[room.currentClueIndex] || null,
      guessOptions: isImposter || showAllSecrets ? room.guessOptions : [],
      voteResults: room.voteResults,
      secretWord: showAllSecrets ? room.currentWord : null,
      winner: room.winner,
      winReason: room.winReason,
      serverIp: getLocalIpAddress(),
      categories: categoriesData.map(c => ({ id: c.id, name: c.name, icon: c.icon }))
    };
  }
}

module.exports = new RoomManager();
