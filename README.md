# USMLE Battle Royale

Real-time multiplayer USMLE question battle game.

## Quick Start

Open **two terminals**:

**Terminal 1 — Server**
```bash
cd server
npm run dev        # or: npm start
```

**Terminal 2 — Client**
```bash
cd client
npm run dev
```

Then open `http://localhost:5173` in one or more browser tabs.

## How to Play

1. Enter a username and click **Enter Battle**
2. In the lobby, share the URL with friends (or open extra tabs to test solo)
3. The **HOST** (first player to join) clicks **Start Battle**
4. Answer each USMLE-style question within 20 seconds
5. Wrong answer or timeout = lose 1 ❤️ (3 lives total)
6. Last player standing wins
7. View game results + all-time leaderboard

## Stack

- **Frontend**: React 18 + Vite + Socket.io-client
- **Backend**: Node.js + Express + Socket.io
- **Storage**: in-memory (resets on server restart)
