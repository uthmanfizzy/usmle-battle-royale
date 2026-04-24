console.log('PORT env var is:', process.env.PORT);

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const session    = require('express-session');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt        = require('jsonwebtoken');

// ── Supabase (optional — game works without it) ────────────────────────────────

let supabase = null;
if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
  try {
    supabase = require('./supabase');
    console.log('[Supabase] Connected');
  } catch (e) {
    console.warn('[Supabase] Failed to init:', e.message);
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PORT       = process.env.PORT       || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-prod';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

// ── Express setup ──────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: '*' }));
app.set('trust proxy', 1); // needed for secure cookies behind Railway's proxy
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: true, // must be true so OAuth state is saved before the redirect
  cookie: { secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 }, // cross-origin OAuth
}));
app.use(passport.initialize());
app.use(passport.session());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ── Mutable question bank ──────────────────────────────────────────────────────

let questionBank = [...require('./questions')];

// ── Category ID helpers ────────────────────────────────────────────────────────

const SUBJECT_PREFIXES = {
  cardiology: 'CA', neurology: 'NE', pharmacology: 'PH',
  microbiology: 'MI', biochemistry: 'BC', biostatistics: 'BS',
  pathology: 'PT', all: 'AL',
};

function nextQuestionId(subject) {
  const prefix = SUBJECT_PREFIXES[subject] || 'GN';
  const nums = questionBank
    .filter(q => q.subject === subject)
    .map(q => { const m = String(q.id).match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

// ── Game settings ──────────────────────────────────────────────────────────────

let gameSettings = {
  hardModeEnabled: false,
  step2Enabled: false,
  timerDuration: 20,
  startingLives: 3,
};

// ── In-memory stats (server-lifetime counters) ────────────────────────────────

let totalGamesPlayed = 0;
const registeredPlayers = new Set();

// ── In-memory game state ──────────────────────────────────────────────────────

const lobbies         = new Map(); // lobbyId → lobby
const globalLeaderboard = new Map(); // username → { wins, gamesPlayed, highScore }

// ── Admin auth ─────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'USMLEadmin2026';

function adminAuth(req, res, next) {
  if (req.headers['x-admin-password'] !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── JWT helpers ────────────────────────────────────────────────────────────────

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const decoded = verifyToken(auth.slice(7));
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });
  req.userId = decoded.userId;
  next();
}

// ── Passport Google OAuth ──────────────────────────────────────────────────────

passport.serializeUser((user, done) => done(null, user.id));

// Session is only used for the OAuth handshake — no need to re-fetch from DB
passport.deserializeUser((id, done) => done(null, { id }));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  'https://usmle-battle-royale-production.up.railway.app/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      if (!supabase) {
        // No DB — return a minimal user object so auth still works end-to-end
        return done(null, {
          id: profile.id,
          google_id: profile.id,
          email: profile.emails?.[0]?.value,
          username: profile.displayName,
          avatar_url: profile.photos?.[0]?.value,
        });
      }
      try {
        const googleId   = profile.id;
        const email      = profile.emails?.[0]?.value ?? null;
        const avatarUrl  = profile.photos?.[0]?.value ?? null;
        const displayName = profile.displayName ?? email ?? 'Player';

        // Upsert user (.maybeSingle returns null data — no error — when not found)
        let { data: user } = await supabase
          .from('users').select('*').eq('google_id', googleId).maybeSingle();

        if (!user) {
          const { data: created, error: createErr } = await supabase
            .from('users')
            .insert({ google_id: googleId, email, username: displayName, avatar_url: avatarUrl })
            .select().single();
          if (createErr) return done(createErr);
          user = created;
        } else {
          // Refresh avatar/email silently
          const { data: updated } = await supabase
            .from('users')
            .update({ email, avatar_url: avatarUrl })
            .eq('id', user.id).select().single();
          if (updated) user = updated;
        }

        done(null, user);
      } catch (err) { done(err); }
    }
  ));
  console.log('[Auth] Google OAuth strategy registered');
} else {
  console.warn('[Auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — OAuth disabled');
}

