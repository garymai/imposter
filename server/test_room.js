const assert = require('assert');
const fs = require('fs');
const path = require('path');

const customQuestionsTestFile = path.join(__dirname, 'custom_questions.json');
const originalCustomFileContent = fs.existsSync(customQuestionsTestFile)
  ? fs.readFileSync(customQuestionsTestFile, 'utf-8')
  : '[]';
fs.writeFileSync(customQuestionsTestFile, '[]', 'utf-8');

const roomManager = require('./roomManager');
roomManager.persistentCustomQuestions = [];

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

console.log('\n--- Starting Question Imposter Mode Tests ---');

// 13. Update settings to Question Mode
const qSettingsRes = roomManager.updateSettings(code, 'socket_host', {
  gameMode: 'questions',
  imposterCount: 1
});
assert.strictEqual(qSettingsRes.room.settings.gameMode, 'questions');
assert.strictEqual(qSettingsRes.room.settings.imposterCount, 1);
console.log('✅ Updated settings to Question Mode (1 imposter)');

// 14. Start Question Mode Game
const qStartRes = roomManager.startGame(code, 'socket_host');
assert.ifError(qStartRes.error);
assert.strictEqual(qStartRes.room.phase, 'question_answering');
assert.strictEqual(qStartRes.room.imposterIds.length, 1);
assert.ok(qStartRes.room.currentQuestionPair.normalQuestion);
assert.ok(qStartRes.room.currentQuestionPair.imposterQuestion);
const qImposterId = qStartRes.room.imposterIds[0];
const qInnocentId = qStartRes.room.players.find(p => p.id !== qImposterId).id;

// 15. Verify Blind Imposter security in question_answering
const qImpClientState = roomManager.getClientState(qStartRes.room, qImposterId);
const qInnClientState = roomManager.getClientState(qStartRes.room, qInnocentId);

assert.strictEqual(qImpClientState.roleInfo.role, 'player', 'Blind imposter: role is player');
assert.strictEqual(qInnClientState.roleInfo.role, 'player', 'Blind innocent: role is player');
assert.strictEqual(qImpClientState.roleInfo.question, qStartRes.room.currentQuestionPair.imposterQuestion);
assert.strictEqual(qInnClientState.roleInfo.question, qStartRes.room.currentQuestionPair.normalQuestion);
assert.strictEqual(qImpClientState.revealedQuestion, null, 'Normal question is hidden during answering');
assert.strictEqual(qImpClientState.imposterQuestion, null, 'Imposter question is hidden from public');
assert.strictEqual(qImpClientState.answers.length, 0, 'Answers are hidden during answering');
console.log('✅ Security verified: Blind imposter receives imposterQuestion, innocents receive normalQuestion');

// 16. Answer submissions
const emptyAnsRes = roomManager.submitAnswer(code, qImposterId, '   ');
assert.ok(emptyAnsRes.error, 'Empty answer must be rejected');

const sampleAnswers = {
  socket_host: 'Coffee maker',
  socket_bob: 'Toothbrush',
  socket_charlie: 'My smartphone',
  socket_dave: 'Glass of water',
  socket_eve: 'Alarm clock',
  socket_frank: 'Cozy blanket'
};

// 5 players submit answers
const playerIds = qStartRes.room.players.map(p => p.id);
for (let i = 0; i < playerIds.length - 1; i++) {
  const pid = playerIds[i];
  const ansRes = roomManager.submitAnswer(code, pid, sampleAnswers[pid] || 'My answer');
  assert.strictEqual(ansRes.allAnswered, false);
  assert.strictEqual(ansRes.room.phase, 'question_answering');
}
console.log('✅ 5 players submitted answers, still in question_answering');

// 6th player submits answer -> automatic advance to question_reveal!
const lastPid = playerIds[playerIds.length - 1];
const lastAnsRes = roomManager.submitAnswer(code, lastPid, sampleAnswers[lastPid] || 'Final answer');
assert.strictEqual(lastAnsRes.allAnswered, true);
assert.strictEqual(lastAnsRes.room.phase, 'question_reveal');
console.log('✅ All answers submitted -> auto-transitioned to question_reveal (discussion phase)');

// 17. Verify Discussion (question_reveal) State
const revealState = roomManager.getClientState(lastAnsRes.room, qInnocentId);
assert.strictEqual(revealState.revealedQuestion, lastAnsRes.room.currentQuestionPair.normalQuestion);
assert.strictEqual(revealState.answers.length, 6);
assert.strictEqual(revealState.imposterQuestion, null, 'Imposter question still hidden from innocents');
assert.strictEqual(revealState.players[0].answer, sampleAnswers[revealState.players[0].id]);
console.log('✅ Discussion state verified: normalQuestion revealed and all 6 player answers shown');

// 18. Transition from question_reveal to voting
const voteTransitionRes = roomManager.startVoting(code, 'socket_host');
assert.strictEqual(voteTransitionRes.phase, 'voting');
console.log('✅ Transitioned from discussion to voting');

