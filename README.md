# 🕵️‍♂️ The Imposter — Online Room-Code Word Party Game

A real-time, multi-device social deduction word party game built with **Node.js, Express, Socket.IO, React, and Tailwind CSS**. 

Players join on their own smartphones via a 4-letter room code (Jackbox-style) or by scanning a QR code from the host's screen.

---

## 🎮 Game Modes

### 1. 🕵️ Classic Word Mode
- **Secret Roles**: Innocents see the Secret Word (e.g., *Pizza*); Imposter(s) see only the category.
- **Clue Round**: Players take turns giving a 1-word or short clue aloud.
- **Discussion & Voting**: Vote out who you believe is the Imposter.
- **Last Stand**: If caught, the Imposter gets one chance to guess the secret word to steal the win!

### 2. ❓ Question Imposter Mode (New!)
- **Secret Questions**: Everyone gets a secret question and types in their answer.
  - Innocents receive the **Normal Question** (e.g., *"What is an essential item you always pack for an overnight trip?"*).
  - The Imposter receives a subtly different **Imposter Question** (e.g., *"What is an essential item you always bring for a full day at the beach?"*).
  - **Blind Imposter**: Nobody knows who the Imposter is while typing!
- **Reveal & Discussion**: The Normal Question is revealed to everyone, and all submitted answers are displayed with player names and avatars. The group discusses and cross-examines suspicious answers!
- **Results**: Reveals the Imposter and unveils both the Normal Question and the secret Imposter Question side-by-side!
- **✍️ Player-Submitted Questions**: Any player can submit custom question pairs (Normal + Imposter) from the lobby!
  - **Fairness Guarantee**: If a player's custom question is selected, that player is **guaranteed to be an Innocent** (excluded from being chosen as Imposter).
  - **Author Attribution**: Reveals *"⭐ Prompt by [PlayerName]"* during discussion & results.
  - **Saved Templates**: Questions you submit are automatically saved locally on your device for future games.

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