// ── Lobby ID generation ────────────────────────────────────────────────────────

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateLobbyId() {
  let id;
  do {
    id = Array.from({ length: 6 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('');
  } while (lobbies.has(id));
  return id;
}

function makeLobby(hostSocketId, subject = 'all', gameMode = 'battle_royale') {
  const id = generateLobbyId();
  const lobby = {
    id,
    hostId: hostSocketId,
    status: 'waiting',
    subject,
    gameMode,
    players:       new Map(),
    questionQueue: [],
    questionIdx:   -1,
    round:         0,
    timer:         null,
    answers:       new Map(),
    correctCounts: new Map(),
    // Speed Race
    raceCorrects:      null,
    raceFinishedOrder: [],
    raceTimer:         null,
    // Trivia Pursuit
    triviaPlayerOrder:     [],
    triviaTurnIdx:         0,
    triviaWedges:          null,
    triviaCurrentPlayerId: null,
    triviaCurrentCategory: null,
    triviaCurrentQuestion: null,
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
    lobbyId:  lobby.id,
    hostId:   lobby.hostId,
    status:   lobby.status,
    subject:  lobby.subject,
    gameMode: lobby.gameMode,
    players:  [...lobby.players.values()].map(p => ({
      id: p.id, username: p.username, clanTag: p.clanTag || null, lives: p.lives, score: p.score, alive: p.alive,
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

// ── Game flow ──────────────────────────────────────────────────────────────────

function startGame(lobby) {
  if (lobby.gameMode === 'speed_race')     return startSpeedRace(lobby);
  if (lobby.gameMode === 'trivia_pursuit') return startTriviaPursuit(lobby);

  // ── Battle Royale ─────────────────────────────────────────────────────────
  lobby.status        = 'question';
  lobby.round         = 0;
  lobby.correctCounts = new Map();

  const pool = lobby.subject === 'all'
    ? questionBank
    : questionBank.filter(q => q.subject === lobby.subject);
  lobby.questionQueue = shuffle(pool.length >= 5 ? pool : questionBank);
  lobby.questionIdx   = -1;

  const lives = gameSettings.startingLives;
  for (const p of lobby.players.values()) {
    p.lives = lives; p.score = 0; p.alive = true;
  }

  io.to(lobby.id).emit('game_start', { gameMode: 'battle_royale', message: 'Battle begins!' });
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

  const q         = lobby.questionQueue[lobby.questionIdx];
  const timeLimit = gameSettings.timerDuration;

  io.to(lobby.id).emit('new_question', {
    id: q.id, question: q.question, options: q.options,
    round: lobby.round, timeLimit, alivePlayers: alive.length,
  });

  lobby.timer = setTimeout(() => processAnswers(lobby), timeLimit * 1000);
}

function processAnswers(lobby) {
  clearTimer(lobby);
  lobby.status = 'reviewing';

  const q = lobby.questionQueue[lobby.questionIdx];
  const eliminated = [];
  const results    = [];

  for (const player of lobby.players.values()) {
    if (!player.alive) continue;

    const answer  = lobby.answers.get(player.id);
    const correct = answer === q.correct;

    if (correct) {
      player.score += 100;
      lobby.correctCounts.set(player.id, (lobby.correctCounts.get(player.id) || 0) + 1);
    } else {
      player.lives = Math.max(0, player.lives - 1);
      if (player.lives === 0) { player.alive = false; eliminated.push(player.username); }
    }

    results.push({
      id: player.id, username: player.username,
      answered: answer !== undefined, correct, lives: player.lives, alive: player.alive,
    });

    const sock = io.sockets.sockets.get(player.id);
    if (sock) {
      sock.emit('answer_result', {
        correct, correctAnswer: q.correct,
        lives: player.lives, alive: player.alive,
        score: player.score, explanation: q.explanation,
      });
    }
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: p.lives, score: p.score, alive: p.alive,
  }));

  io.to(lobby.id).emit('round_results', {
    results, correctAnswer: q.correct, explanation: q.explanation, eliminated, players: snapshot,
  });

  const alive = alivePlayers(lobby);
  if (alive.length <= 1) {
    setTimeout(() => endGame(lobby, 'last_standing'), 14000);
  } else {
    setTimeout(() => nextQuestion(lobby), 14500);
  }
}

function endGame(lobby, reason) {
  lobby.status = 'game_over';
  clearTimer(lobby);
  totalGamesPlayed++;

  const all   = [...lobby.players.values()];
  const alive = alivePlayers(lobby);

  const sorted = [...all].sort((a, b) => {
    if (a.alive !== b.alive) return b.alive ? 1 : -1;
    if (b.score  !== a.score) return b.score - a.score;
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
    gameMode: 'battle_royale',
    winner: winner ? { username: winner.username, score: winner.score } : null,
    leaderboard, globalLeaderboard: globalLB, reason,
  });

  // Award XP to authenticated players (fire-and-forget)
  awardXP(lobby, sorted).catch(err => console.error('[awardXP]', err.message));
}

// ── XP system ─────────────────────────────────────────────────────────────────

const XP_BY_PLACEMENT = { 1: 100, 2: 70, 3: 50 };
const XP_FALLBACK     = 25;
const XP_PER_CORRECT  = 5;

async function awardXP(lobby, sorted) {
  if (!supabase) return;

  for (let i = 0; i < sorted.length; i++) {
    const player = sorted[i];
    const sock   = io.sockets.sockets.get(player.id);
    if (!sock?.userId) continue; // skip unauthenticated players

    const placement = i + 1;
    const baseXp    = XP_BY_PLACEMENT[placement] ?? XP_FALLBACK;
    let correctCount = 0;
    if (lobby.gameMode === 'speed_race') {
      correctCount = lobby.raceCorrects?.get(player.id) || 0;
    } else if (lobby.gameMode === 'trivia_pursuit') {
      correctCount = (lobby.triviaWedges?.get(player.id) || new Set()).size * 2;
    } else {
      correctCount = lobby.correctCounts?.get(player.id) || 0;
    }
    const totalXp   = baseXp + correctCount * XP_PER_CORRECT;

    try {
      // Fetch current stats
      const { data: user } = await supabase
        .from('users')
        .select('xp, level, games_played, games_won')
        .eq('id', sock.userId)
        .single();

      if (!user) continue;

      const newXp      = user.xp + totalXp;
      const newLevel   = Math.floor(newXp / 500) + 1;
      const isWinner   = placement === 1 && player.alive;

      // Update user stats
      await supabase.from('users').update({
        xp:          newXp,
        level:       newLevel,
        games_played: user.games_played + 1,
        games_won:   isWinner ? user.games_won + 1 : user.games_won,
      }).eq('id', sock.userId);

      // Increment clan total_xp if user is in a clan
      if (user.clan_id) {
        const { data: clan } = await supabase.from('clans').select('total_xp').eq('id', user.clan_id).single();
        if (clan) {
          await supabase.from('clans').update({ total_xp: (clan.total_xp || 0) + totalXp }).eq('id', user.clan_id);
        }
      }

      // Record game history
      await supabase.from('game_history').insert({
        user_id:         sock.userId,
        lobby_id:        lobby.id,
        subject:         lobby.subject,
        placement,
        xp_earned:       totalXp,
        correct_answers: correctCount,
        total_questions: lobby.questionIdx + 1,
      });

      // Update subject mastery
      if (lobby.subject !== 'all') {
        await upsertMastery(sock.userId, lobby.subject, lobby.questionIdx + 1, correctCount);
      }

      console.log(`[XP] ${player.username} +${totalXp} XP (placement ${placement}, level ${newLevel})`);
    } catch (err) {
      console.error(`[XP] Error for ${player.username}:`, err.message);
    }
  }
}

async function upsertMastery(userId, subject, attempted, correct) {
  const { data: existing } = await supabase
    .from('subject_mastery')
    .select('*').eq('user_id', userId).eq('subject', subject).single();

  if (existing) {
    const newAttempted = existing.questions_attempted + attempted;
    const newCorrect   = existing.questions_correct   + correct;
    await supabase.from('subject_mastery').update({
      questions_attempted: newAttempted,
      questions_correct:   newCorrect,
      mastery_percent:     Math.round((newCorrect / newAttempted) * 100),
    }).eq('id', existing.id);
  } else {
    await supabase.from('subject_mastery').insert({
      user_id: userId, subject,
      questions_attempted: attempted,
      questions_correct:   correct,
      mastery_percent:     attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
    });
  }
}

// ── Speed Race ─────────────────────────────────────────────────────────────────

const SPEED_RACE_GOAL    = 20;
const SPEED_RACE_TIMEOUT = 10 * 60 * 1000; // 10 min
const SPEED_RACE_Q_TIME  = 15;             // seconds per question

function emitRaceProgress(lobby) {
  const progress = [...lobby.players.values()].map(p => ({
    id:       p.id,
    username: p.username,
    correct:  lobby.raceCorrects.get(p.id) || 0,
    finished: lobby.raceFinishedOrder.includes(p.id),
    position: lobby.raceFinishedOrder.includes(p.id)
                ? lobby.raceFinishedOrder.indexOf(p.id) + 1 : null,
  }));
  io.to(lobby.id).emit('race_progress', { progress, goal: SPEED_RACE_GOAL });
}

function startSpeedRace(lobby) {
  lobby.status            = 'speed_race';
  lobby.round             = 0;
  lobby.raceCorrects      = new Map();
  lobby.raceFinishedOrder = [];

  for (const p of lobby.players.values()) {
    lobby.raceCorrects.set(p.id, 0);
    p.lives = 3; p.score = 0; p.alive = true;
  }

  const pool = lobby.subject === 'all'
    ? questionBank
    : questionBank.filter(q => q.subject === lobby.subject);
  lobby.questionQueue = shuffle(pool.length >= 5 ? pool : questionBank);
  lobby.questionIdx   = -1;

  io.to(lobby.id).emit('game_start', { gameMode: 'speed_race' });

  lobby.raceTimer = setTimeout(() => {
    if (lobby.status === 'speed_race') endSpeedRace(lobby, 'time_up');
  }, SPEED_RACE_TIMEOUT);

  setTimeout(() => nextSpeedQuestion(lobby), 1500);
}

function nextSpeedQuestion(lobby) {
  if (lobby.status !== 'speed_race') return;

  lobby.questionIdx++;
  if (lobby.questionIdx >= lobby.questionQueue.length) {
    lobby.questionQueue = shuffle([...questionBank]);
    lobby.questionIdx   = 0;
  }

  lobby.round++;
  lobby.answers = new Map();

  const q         = lobby.questionQueue[lobby.questionIdx];
  const timeLimit = SPEED_RACE_Q_TIME;

  io.to(lobby.id).emit('new_question', {
    id: q.id, question: q.question, options: q.options,
    round: lobby.round, timeLimit, alivePlayers: lobby.players.size,
  });

  emitRaceProgress(lobby);

  lobby.timer = setTimeout(() => processSpeedRaceAnswers(lobby), timeLimit * 1000);
}

function processSpeedRaceAnswers(lobby) {
  clearTimer(lobby);
  if (lobby.status !== 'speed_race') return;

  const q = lobby.questionQueue[lobby.questionIdx];

  for (const player of lobby.players.values()) {
    const answer  = lobby.answers.get(player.id);
    const correct = answer === q.correct;

    if (correct) {
      const n = (lobby.raceCorrects.get(player.id) || 0) + 1;
      lobby.raceCorrects.set(player.id, n);
      player.score = n;
      if (n >= SPEED_RACE_GOAL && !lobby.raceFinishedOrder.includes(player.id)) {
        lobby.raceFinishedOrder.push(player.id);
      }
    }

    const sock = io.sockets.sockets.get(player.id);
    if (sock) {
      sock.emit('answer_result', {
        correct, correctAnswer: q.correct,
        lives: 3, alive: true,
        score: lobby.raceCorrects.get(player.id) || 0,
        explanation: q.explanation,
      });
    }
  }

  emitRaceProgress(lobby);

  if (lobby.raceFinishedOrder.length > 0) {
    setTimeout(() => endSpeedRace(lobby, 'goal_reached'), 3500);
    return;
  }

  if (lobby.players.size <= 1) { endSpeedRace(lobby, 'forfeit'); return; }

  setTimeout(() => nextSpeedQuestion(lobby), 3500);
}

function endSpeedRace(lobby, reason) {
  if (lobby.status === 'game_over') return;
  lobby.status = 'game_over';
  clearTimer(lobby);
  if (lobby.raceTimer) { clearTimeout(lobby.raceTimer); lobby.raceTimer = null; }

  const sorted = [...lobby.players.values()].sort((a, b) => {
    const ai = lobby.raceFinishedOrder.indexOf(a.id);
    const bi = lobby.raceFinishedOrder.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return (lobby.raceCorrects.get(b.id) || 0) - (lobby.raceCorrects.get(a.id) || 0);
  });

  const podium = sorted.map((p, i) => ({
    rank: i + 1, id: p.id, username: p.username,
    correctCount: lobby.raceCorrects.get(p.id) || 0,
    finished: lobby.raceFinishedOrder.includes(p.id),
  }));

  const winner = podium.length > 0
    ? { username: podium[0].username, score: podium[0].correctCount } : null;

  io.to(lobby.id).emit('game_over', { gameMode: 'speed_race', winner, podium, reason });
  awardXP(lobby, sorted).catch(err => console.error('[awardXP speed_race]', err.message));
}

// ── Trivia Pursuit ─────────────────────────────────────────────────────────────

const TRIVIA_CATS = [
  'cardiology', 'neurology', 'pharmacology',
  'microbiology', 'biochemistry', 'biostatistics',
];
const TRIVIA_Q_TIME = 20;

function triviaWedgeSnapshot(lobby) {
  const state = {};
  for (const [sid, ws] of lobby.triviaWedges) {
    const p = lobby.players.get(sid);
    if (p) state[sid] = { username: p.username, wedges: [...ws] };
  }
  return state;
}

function startTriviaPursuit(lobby) {
  lobby.status         = 'trivia_question';
  lobby.round          = 0;
  lobby.triviaWedges   = new Map();
  lobby.triviaTurnIdx  = 0;

  const players = [...lobby.players.values()];
  lobby.triviaPlayerOrder = shuffle(players.map(p => p.id));

  for (const p of players) {
    lobby.triviaWedges.set(p.id, new Set());
    p.lives = 3; p.score = 0; p.alive = true;
  }

  io.to(lobby.id).emit('game_start', { gameMode: 'trivia_pursuit' });
  setTimeout(() => nextTriviaTurn(lobby), 1500);
}

function nextTriviaTurn(lobby) {
  if (lobby.status !== 'trivia_question') return;

  lobby.round++;
  lobby.answers = new Map();

  const order  = lobby.triviaPlayerOrder;
  const sid    = order[lobby.triviaTurnIdx % order.length];
  const player = lobby.players.get(sid);

  if (!player) {
    lobby.triviaTurnIdx++;
    setTimeout(() => nextTriviaTurn(lobby), 200);
    return;
  }

  lobby.triviaCurrentPlayerId = sid;

  const playerWedges = lobby.triviaWedges.get(sid) || new Set();
  const missing      = TRIVIA_CATS.filter(c => !playerWedges.has(c));
  const category     = missing[Math.floor(Math.random() * missing.length)];
  lobby.triviaCurrentCategory = category;

  const pool = questionBank.filter(q => q.subject === category);
  const q    = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : questionBank[Math.floor(Math.random() * questionBank.length)];
  lobby.triviaCurrentQuestion = q;

  io.to(lobby.id).emit('trivia_turn', {
    currentPlayerId: sid,
    currentUsername: player.username,
    category,
    question:    { id: q.id, question: q.question, options: q.options },
    round:       lobby.round,
    timeLimit:   TRIVIA_Q_TIME,
    wedgeState:  triviaWedgeSnapshot(lobby),
    playerOrder: order.map(id => {
      const p = lobby.players.get(id);
      return { id, username: p?.username || '?' };
    }),
  });

  lobby.timer = setTimeout(() => processTriviaAnswer(lobby, null), TRIVIA_Q_TIME * 1000);
}

function processTriviaAnswer(lobby, answer) {
  clearTimer(lobby);
  if (lobby.status !== 'trivia_question') return;

  const { triviaCurrentPlayerId: sid,
          triviaCurrentCategory: category,
          triviaCurrentQuestion: q } = lobby;
  const correct    = answer !== null && answer === q.correct;
  let earnedWedge  = false;

  if (correct) {
    const wedges = lobby.triviaWedges.get(sid);
    if (wedges && !wedges.has(category)) {
      wedges.add(category);
      earnedWedge = true;
      const p = lobby.players.get(sid);
      if (p) p.score = wedges.size;
    }
  }

  const wedgeState = triviaWedgeSnapshot(lobby);

  io.to(lobby.id).emit('trivia_answer_result', {
    playerId: sid, correct, correctAnswer: q.correct,
    explanation: q.explanation, earnedWedge, category, wedgeState,
  });

  const playerWedges = lobby.triviaWedges.get(sid);
  if (playerWedges && playerWedges.size >= TRIVIA_CATS.length) {
    setTimeout(() => endTriviaPursuit(lobby, sid), 3500);
    return;
  }

  lobby.triviaTurnIdx++;
  setTimeout(() => nextTriviaTurn(lobby), 4500);
}

function endTriviaPursuit(lobby, winnerId) {
  if (lobby.status === 'game_over') return;
  lobby.status = 'game_over';
  clearTimer(lobby);

  const sorted = [...lobby.players.values()].sort((a, b) =>
    (lobby.triviaWedges?.get(b.id) || new Set()).size -
    (lobby.triviaWedges?.get(a.id) || new Set()).size
  );

  const winPlayer = lobby.players.get(winnerId);
  const winner    = winPlayer
    ? { username: winPlayer.username, score: TRIVIA_CATS.length } : null;

  const players = sorted.map((p, i) => ({
    rank: i + 1, id: p.id, username: p.username,
    wedgeCount: (lobby.triviaWedges?.get(p.id) || new Set()).size,
    wedges:     [...(lobby.triviaWedges?.get(p.id) || new Set())],
  }));

  io.to(lobby.id).emit('game_over', { gameMode: 'trivia_pursuit', winner, players });
  awardXP(lobby, sorted).catch(err => console.error('[awardXP trivia]', err.message));
}

// ── Socket.io — attach userId from JWT on connect ─────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded?.userId) socket.userId = decoded.userId;
  }
  next(); // always allow — userId is optional
});

// ── Socket handlers ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('[+] connected:', socket.id, socket.userId ? `(user ${socket.userId})` : '');

  socket.on('create_lobby', ({ username, subject = 'all', gameMode = 'battle_royale', clanTag = null }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    const lobby = makeLobby(socket.id, subject, gameMode);
    lobby.players.set(socket.id, {
      id: socket.id, username: name, clanTag: clanTag || null, lives: gameSettings.startingLives, score: 0, alive: true,
    });
    socket.lobbyId = lobby.id;
    socket.join(lobby.id);
    registeredPlayers.add(name.toLowerCase());

    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
    console.log(`Lobby ${lobby.id} created by ${name}`);
  });

  socket.on('join_lobby', ({ username, lobbyId, clanTag = null }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    const lobby = lobbies.get((lobbyId ?? '').toUpperCase().trim());
    if (!lobby)                       return ack({ ok: false, error: 'Lobby not found. Check the code and try again.' });
    if (lobby.status !== 'waiting')   return ack({ ok: false, error: 'This game has already started.' });

    const taken = [...lobby.players.values()].some(
      p => p.username.toLowerCase() === name.toLowerCase()
    );
    if (taken) return ack({ ok: false, error: 'That username is already taken in this lobby.' });

    lobby.players.set(socket.id, {
      id: socket.id, username: name, clanTag: clanTag || null, lives: gameSettings.startingLives, score: 0, alive: true,
    });
    socket.lobbyId = lobby.id;
    socket.join(lobby.id);
    registeredPlayers.add(name.toLowerCase());

    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
    console.log(`${name} joined lobby ${lobby.id}`);
  });

  socket.on('start_game', () => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return socket.emit('error', { message: 'Lobby not found.' });
    if (lobby.hostId !== socket.id) return socket.emit('error', { message: 'Only the host can start the game.' });
    if (lobby.status !== 'waiting') return socket.emit('error', { message: 'Game already started.' });
    if (lobby.players.size < 2)     return socket.emit('error', { message: 'Need at least 2 players to start.' });
    startGame(lobby);
  });

  socket.on('submit_answer', ({ answer }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    // ── Speed Race ─────────────────────────────────────────────────────────
    if (lobby.status === 'speed_race') {
      if (lobby.answers.has(socket.id)) return;
      lobby.answers.set(socket.id, answer);
      const allAnswered = [...lobby.players.keys()].every(id => lobby.answers.has(id));
      if (allAnswered) { clearTimer(lobby); setTimeout(() => processSpeedRaceAnswers(lobby), 600); }
      return;
    }

    // ── Trivia Pursuit ─────────────────────────────────────────────────────
    if (lobby.status === 'trivia_question') {
      if (socket.id !== lobby.triviaCurrentPlayerId || lobby.answers.has(socket.id)) return;
      lobby.answers.set(socket.id, answer);
      clearTimer(lobby);
      setTimeout(() => processTriviaAnswer(lobby, answer), 300);
      return;
    }

    // ── Battle Royale ──────────────────────────────────────────────────────
    if (lobby.status !== 'question') return;
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

  socket.on('reset_game', () => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    clearTimer(lobby);
    if (lobby.raceTimer) { clearTimeout(lobby.raceTimer); lobby.raceTimer = null; }

    lobby.status        = 'waiting';
    lobby.answers.clear();
    lobby.correctCounts = new Map();
    lobby.questionQueue = [];
    lobby.questionIdx   = -1;
    lobby.round         = 0;

    // Reset mode-specific state
    lobby.raceCorrects         = null;
    lobby.raceFinishedOrder    = [];
    lobby.triviaPlayerOrder    = [];
    lobby.triviaTurnIdx        = 0;
    lobby.triviaWedges         = null;
    lobby.triviaCurrentPlayerId   = null;
    lobby.triviaCurrentCategory   = null;
    lobby.triviaCurrentQuestion   = null;

    for (const p of lobby.players.values()) {
      p.lives = gameSettings.startingLives; p.score = 0; p.alive = true;
    }

    io.to(lobby.id).emit('game_reset', { lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
  });

  socket.on('disconnect', () => {
    console.log('[-] disconnected:', socket.id);
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    const player = lobby.players.get(socket.id);
    if (!player) return;

    lobby.players.delete(socket.id);
    lobby.answers.delete(socket.id);

    if (lobby.players.size === 0) {
      clearTimer(lobby);
      lobbies.delete(lobby.id);
      console.log(`Lobby ${lobby.id} closed (empty)`);
      return;
    }

    if (lobby.hostId === socket.id) {
      lobby.hostId = [...lobby.players.keys()][0];
      console.log(`Lobby ${lobby.id} host → ${lobby.players.get(lobby.hostId).username}`);
    }

    if (lobby.status === 'waiting') {
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby)); return;
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
    } else if (lobby.status === 'speed_race') {
      if (lobby.players.size <= 1) {
        endSpeedRace(lobby, 'forfeit');
      } else {
        const allAnswered = [...lobby.players.keys()].every(id => lobby.answers.has(id));
        if (allAnswered) { clearTimer(lobby); setTimeout(() => processSpeedRaceAnswers(lobby), 600); }
      }
    } else if (lobby.status === 'trivia_question') {
      if (lobby.players.size <= 1) {
        endTriviaPursuit(lobby, [...lobby.players.keys()][0]);
      } else if (socket.id === lobby.triviaCurrentPlayerId) {
        clearTimer(lobby);
        lobby.triviaTurnIdx++;
        setTimeout(() => nextTriviaTurn(lobby), 1000);
      }
    }
  });
});

