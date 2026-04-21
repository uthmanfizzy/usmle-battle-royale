const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const questions = require('./questions');

const PORT = process.env.PORT || 3002;

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ── In-memory state ────────────────────────────────────────────────────────────

const lobbies = new Map();          // lobbyId -> lobby
const globalLeaderboard = new Map(); // username -> { wins, gamesPlayed, highScore }

// ── ID generation ──────────────────────────────────────────────────────────────

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generateLobbyId() {
  let id;
  do {
    id = Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
  } while (lobbies.has(id));
  return id;
}

function makeLobby(hostSocketId) {
  const id = generateLobbyId();
  const lobby = {
    id,
    hostId: hostSocketId,
    status: 'waiting',   // 'waiting' | 'question' | 'reviewing' | 'game_over'
    players: new Map(),  // socketId -> player
    questionQueue: [],
    questionIdx: -1,
    round: 0,
    timer: null,
    answers: new Map(),  // socketId -> 'A'|'B'|'C'|'D'
  };
  lobbies.set(id, lobby);
  return lobby;
}

// ── Lobby helpers ──────────────────────────────────────────────────────────────

function alivePlayers(lobby) {
  return [...lobby.players.values()].filter(p => p.alive);
}

function lobbyPayload(lobby) {
  return {
    lobbyId: lobby.id,
    hostId: lobby.hostId,
    status: lobby.status,
    players: [...lobby.players.values()].map(p => ({
      id: p.id,
      username: p.username,
      lives: p.lives,
      score: p.score,
      alive: p.alive,
    })),
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearTimer(lobby) {
  if (lobby.timer) { clearTimeout(lobby.timer); lobby.timer = null; }
}

// ── Game flow (all functions scoped to a single lobby) ─────────────────────────

function startGame(lobby) {
  lobby.status = 'question';
  lobby.round = 0;
  lobby.questionQueue = shuffle(questions);
  lobby.questionIdx = -1;

  for (const p of lobby.players.values()) {
    p.lives = 3; p.score = 0; p.alive = true;
  }

  io.to(lobby.id).emit('game_start', { message: 'Battle begins!' });
  setTimeout(() => nextQuestion(lobby), 1500);
}

function nextQuestion(lobby) {
  lobby.questionIdx++;

  if (lobby.questionIdx >= lobby.questionQueue.length) {
    endGame(lobby, 'questions_exhausted');
    return;
  }

  const alive = alivePlayers(lobby);
  if (alive.length <= 1) { endGame(lobby, 'last_standing'); return; }

  lobby.round++;
  lobby.status = 'question';
  lobby.answers.clear();

  const q = lobby.questionQueue[lobby.questionIdx];

  io.to(lobby.id).emit('new_question', {
    id: q.id,
    question: q.question,
    options: q.options,
    round: lobby.round,
    timeLimit: 20,
    alivePlayers: alive.length,
  });

  lobby.timer = setTimeout(() => processAnswers(lobby), 20_000);
}

function processAnswers(lobby) {
  clearTimer(lobby);
  lobby.status = 'reviewing';

  const q = lobby.questionQueue[lobby.questionIdx];
  const eliminated = [];
  const results = [];

  for (const player of lobby.players.values()) {
    if (!player.alive) continue;

    const answer = lobby.answers.get(player.id);
    const correct = answer === q.correct;

    if (correct) {
      player.score += 100;
    } else {
      player.lives = Math.max(0, player.lives - 1);
      if (player.lives === 0) { player.alive = false; eliminated.push(player.username); }
    }

    results.push({
      id: player.id,
      username: player.username,
      answered: answer !== undefined,
      correct,
      lives: player.lives,
      alive: player.alive,
    });

    const sock = io.sockets.sockets.get(player.id);
    if (sock) {
      sock.emit('answer_result', {
        correct,
        correctAnswer: q.correct,
        lives: player.lives,
        alive: player.alive,
        score: player.score,
        explanation: q.explanation,
      });
    }
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: p.lives, score: p.score, alive: p.alive,
  }));

  io.to(lobby.id).emit('round_results', {
    results,
    correctAnswer: q.correct,
    explanation: q.explanation,
    eliminated,
    players: snapshot,
  });

  const alive = alivePlayers(lobby);
  if (alive.length <= 1) {
    setTimeout(() => endGame(lobby, 'last_standing'), 4000);
  } else {
    setTimeout(() => nextQuestion(lobby), 4500);
  }
}

function endGame(lobby, reason) {
  lobby.status = 'game_over';
  clearTimer(lobby);

  const all = [...lobby.players.values()];
  const alive = alivePlayers(lobby);

  const sorted = [...all].sort((a, b) => {
    if (a.alive !== b.alive) return b.alive ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    return b.lives - a.lives;
  });

  const winner = alive.length >= 1 ? sorted[0] : null;

  for (const p of all) {
    const e = globalLeaderboard.get(p.username) ?? { wins: 0, gamesPlayed: 0, highScore: 0 };
    e.gamesPlayed++;
    if (winner && p.username === winner.username) e.wins++;
    if (p.score > e.highScore) e.highScore = p.score;
    globalLeaderboard.set(p.username, e);
  }

  const leaderboard = sorted.map((p, i) => ({
    rank: i + 1, username: p.username, score: p.score, lives: p.lives, alive: p.alive,
  }));

  const globalLB = [...globalLeaderboard.entries()]
    .map(([username, data]) => ({ username, ...data }))
    .sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.highScore - a.highScore)
    .slice(0, 10);

  io.to(lobby.id).emit('game_over', {
    winner: winner ? { username: winner.username, score: winner.score } : null,
    leaderboard,
    globalLeaderboard: globalLB,
    reason,
  });
}