// 19. All players vote (Innocents vote for imposter, imposter votes for someone else)
qStartRes.room.players.forEach(p => {
  if (p.id === qImposterId) {
    const target = qStartRes.room.players.find(x => x.id !== qImposterId).id;
    roomManager.submitVote(code, p.id, [target]);
  } else {
    roomManager.submitVote(code, p.id, [qImposterId]);
  }
});

// 20. Verify results in Question Mode: directly transitions to results, NO imposter_guess phase!
assert.strictEqual(qStartRes.room.phase, 'results');
assert.strictEqual(qStartRes.room.winner, 'innocents');
assert.strictEqual(qStartRes.room.voteResults.allImpostersCaught, true);

const finalResultsState = roomManager.getClientState(qStartRes.room, qInnocentId);
assert.strictEqual(finalResultsState.winner, 'innocents');
assert.strictEqual(finalResultsState.revealedQuestion, qStartRes.room.currentQuestionPair.normalQuestion);
assert.strictEqual(finalResultsState.imposterQuestion, qStartRes.room.currentQuestionPair.imposterQuestion);
const impAnswerEntry = finalResultsState.answers.find(a => a.playerId === qImposterId);
assert.strictEqual(impAnswerEntry.isImposter, true);
console.log(`✅ Results verified: Innocents won, imposter was caught, both normal and imposter questions revealed!`);

// 21. Test Play Again in Question Mode
const finalReset = roomManager.playAgain(code, 'socket_host');
assert.strictEqual(finalReset.room.phase, 'lobby');
assert.strictEqual(finalReset.room.answers && Object.keys(finalReset.room.answers).length, 0);
assert.strictEqual(finalReset.room.currentQuestionPair, null);
console.log('✅ Play Again reset cleanly after Question Mode');

console.log('\n--- Starting Custom Question Submission Tests ---');

// 22. Player Bob submits a custom question pair
const customRes = roomManager.addCustomQuestion(code, 'socket_bob', {
  normalQuestion: "What is Gary's most iconic catchphrase?",
  imposterQuestion: "What is a famous movie quote from a supervillain?"
});
assert.ifError(customRes.error);
assert.ok(customRes.customPair.id);
assert.strictEqual(customRes.customPair.authorName, 'Bob');
assert.strictEqual(customRes.room.customQuestions.length, 1);
console.log('✅ Player Bob successfully submitted a custom question pair');

// 23. Verify client state: Bob sees his question, Alice only sees count
const bobClientState = roomManager.getClientState(customRes.room, 'socket_bob');
const hostClientState = roomManager.getClientState(customRes.room, 'socket_host');

assert.strictEqual(bobClientState.customQuestionsCount, 1);
assert.strictEqual(bobClientState.myCustomQuestions.length, 1);
assert.strictEqual(bobClientState.myCustomQuestions[0].normalQuestion, "What is Gary's most iconic catchphrase?");

assert.strictEqual(hostClientState.customQuestionsCount, 1);
assert.strictEqual(hostClientState.myCustomQuestions.length, 0, "Other players must not see Bob's questions in lobby (spoiler prevention)");
assert.ok(hostClientState.questionCategories.includes('Custom Questions'), "Dynamic category 'Custom Questions' appears when custom questions exist");
console.log('✅ Custom questions privacy verified: Bob sees his submitted question, other players only see count');

// 24. Start game with Custom Questions category
roomManager.updateSettings(code, 'socket_host', { questionCategoryId: 'Custom Questions' });
const customGameRes = roomManager.startGame(code, 'socket_host');
assert.ifError(customGameRes.error);
assert.strictEqual(customGameRes.room.currentQuestionPair.id, customRes.customPair.id);

// 25. VERIFY AUTHOR CANNOT BE IMPOSTER RULE!
// Run 20 iterations of imposter selection to mathematically prove Bob is NEVER the imposter
for (let trial = 0; trial < 20; trial++) {
  const trialRoom = roomManager.createRoom(`trial_host_${trial}`, 'Host', '👑');
  const tCode = trialRoom.code;
  roomManager.joinRoom(tCode, `bob_${trial}`, 'Bob', '🐶');
  roomManager.joinRoom(tCode, `charlie_${trial}`, 'Charlie', '🐱');
  roomManager.joinRoom(tCode, `dave_${trial}`, 'Dave', '🦁');
  roomManager.updateSettings(tCode, `trial_host_${trial}`, { gameMode: 'questions', questionCategoryId: 'Custom Questions' });
  roomManager.addCustomQuestion(tCode, `bob_${trial}`, {
    normalQuestion: 'Question A',
    imposterQuestion: 'Question B'
  });
  const tStart = roomManager.startGame(tCode, `trial_host_${trial}`);
  assert.ifError(tStart.error);
  assert.strictEqual(tStart.room.imposterIds.includes(`bob_${trial}`), false, `Trial ${trial}: Bob was author and MUST NOT be imposter`);
}
console.log('✅ Author Cannot Be Imposter Rule verified: Bob (the author) was excluded from imposter selection across 20 trials');

