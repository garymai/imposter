const assert = require('assert');
const roomManager = require('./roomManager');

console.log('🧪 Starting Imposter Game RoomManager tests...\n');

// 1. Create room
const host = roomManager.createRoom('socket_host', 'Host Alice', '👑');
assert.strictEqual(host.players.length, 1);
assert.strictEqual(host.hostId, 'socket_host');
assert.strictEqual(host.code.length, 4);
const code = host.code;
console.log(`✅ Room created with code: ${code}`);

// 2. Join players (total 6 players: Alice, Bob, Charlie, Dave, Eve, Frank)
const p2 = roomManager.joinRoom(code, 'socket_bob', 'Bob', '🐶');
const p3 = roomManager.joinRoom(code, 'socket_charlie', 'Charlie', '🐱');
const p4 = roomManager.joinRoom(code, 'socket_dave', 'Dave', '🦁');
const p5 = roomManager.joinRoom(code, 'socket_eve', 'Eve', '🐼');
const p6 = roomManager.joinRoom(code, 'socket_frank', 'Frank', '🦊');
assert.strictEqual(host.players.length, 6);
console.log('✅ 5 additional players joined (total 6)');

// 3. Update settings for 2 imposters
const updateRes = roomManager.updateSettings(code, 'socket_host', { imposterCount: 2 });
assert.strictEqual(updateRes.room.settings.imposterCount, 2);
console.log('✅ Settings updated to 2 imposters');

// 4. Start game
const startRes = roomManager.startGame(code, 'socket_host');
assert.ifError(startRes.error);
assert.strictEqual(startRes.room.phase, 'role_reveal');
assert.strictEqual(startRes.room.imposterIds.length, 2);
assert.ok(startRes.room.currentWord, 'Secret word is set');
console.log(`✅ Game started. Word: "${startRes.room.currentWord}". Imposters: ${startRes.room.imposterIds.join(', ')}`);

// 5. Verify security / sanitized client state
const imposterSocketId = startRes.room.imposterIds[0];
const innocentPlayer = startRes.room.players.find(p => !startRes.room.imposterIds.includes(p.id));

const imposterState = roomManager.getClientState(startRes.room, imposterSocketId);
assert.strictEqual(imposterState.roleInfo.role, 'imposter');
assert.strictEqual(imposterState.roleInfo.word, null, 'Imposter MUST NOT see secret word');
assert.ok(imposterState.roleInfo.category, 'Imposter sees category');
assert.strictEqual(imposterState.secretWord, null, 'Public secret word is hidden');

const innocentState = roomManager.getClientState(startRes.room, innocentPlayer.id);
assert.strictEqual(innocentState.roleInfo.role, 'innocent');
assert.strictEqual(innocentState.roleInfo.word, startRes.room.currentWord, 'Innocent sees secret word');
console.log('✅ Security verified: Imposters do not receive secret word, innocents receive secret word');

// 6. Players view role & ready up
startRes.room.players.forEach(p => {
  roomManager.playerReady(code, p.id);
});
assert.strictEqual(startRes.room.phase, 'clue_round');
console.log('✅ All players ready -> transitioned to clue_round');

// 7. Advance clues or host starts voting
roomManager.startVoting(code, 'socket_host');
assert.strictEqual(startRes.room.phase, 'voting');
console.log('✅ Transitioned to voting phase');

// 8. Test vote validation (must vote for exactly 2 suspects in 2-imposter mode)
const invalidVote1 = roomManager.submitVote(code, 'socket_bob', ['socket_charlie']);
assert.ok(invalidVote1.error, 'Should reject 1 vote when 2 are required');

const invalidVote2 = roomManager.submitVote(code, 'socket_bob', ['socket_charlie', 'socket_charlie']);
assert.ok(invalidVote2.error, 'Should reject duplicate suspect in same ballot');

const invalidVoteSelf = roomManager.submitVote(code, 'socket_bob', ['socket_bob', 'socket_charlie']);
assert.ok(invalidVoteSelf.error, 'Should reject self-voting');
console.log('✅ Voting validation passed: requires 2 distinct non-self suspects');

// 9. All 6 players cast valid 2-suspect votes targeting the two actual imposters!
const [imp1, imp2] = startRes.room.imposterIds;
const voters = startRes.room.players;

// Let voters vote for [imp1, imp2] (except imposters who vote for someone else)
voters.forEach(v => {
  if (v.id === imp1) {
    const targets = voters.filter(p => p.id !== imp1 && p.id !== imp2).slice(0, 2).map(p => p.id);
    roomManager.submitVote(code, v.id, targets);
  } else if (v.id === imp2) {
    const targets = voters.filter(p => p.id !== imp1 && p.id !== imp2).slice(0, 2).map(p => p.id);
    roomManager.submitVote(code, v.id, targets);
  } else {
    // Innocents vote for the two imposters!
    roomManager.submitVote(code, v.id, [imp1, imp2]);
  }
});

// 10. Verify tally: both imposters received the most votes (4 votes each)
assert.strictEqual(startRes.room.phase, 'imposter_guess');
assert.ok(startRes.room.voteResults.allImpostersCaught);
console.log('✅ 2-Imposter vote tally passed: top 2 vote getters caught, transitioned to imposter_guess');

// 11. Test Imposter Word Guess
// Test wrong guess
const wrongGuess = roomManager.submitImposterGuess(code, imp1, 'TotallyWrongWordXYZ');
assert.strictEqual(wrongGuess.room.winner, 'innocents');
assert.strictEqual(wrongGuess.room.phase, 'results');
console.log('✅ Wrong guess test: Innocents win');

// 12. Test Play Again
const resetRes = roomManager.playAgain(code, 'socket_host');
assert.strictEqual(resetRes.room.phase, 'lobby');
assert.strictEqual(resetRes.room.players.length, 6);
console.log('✅ Play Again reset to lobby successfully with all 6 players preserved');

console.log('\n🎉 ALL ROOM MANAGER & MULTI-IMPOSTER TESTS PASSED!\n');
