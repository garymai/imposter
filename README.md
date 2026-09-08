# 🕵️‍♂️ The Imposter — Online Room-Code Word Party Game

A real-time, multi-device social deduction word party game built with **Node.js, Express, Socket.IO, React, and Tailwind CSS**. 

Players join on their own smartphones via a 4-letter room code (Jackbox-style) or by scanning a QR code from the host's screen.

---

## 🎮 How to Play

1. **Host a Room**:
   - The host opens the app and clicks **"Host Game"**.
   - A unique **4-letter room code** (e.g. `GAME`) and **QR code** appear on the screen.
2. **Players Join**:
   - Friends scan the QR code with their phone cameras or go to the URL, enter their nickname, pick an avatar, and enter the code.
3. **Phase 1: Secret Roles**:
   - Innocents see the Category & Secret Word (e.g., Category: *Food*, Word: *Pizza*).
   - Imposter(s) see the Category and `"YOU ARE THE IMPOSTER"`.
   - Built-in **"Press & Hold to Peek"** prevents nearby friends from peeking at your screen.
4. **Phase 2: Clue Round**:
   - Players take turns (in randomized order shown on screen) giving a 1-word or short clue.
   - Innocents want to prove they know the word without giving it away to the Imposter.
   - Imposters listen carefully and try to blend in!
5. **Phase 3: Discussion & Voting**:
   - **1-Imposter Mode**: Each player casts 1 vote.
   - **2-Imposter Mode**: Each player selects **2 distinct suspects**. The top 2 suspects with the most votes are selected!
6. **Phase 4: Reveal & Imposter's Last Stand**:
   - If an Innocent is eliminated, the Imposters win!
   - If the Imposter(s) are caught, they get **one final attempt to guess the secret word** to steal the victory.
7. **Rematch**:
   - Host clicks **"Play Again"** to seamlessly start a new round with the same group.

---

## 🚀 Quick Start

### 1. Install & Build
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Build frontend production bundle
npm run build
```

### 2. Run the App
To start the app:
```bash
npm start
```
Then open [http://localhost:3000](http://localhost:3000) in your browser!

### 3. Playing with Friends on the Same Wi-Fi
To let friends on your local Wi-Fi join from their phones:
1. Find your computer's local IP address (e.g., in macOS System Settings > Wi-Fi > Details, usually something like `192.168.1.50`).
2. Have friends open `http://192.168.1.50:3000` on their phone browsers (or just have them scan the QR code on the host screen!).

### 4. Running Tests
```bash
npm test
```
This runs both the unit tests (`server/test_room.js`) and the full-stack 6-device simulation (`server/test_e2e_simulation.js`).