// ── REST API ───────────────────────────────────────────────────────────────────

app.get('/api/questions', (req, res) => {
  const subject = (req.query.subject || 'all').toLowerCase();
  const pool    = subject === 'all'
    ? questionBank
    : questionBank.filter(q => q.subject === subject);
  res.json({ questions: shuffle(pool.length >= 5 ? pool : questionBank) });
});

// ── Auth API ───────────────────────────────────────────────────────────────────

app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID)
    return res.status(503).json({ error: 'Google OAuth is not configured on this server.' });
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

const FRONTEND_URL = 'https://client-flax-psi-53.vercel.app';

app.get('/auth/google/callback', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=not_configured`);
  }
  passport.authenticate('google', (err, user) => {
    if (err) {
      console.error('[Auth] OAuth strategy error:', err.message);
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=oauth_failed`);
    }
    if (!user) {
      console.error('[Auth] No user returned from Google strategy');
      return res.redirect(`${FRONTEND_URL}/auth/callback?error=no_user`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('[Auth] Login error:', loginErr.message);
        return res.redirect(`${FRONTEND_URL}/auth/callback?error=login_failed`);
      }
      try {
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '30d' }
        );
        req.logout(() => {});
        console.log('[Auth] Login success, user:', user.id);
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}`);
      } catch (signErr) {
        console.error('[Auth] JWT sign error:', signErr.message);
        res.redirect(`${FRONTEND_URL}/auth/callback?error=token_failed`);
      }
    });
  })(req, res);
});

app.get('/auth/me', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const [userRes, historyRes] = await Promise.all([
      supabase.from('users').select('*, subject_mastery(*)').eq('id', req.userId).single(),
      supabase.from('game_history').select('*').eq('user_id', req.userId)
        .order('played_at', { ascending: false }).limit(10),
    ]);
    if (userRes.error || !userRes.data) return res.status(404).json({ error: 'User not found.' });

    const user = userRes.data;
    let clan = null;

    if (user.clan_id) {
      const [clanRes, membersRes] = await Promise.all([
        supabase.from('clans').select('id, name, tag, total_xp').eq('id', user.clan_id).single(),
        supabase.from('clan_members')
          .select('role, user:user_id(id, username, avatar_url, xp, level)')
          .eq('clan_id', user.clan_id),
      ]);
      if (clanRes.data) {
        const allMembers = (membersRes.data || [])
          .map(m => ({ ...m.user, role: m.role }))
          .filter(m => m?.id);
        allMembers.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        clan = { ...clanRes.data, member_count: allMembers.length, top_members: allMembers.slice(0, 5) };
      }
    }

    res.json({ ...user, game_history: historyRes.data || [], clan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout?.(() => {});
  res.json({ ok: true });
});

// ── Clan API ───────────────────────────────────────────────────────────────────

app.post('/api/clans', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const { name, tag } = req.body;
  if (!name || !tag) return res.status(400).json({ error: 'name and tag required.' });
  if (name.trim().length < 3 || name.trim().length > 50)
    return res.status(400).json({ error: 'Clan name must be 3–50 characters.' });
  if (!/^[A-Z0-9]{2,4}$/i.test(tag.trim()))
    return res.status(400).json({ error: 'Tag must be 2–4 letters/numbers.' });
  try {
    const { data: user } = await supabase.from('users').select('clan_id').eq('id', req.userId).single();
    if (user?.clan_id) return res.status(400).json({ error: 'Leave your current clan first.' });
    const { data: clan, error: clanErr } = await supabase.from('clans').insert({
      name: name.trim(), tag: tag.toUpperCase().trim(), created_by: req.userId, total_xp: 0,
    }).select().single();
    if (clanErr) {
      if (clanErr.code === '23505') return res.status(409).json({ error: 'Clan name or tag already taken.' });
      return res.status(500).json({ error: clanErr.message });
    }
    await Promise.all([
      supabase.from('clan_members').insert({ clan_id: clan.id, user_id: req.userId, role: 'owner' }),
      supabase.from('users').update({ clan_id: clan.id }).eq('id', req.userId),
    ]);
    res.json({ ok: true, clan });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/clans/search', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ clans: [] });
  try {
    const { data: clans } = await supabase.from('clans')
      .select('id, name, tag, total_xp').ilike('name', `%${q}%`).limit(10);
    if (!clans?.length) return res.json({ clans: [] });
    const ids = clans.map(c => c.id);
    const { data: members } = await supabase.from('clan_members').select('clan_id').in('clan_id', ids);
    const counts = {};
    (members || []).forEach(m => { counts[m.clan_id] = (counts[m.clan_id] || 0) + 1; });
    res.json({ clans: clans.map(c => ({ ...c, member_count: counts[c.id] || 0 })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/clans/leaderboard', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { data: clans } = await supabase.from('clans')
      .select('id, name, tag, total_xp').order('total_xp', { ascending: false }).limit(10);
    if (!clans?.length) return res.json({ clans: [] });
    const ids = clans.map(c => c.id);
    const { data: members } = await supabase.from('clan_members').select('clan_id').in('clan_id', ids);
    const counts = {};
    (members || []).forEach(m => { counts[m.clan_id] = (counts[m.clan_id] || 0) + 1; });
    res.json({ clans: clans.map(c => ({ ...c, member_count: counts[c.id] || 0 })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clans/:id/join', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { data: user } = await supabase.from('users').select('clan_id').eq('id', req.userId).single();
    if (user?.clan_id) return res.status(400).json({ error: 'Leave your current clan first.' });
    const { data: clan } = await supabase.from('clans').select('id, name, tag').eq('id', req.params.id).single();
    if (!clan) return res.status(404).json({ error: 'Clan not found.' });
    await Promise.all([
      supabase.from('clan_members').insert({ clan_id: clan.id, user_id: req.userId, role: 'member' }),
      supabase.from('users').update({ clan_id: clan.id }).eq('id', req.userId),
    ]);
    res.json({ ok: true, clan });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/clans/leave', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { data: user } = await supabase.from('users').select('clan_id').eq('id', req.userId).single();
    if (!user?.clan_id) return res.status(400).json({ error: 'You are not in a clan.' });
    const clanId = user.clan_id;
    const { data: membership } = await supabase.from('clan_members')
      .select('role').eq('clan_id', clanId).eq('user_id', req.userId).single();
    await Promise.all([
      supabase.from('clan_members').delete().eq('clan_id', clanId).eq('user_id', req.userId),
      supabase.from('users').update({ clan_id: null }).eq('id', req.userId),
    ]);
    if (membership?.role === 'owner') {
      const { data: remaining } = await supabase.from('clan_members')
        .select('user_id').eq('clan_id', clanId).limit(1);
      if (!remaining?.length) {
        await supabase.from('clans').delete().eq('id', clanId);
        return res.json({ ok: true });
      }
      await supabase.from('clan_members')
        .update({ role: 'owner' }).eq('clan_id', clanId).eq('user_id', remaining[0].user_id);
    }
    // Recalculate clan total_xp from remaining members
    const { data: remainingMembers } = await supabase.from('clan_members')
      .select('user:user_id(xp)').eq('clan_id', clanId);
    const newTotal = (remainingMembers || []).reduce((s, m) => s + (m.user?.xp || 0), 0);
    await supabase.from('clans').update({ total_xp: newTotal }).eq('id', clanId);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Leaderboard API ────────────────────────────────────────────────────────────

app.get('/api/leaderboard/players', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { data: players } = await supabase.from('users')
      .select('id, username, avatar_url, xp, level, clan_id')
      .order('xp', { ascending: false }).limit(50);
    if (!players?.length) return res.json({ players: [] });
    const clanIds = [...new Set(players.filter(p => p.clan_id).map(p => p.clan_id))];
    const tagMap = {};
    if (clanIds.length > 0) {
      const { data: clans } = await supabase.from('clans').select('id, tag').in('id', clanIds);
      (clans || []).forEach(c => { tagMap[c.id] = c.tag; });
    }
    res.json({
      players: players.map((p, i) => ({
        rank: i + 1, id: p.id, username: p.username, avatar_url: p.avatar_url,
        xp: p.xp, level: p.level, clan_tag: p.clan_id ? tagMap[p.clan_id] : null,
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Admin API ──────────────────────────────────────────────────────────────────

app.get('/admin/stats', adminAuth, (req, res) => {
  const questionsByCategory = {};
  for (const q of questionBank) {
    questionsByCategory[q.subject] = (questionsByCategory[q.subject] || 0) + 1;
  }
  res.json({
    questionsByCategory,
    totalQuestions: questionBank.length,
    totalGamesPlayed,
    totalPlayersRegistered: registeredPlayers.size,
  });
});

app.get('/admin/settings', adminAuth, (req, res) => res.json(gameSettings));

app.post('/admin/settings', adminAuth, (req, res) => {
  const { hardModeEnabled, step2Enabled, timerDuration, startingLives } = req.body;
  if (hardModeEnabled !== undefined) gameSettings.hardModeEnabled = Boolean(hardModeEnabled);
  if (step2Enabled    !== undefined) gameSettings.step2Enabled    = Boolean(step2Enabled);
  if (timerDuration   !== undefined) gameSettings.timerDuration   = Math.max(5, Math.min(60, Number(timerDuration)));
  if (startingLives   !== undefined) gameSettings.startingLives   = Math.max(1, Math.min(10, Number(startingLives)));
  res.json(gameSettings);
});

app.get('/admin/questions', adminAuth, (req, res) => res.json({ questions: questionBank }));

app.post('/admin/questions/bulk', adminAuth, (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: 'Expected { questions: [...] }' });
  const added = [];
  for (const q of questions) {
    if (!q.subject || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || !q.correct || !q.explanation) continue;
    const newQ = { id: nextQuestionId(q.subject), subject: q.subject, difficulty: q.difficulty || 'easy', question: q.question, options: q.options, correct: q.correct, explanation: q.explanation };
    questionBank.push(newQ);
    added.push(newQ);
  }
  res.json({ added: added.length, questions: added });
});

app.post('/admin/questions', adminAuth, (req, res) => {
  const { subject, difficulty, question, options, correct, explanation } = req.body;
  if (!subject || !question || !Array.isArray(options) || options.length !== 4 || !correct || !explanation)
    return res.status(400).json({ error: 'Missing required fields' });
  const newQ = { id: nextQuestionId(subject), subject, difficulty: difficulty || 'easy', question, options, correct, explanation };
  questionBank.push(newQ);
  res.json(newQ);
});

app.put('/admin/questions/:id', adminAuth, (req, res) => {
  const id  = req.params.id;
  const idx = questionBank.findIndex(q => String(q.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });
  questionBank[idx] = { ...questionBank[idx], ...req.body, id };
  res.json(questionBank[idx]);
});

app.delete('/admin/questions/:id', adminAuth, (req, res) => {
  const id  = req.params.id;
  const idx = questionBank.findIndex(q => String(q.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });
  questionBank.splice(idx, 1);
  res.json({ ok: true });
});

// ── Health check ───────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.status(200).send('ok'));

app.get('/health', (req, res) => res.json({
  status: 'ok',
  supabase: !!supabase,
  googleAuth: !!(process.env.GOOGLE_CLIENT_ID),
  activeLobbies: lobbies.size,
  lobbies: [...lobbies.values()].map(l => ({
    id: l.id, status: l.status, players: l.players.size, round: l.round,
  })),
}));

// ── Start ──────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`USMLE Battle Royale server running on port ${PORT}`);
});
