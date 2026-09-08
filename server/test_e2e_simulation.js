const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { io: ClientIO } = require('socket.io-client');
const assert = require('assert');
const { registerSocketHandlers } = require('./socketHandlers');

async function runE2ESimulation() {
  console.log('🚀 Starting Full-Stack End-to-End Multi-Device Simulation...\n');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });

  await new Promise((resolve) => server.listen(3333, resolve));
  console.log('📡 Test server listening on port 3333');

  const SERVER_URL = 'http://localhost:3333';

  // Helper to create client
  const createClient = () => {
    return new Promise((resolve) => {
      const client = ClientIO(SERVER_URL, { transports: ['websocket'] });
      client.on('connect', () => resolve(client));
    });
  };

  const hostSocket = await createClient();
  const playerSockets = [
    await createClient(),
    await createClient(),
    await createClient(),
    await createClient(),
    await createClient()
  ];
  console.log('👥 6 client sockets connected (1 Host, 5 Mobile Players)');

  // 1. Host creates room
  const createRes = await new Promise((resolve) => {
    hostSocket.emit('create_room', { playerName: 'Host Alice', avatar: '👑' }, resolve);
  });
  assert.ok(createRes.success);
  const roomCode = createRes.roomCode;
  console.log(`✅ Host created room: ${roomCode}`);

  // Setup state tracking for all clients
  const clientStates = {};
  hostSocket.on('room_state', (s) => { clientStates['host'] = s; });
  playerSockets.forEach((s, idx) => {
    s.on('room_state', (state) => { clientStates[`player_${idx + 1}`] = state; });
  });

  // 2. 5 players join
  const names = ['Bob', 'Charlie', 'Dave', 'Eve', 'Frank'];
  for (let i = 0; i < playerSockets.length; i++) {
    const joinRes = await new Promise((resolve) => {
      playerSockets[i].emit('join_room', { roomCode, playerName: names[i], avatar: '🐱' }, resolve);
    });
    assert.ok(joinRes.success);
  }
  console.log('✅ All 5 players joined room');

  // Give brief tick for states to sync
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].players.length, 6);

  // 3. Host updates settings to 2 imposters
  await new Promise((resolve) => {
    hostSocket.emit('update_settings', { newSettings: { imposterCount: 2 } }, resolve);
  });
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].settings.imposterCount, 2);
  console.log('✅ Settings set to 2 Imposters');

  // 4. Host starts game
  await new Promise((resolve) => {
    hostSocket.emit('start_game', {}, resolve);
  });
  await new Promise((r) => setTimeout(r, 100));

  const allClients = [hostSocket, ...playerSockets];
  const allStates = Object.values(clientStates);

  assert.strictEqual(allStates[0].phase, 'role_reveal');

  // Count roles
  const imposterStates = allStates.filter((s) => s.roleInfo.role === 'imposter');
  const innocentStates = allStates.filter((s) => s.roleInfo.role === 'innocent');

  assert.strictEqual(imposterStates.length, 2, 'Must have exactly 2 imposters');
  assert.strictEqual(innocentStates.length, 4, 'Must have exactly 4 innocents');

  // Verify secret word security
  imposterStates.forEach((s) => {
    assert.strictEqual(s.roleInfo.word, null, 'Imposter must NOT receive secret word');
  });
  const secretWord = innocentStates[0].roleInfo.word;
  assert.ok(secretWord, 'Innocents have secret word');
  innocentStates.forEach((s) => {
    assert.strictEqual(s.roleInfo.word, secretWord, 'All innocents have same word');
  });
  console.log(`✅ Roles securely assigned! Word is "${secretWord}". Imposters: ${imposterStates.length}, Innocents: ${innocentStates.length}`);

  // 5. All players ready
  allClients.forEach((s) => s.emit('player_ready'));
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].phase, 'clue_round');
  console.log('✅ All players ready -> Clue round started');

  // 6. Start voting
  hostSocket.emit('start_voting');
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].phase, 'voting');
  console.log('✅ Voting phase started');

  // 7. Test voting validation: try 1 vote in 2-imposter mode
  const badVoteRes = await new Promise((resolve) => {
    playerSockets[0].emit('submit_vote', { targetIds: [allStates[0].players[1].id] }, resolve);
  });
  assert.ok(badVoteRes.error.includes('must vote for exactly 2'), 'Must reject 1-suspect vote in 2-imposter mode');
  console.log('✅ Rejected invalid 1-suspect vote in 2-imposter mode');

  // 8. Find imposter socket IDs and innocent socket IDs
  const imposterIds = allStates
    .filter((s) => s.roleInfo.role === 'imposter')
    .map((s) => s.myPlayerId);

  const innocentIds = allStates
    .filter((s) => s.roleInfo.role === 'innocent')
    .map((s) => s.myPlayerId);

  // Cast valid votes:
  // Innocents vote for both imposters!
  // Imposters vote for two innocents.
  for (const client of allClients) {
    const isImp = imposterIds.includes(client.id);
    const targets = isImp ? innocentIds.slice(0, 2) : imposterIds;
    await new Promise((resolve) => {
      client.emit('submit_vote', { targetIds: targets }, resolve);
    });
  }

  await new Promise((r) => setTimeout(r, 100));

  // Both imposters received 4 votes each (top 2), so both are caught!
  assert.strictEqual(clientStates['host'].phase, 'imposter_guess');
  console.log('✅ Top 2 vote recipients (both imposters) caught! Phase: imposter_guess');

  // 9. One caught imposter guesses the secret word correctly!
  const imposterClient = allClients.find((c) => imposterIds.includes(c.id));
  const guessRes = await new Promise((resolve) => {
    imposterClient.emit('submit_imposter_guess', { guessedWord: secretWord }, resolve);
  });
  assert.ok(guessRes.isCorrect);

  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].phase, 'results');
  assert.strictEqual(clientStates['host'].winner, 'imposters');
  console.log(`✅ Imposter guessed secret word correctly! Winner: ${clientStates['host'].winner}`);

  // 10. Play Again
  await new Promise((resolve) => {
    hostSocket.emit('play_again', {}, resolve);
  });
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(clientStates['host'].phase, 'lobby');
  assert.strictEqual(clientStates['host'].players.length, 6);
  console.log('✅ Play Again reset to lobby with 6 players intact');

  // Clean up
  allClients.forEach((c) => c.disconnect());
  await new Promise((resolve) => server.close(resolve));
  console.log('\n🎉 FULL-STACK END-TO-END SIMULATION PASSED COMPLETELY!\n');
}

runE2ESimulation().catch((err) => {
  console.error('❌ E2E Simulation Failed:', err);
  process.exit(1);
});