// ── Socket handlers ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('[+] connected:', socket.id);

  // ── Create a brand-new lobby ──────────────────────────────────────────────
  socket.on('create_lobby', ({ username }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    const lobby = makeLobby(socket.id);
    lobby.players.set(socket.id, { id: socket.id, username: name, lives: 3, score: 0, alive: true });

    socket.lobbyId = lobby.id;
    socket.join(lobby.id);

    // Acknowledge directly to caller — no separate 'lobby_created' event needed.
    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));

    console.log(`Lobby ${lobby.id} created by ${name}`);
  });

  // ── Join an existing lobby by code ────────────────────────────────────────
  socket.on('join_lobby', ({ username, lobbyId }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    const lobby = lobbies.get((lobbyId ?? '').toUpperCase().trim());
    if (!lobby) return ack({ ok: false, error: 'Lobby not found. Check the code and try again.' });
    if (lobby.status !== 'waiting') return ack({ ok: false, error: 'This game has already started.' });

    const taken = [...lobby.players.values()].some(
      p => p.username.toLowerCase() === name.toLowerCase()
    );
    if (taken) return ack({ ok: false, error: 'That username is already taken in this lobby.' });

    lobby.players.set(socket.id, { id: socket.id, username: name, lives: 3, score: 0, alive: true });

    socket.lobbyId = lobby.id;
    socket.join(lobby.id);

    // Acknowledge directly to caller — no separate 'joined' event needed.
    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));

    console.log(`${name} joined lobby ${lobby.id}`);
  });

  // ── Start game ────────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return socket.emit('error', { message: 'Lobby not found.' });
    if (lobby.hostId !== socket.id) return socket.emit('error', { message: 'Only the host can start the game.' });
    if (lobby.status !== 'waiting') return socket.emit('error', { message: 'Game already started.' });
    if (lobby.players.size < 2) return socket.emit('error', { message: 'Need at least 2 players to start.' });

    startGame(lobby);
  });

  // ── Submit answer ─────────────────────────────────────────────────────────
  socket.on('submit_answer', ({ answer }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby || lobby.status !== 'question') return;

    const player = lobby.players.get(socket.id);
    if (!player?.alive || lobby.answers.has(socket.id)) return;

    lobby.answers.set(socket.id, answer);

    const alive = alivePlayers(lobby);
    const answeredCount = [...lobby.answers.keys()]
      .filter(id => lobby.players.get(id)?.alive).length;

    io.to(lobby.id).emit('answer_count', { answered: answeredCount, total: alive.length });

    if (answeredCount >= alive.length) {
      clearTimer(lobby);
      setTimeout(() => processAnswers(lobby), 600);
    }
  });

  // ── Reset / play again (stays in same lobby) ──────────────────────────────
  socket.on('reset_game', () => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    clearTimer(lobby);
    lobby.status = 'waiting';
    lobby.answers.clear();
    lobby.questionQueue = [];
    lobby.questionIdx = -1;
    lobby.round = 0;

    for (const p of lobby.players.values()) {
      p.lives = 3; p.score = 0; p.alive = true;
    }

    io.to(lobby.id).emit('game_reset', { lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log('[-] disconnected:', socket.id);

    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    const player = lobby.players.get(socket.id);
    if (!player) return;

    lobby.players.delete(socket.id);
    lobby.answers.delete(socket.id);

    // Clean up empty lobbies
    if (lobby.players.size === 0) {
      clearTimer(lobby);
      lobbies.delete(lobby.id);
      console.log(`Lobby ${lobby.id} closed (empty)`);
      return;
    }

    // Transfer host if the host left
    if (lobby.hostId === socket.id) {
      lobby.hostId = [...lobby.players.keys()][0];
      console.log(`Lobby ${lobby.id} host transferred to ${lobby.players.get(lobby.hostId).username}`);
    }

    if (lobby.status === 'waiting') {
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
      return;
    }

    io.to(lobby.id).emit('player_left', { username: player.username });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));

    if (lobby.status === 'question') {
      const alive = alivePlayers(lobby);
      if (alive.length <= 1) {
        clearTimer(lobby);
        endGame(lobby, 'player_left');
      } else {
        const answeredCount = [...lobby.answers.keys()]
          .filter(id => lobby.players.get(id)?.alive).length;
        if (answeredCount >= alive.length) {
          clearTimer(lobby);
          setTimeout(() => processAnswers(lobby), 600);
        }
      }
    }
  });
});

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeLobbies: lobbies.size,
    lobbies: [...lobbies.values()].map(l => ({
      id: l.id, status: l.status, players: l.players.size, round: l.round,
    })),
  });
});

server.listen(PORT, () => {
  console.log(`USMLE Battle Royale server running on port ${PORT}`);
});