// 26. Submit answers and check questionAuthor attribution is hidden in discussion and revealed at results
qStartRes.room.players.forEach(p => {
  roomManager.submitAnswer(code, p.id, 'I am inevitable!');
});
const customRevealState = roomManager.getClientState(customGameRes.room, 'socket_host');
assert.strictEqual(customRevealState.questionAuthor, null, 'Author must remain hidden during discussion to preserve deduction fairness');

// Transition to voting and results
roomManager.startVoting(code, 'socket_host');
customGameRes.room.players.forEach(p => {
  const other = customGameRes.room.players.find(x => x.id !== p.id).id;
  roomManager.submitVote(code, p.id, [other]);
});
const customResultsState = roomManager.getClientState(customGameRes.room, 'socket_host');
assert.strictEqual(customResultsState.questionAuthor, 'Bob', 'Author is revealed on the results screen');
console.log('✅ Custom prompt author privacy verified: hidden during discussion, revealed at results ("Bob")');

// 27. Test deleting custom question
roomManager.playAgain(code, 'socket_host');
const deleteRes = roomManager.removeCustomQuestion(code, 'socket_bob', customRes.customPair.id);
assert.ifError(deleteRes.error);
assert.strictEqual(deleteRes.room.customQuestions.length, 0);
console.log('✅ Custom question successfully removed by its author');

console.log('\n--- Starting Custom Questions File Persistence Tests ---');

// 28. Add a custom question and verify it is written to custom_questions.json
const persistentQuestion = roomManager.addCustomQuestion(code, 'socket_bob', {
  normalQuestion: "What is Gary's favorite drink?",
  imposterQuestion: "What beverage would you order at a tropical resort?"
});
assert.ifError(persistentQuestion.error);

const fileContents = JSON.parse(fs.readFileSync(customQuestionsTestFile, 'utf-8'));
assert.ok(Array.isArray(fileContents), 'custom_questions.json must contain an array');
const savedItem = fileContents.find(q => q.id === persistentQuestion.customPair.id);
assert.ok(savedItem, 'Submitted question must be present in custom_questions.json');
assert.strictEqual(savedItem.normalQuestion, "What is Gary's favorite drink?");
assert.strictEqual(savedItem.authorName, 'Bob');
console.log('✅ File persistence verified: custom question was saved to server/custom_questions.json');

// 29. Verify a newly created room inherits saved custom questions
const newRoom = roomManager.createRoom('host_new', 'Alice 2', '👑');
assert.ok(newRoom.customQuestions.some(q => q.id === persistentQuestion.customPair.id),
  'New room must automatically inherit questions from custom_questions.json');
console.log('✅ Room inheritance verified: new room loaded saved custom question');

// 30. Simulate server restart by creating a new RoomManager instance
const freshManager = new roomManager.constructor();
assert.ok(
  freshManager.persistentCustomQuestions.some(q => q.id === persistentQuestion.customPair.id),
  'Fresh RoomManager instance after simulated reboot must load custom_questions.json'
);
console.log('✅ Server reboot persistence verified: new manager loaded custom_questions.json on startup');

// 31. Verify Author Cannot Be Imposter holds after reboot with matching player name
const rebootRoom = freshManager.createRoom('host_reb', 'Host', '👑');
freshManager.joinRoom(rebootRoom.code, 'bob_new_socket', 'Bob', '🐶');
freshManager.joinRoom(rebootRoom.code, 'charlie_new_socket', 'Charlie', '🐱');
freshManager.updateSettings(rebootRoom.code, 'host_reb', {
  gameMode: 'questions',
  questionCategoryId: 'Custom Questions'
});
const rebootStart = freshManager.startGame(rebootRoom.code, 'host_reb');
assert.ifError(rebootStart.error);
assert.strictEqual(
  rebootStart.room.imposterIds.includes('bob_new_socket'),
  false,
  'Bob must still be protected from imposter selection after reboot by authorName match'
);
console.log('✅ Reboot author protection verified: Bob is protected as author even with a new socketId');

// 32. Verify removal updates custom_questions.json file
freshManager.playAgain(rebootRoom.code, 'host_reb');
const remRes = freshManager.removeCustomQuestion(rebootRoom.code, 'bob_new_socket', persistentQuestion.customPair.id);
assert.ifError(remRes.error);
const updatedFileContents = JSON.parse(fs.readFileSync(customQuestionsTestFile, 'utf-8'));
assert.strictEqual(
  updatedFileContents.some(q => q.id === persistentQuestion.customPair.id),
  false,
  'Removed question must be deleted from custom_questions.json'
);
console.log('✅ File deletion verified: question removed from custom_questions.json on deletion');

// Restore original custom questions file (if any existed before test run)
fs.writeFileSync(customQuestionsTestFile, originalCustomFileContent, 'utf-8');

console.log('\n🎉 ALL ROOM MANAGER, MULTI-IMPOSTER, QUESTION MODE & CUSTOM QUESTION TESTS PASSED!\n');

