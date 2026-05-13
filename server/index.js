console.log('PORT env var is:', process.env.PORT);

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const session    = require('express-session');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt        = require('jsonwebtoken');
const fs         = require('fs');
const path       = require('path');

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

// Manual CORS headers - MUST be first middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password, x-admin-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// CORS configuration - allow all origins
const corsOptions = {
  origin: function(origin, callback) {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-password", "x-admin-key"],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.set('trust proxy', 1); // needed for secure cookies behind Railway's proxy
app.use(express.json({ limit: '10mb' }));
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
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// ── Question bank from Supabase (with fallback to local file) ──────────────────

let questionBank = [];
let questionsLastLoaded = 0;
const QUESTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load questions from Supabase, fall back to local file
async function loadQuestionsFromDB() {
  if (!supabase) {
    console.log('[Questions] Supabase not available, using local questions.js');
    questionBank = [...require('./questions')];
    return;
  }

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('question_id');

    if (error) throw error;

    if (data && data.length > 0) {
      // Transform Supabase format to internal format
      questionBank = data.map(q => ({
        id: q.question_id,
        subject: q.category,
        difficulty: q.difficulty || 'easy',
        question: q.question,
        options: q.choices,
        correct: q.correct,
        explanation: q.explanation || '',
        game_modes: q.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
        image_url: q.image_url || undefined,
        tower_floor: q.tower_floor || undefined,
        topic_id: q.topic_id || undefined,
        buzz_type: q.buzz_type || undefined,
        question_type: q.question_type || 'mcq',
        _supabase_id: q.id, // Keep Supabase UUID for updates
      }));
      questionsLastLoaded = Date.now();
      console.log(`[Questions] Loaded ${questionBank.length} questions from Supabase`);
    } else {
      // No questions in Supabase yet, fall back to local file
      console.log('[Questions] No questions in Supabase, using local questions.js');
      questionBank = [...require('./questions')];
    }
  } catch (err) {
    console.error('[Questions] Error loading from Supabase:', err.message);
    console.log('[Questions] Falling back to local questions.js');
    questionBank = [...require('./questions')];
  }
}

// Refresh questions cache if stale
async function refreshQuestionsIfNeeded() {
  if (Date.now() - questionsLastLoaded > QUESTIONS_CACHE_TTL) {
    await loadQuestionsFromDB();
  }
}

// Force refresh questions cache
async function forceRefreshQuestions() {
  await loadQuestionsFromDB();
}

// DEPRECATED: No longer writes to file - now uses Supabase
function persistQuestions() {
  console.warn('[Questions] persistQuestions() is deprecated - questions now stored in Supabase');
}

// ── Category ID helpers ────────────────────────────────────────────────────────

const SUBJECT_PREFIXES = {
  cardiology: 'CA', neurology: 'NE', pharmacology: 'PH',
  microbiology: 'MI', biochemistry: 'BC', biostatistics: 'BS',
  pathology: 'PT', all: 'AL', scan_master: 'SM',
  // Coming soon subjects
  pulmonology: 'PL', nephrology: 'NP', gastroenterology: 'GI',
  endocrinology: 'EN', haematology: 'HM', immunology: 'IM',
  musculoskeletal: 'MS', dermatology: 'DR', reproductive: 'OB',
  psychiatry: 'PS', ophthalmology: 'OP', ent: 'ET',
  genetics: 'GC', anatomy: 'AN',
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
  // legacy compat
  hardModeEnabled: false,
  step2Enabled: false,
  timerDuration: 20,
  startingLives: 3,
  // Section 1: Question settings
  timerDefault: 20,
  timerSpeedRace: 10,
  timerTriviaPursuit: 25,
  timerScanMaster: 25,
  explanationTime: 5,
  speedRaceQuestions: 20,
  battleRoyaleMaxQ: 0,
  minQuestionsPerCategory: 5,
  // Section 2: Lives & difficulty
  battleRoyaleLives: 3,
  suddenDeathTrigger: 2,
  suddenDeathTimer: 5,
  towerFloorLives: 3,
  bossTolerance: 0,
  // Section 3: Lobby
  maxPlayersPerLobby: 10,
  minPlayersToStart: 2,
  maxBotsPerLobby: 3,
  lobbyAutoStart: 0,
  allowGuests: true,
  allowQuickJoin: true,
  // Section 4: XP & Progression
  xpFirst: 100,
  xpSecond: 70,
  xpThird: 50,
  xpOther: 25,
  xpPerCorrect: 5,
  xpDailyChallenge: 50,
  xpPerLevel: 500,
  streakBonusMultiplier: 2,
  // Section 5: Game Mode toggles
  modesBattleRoyale: true,
  modesSpeedRace: true,
  modesTriviaPursuit: true,
  modesScanMaster: true,
  modesTower: true,
  dailyChallengeEnabled: true,
  weeklyTournamentEnabled: false,
  powerUpsEnabled: true,
  // Section 6: Maintenance
  maintenanceMode: false,
  maintenanceMessage: '',
  maxConcurrentLobbies: 0,
  // Section 7: UI
  showStreakCounter: true,
  showPlayerCount: true,
  showCorrectAnswer: true,
  showGameLeaderboard: true,
  soundEffectsEnabled: true,
  backgroundMusicEnabled: true,
  // Section 9: Landing Page
  navbarBlurEnabled: true,
  stats_board_width: 280,
  stats_board_top: 0,
  stats_board_position: 'right',
  stats_board_opacity: 100,
  stats_board_visible: true,
  // Section 8: Tower / Story Mode
  towerQuestionsNormal: 3,
  towerQuestionsChallenge: 5,
  towerQuestionsBoss: 10,
  towerQuestionTimer: 20,
  towerXpNormal: 30,
  towerXpChallenge: 60,
  towerXpBoss: 150,
  towerXpPerfectBonus: 20,
  towerXpZoneBonus: 200,
  towerTotalFloors: 100,
  towerChallengeInterval: 5,
  towerBossInterval: 10,
  // Zone customisation
  towerZone1Name: 'The Basement',
  towerZone1Desc: 'Deep beneath the hospital, the foundations of biochemistry echo through stone walls. Master the basics or be buried here forever.',
  towerZone2Name: 'The Laboratory',
  towerZone2Desc: 'Culture plates and microscopes everywhere. Invisible enemies lurk in every petri dish. Identify them or be consumed.',
  towerZone3Name: 'The Ward',
  towerZone3Desc: 'Medication carts line the hallways. Every drug interaction, every mechanism — your patients depend on your knowledge.',
  towerZone4Name: 'The Clinic',
  towerZone4Desc: 'Neurological exams await. Reflex hammers and MRI films are scattered across darkened examination rooms.',
  towerZone5Name: 'The Cardio Unit',
  towerZone5Desc: 'ECG tracings paper the walls. The rhythms of the heart are your language here. One misread and the case collapses.',
  towerZone6Name: 'The Research Floor',
  towerZone6Desc: 'Whiteboards covered in p-values and confidence intervals. The numbers tell the truth — if you know how to read them.',
  towerZone7Name: 'The GI Tract',
  towerZone7Desc: 'The gut is more complex than it appears. Motility disorders, inflammatory conditions, and neoplasms hide behind everyday symptoms.',
  towerZone8Name: 'The Lungs',
  towerZone8Desc: 'Breath by breath, the pulmonary floor tests your knowledge of obstruction, restriction, infection and beyond. Every wheeze has a reason.',
  towerZone9Name: 'The Reproductive System',
  towerZone9Desc: 'Obstetrics and reproductive medicine collide at the upper floors. From conception to complications — nothing here is straightforward.',
  towerZone10Name: 'The Summit',
  towerZone10Desc: 'The final ten floors. Boss encounters on every level. Only legends reach the top.',
};

// ── Persist / load game settings via Supabase ─────────────────────────────────

async function loadSettingsFromDB() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('key, value');

    if (error) {
      console.warn('[Settings] Load error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      // Reconstruct gameSettings from key-value pairs
      const loadedSettings = {};
      for (const row of data) {
        try {
          // Try to parse as JSON first (for objects/arrays/booleans/numbers)
          loadedSettings[row.key] = JSON.parse(row.value);
        } catch {
          // If parse fails, use as string
          loadedSettings[row.key] = row.value;
        }
      }
      gameSettings = { ...gameSettings, ...loadedSettings };
      console.log(`[Settings] Loaded ${data.length} settings from Supabase`);
    }
  } catch (err) {
    console.warn('[Settings] Load failed:', err.message);
  }
}

async function persistSettingsToDB() {
  if (!supabase) return null;

  try {
    // Convert gameSettings object to array of key-value pairs
    const rows = Object.entries(gameSettings).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      updated_at: new Date().toISOString()
    }));

    // Upsert all settings (key is the unique identifier)
    const { error } = await supabase
      .from('game_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('[Settings] Persist error:', error.message);
      return error;
    }

    console.log(`[Settings] Persisted ${rows.length} settings to Supabase`);
    return null;
  } catch (err) {
    console.error('[Settings] Persist failed:', err.message);
    return err;
  }
}

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
        const googleId  = profile.id;
        const email     = profile.emails?.[0]?.value ?? null;
        const avatarUrl = profile.photos?.[0]?.value ?? null;

        // Upsert: create user on first login, refresh email/avatar on subsequent logins.
        // username is NOT included so existing usernames are never overwritten.
        const { data: user, error: upsertErr } = await supabase
          .from('users')
          .upsert(
            { google_id: googleId, email, avatar_url: avatarUrl },
            { onConflict: 'google_id', ignoreDuplicates: false }
          )
          .select('*')
          .single();

        if (upsertErr) return done(upsertErr);
        if (!user) return done(new Error('Failed to create or retrieve user record'));

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

function makeLobby(hostSocketId, subject = 'all', gameMode = 'battle_royale', difficulty = 'easy') {
  const id = generateLobbyId();
  const lobby = {
    id,
    hostId: hostSocketId,
    status: 'waiting',
    subject,
    gameMode,
    difficulty,  // 'easy' or 'hard'
    openToQuickJoin: true,
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
    triviaPlayerOrder:      [],
    triviaTurnIdx:          0,
    triviaWedges:           null,
    triviaPositions:        null,
    triviaCurrentPlayerId:  null,
    triviaCurrentCategory:  null,
    triviaCurrentQuestion:  null,
    triviaIsHQ:             false,
    triviaCanEarnWedge:     false,
    triviaIsFinalQuestion:  false,
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
    lobbyId:         lobby.id,
    hostId:          lobby.hostId,
    status:          lobby.status,
    subject:         lobby.subject,
    gameMode:        lobby.gameMode,
    openToQuickJoin: lobby.openToQuickJoin !== false,
    players:         [...lobby.players.values()].map(p => ({
      id: p.id, username: p.username, clanTag: p.clanTag || null,
      lives: p.lives, score: p.score, alive: p.alive, isBot: p.isBot || false,
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

// ── Power-up system ────────────────────────────────────────────────────────────

const POWERUP_POOL = ['50_50', 'extra_time', 'skip', 'freeze', 'double_xp'];

function assignPowerups(lobby) {
  lobby.playerPowerups   = new Map();
  lobby.usedPowerupThisQ = new Set();
  lobby.frozenPlayers    = new Map();
  lobby.pendingDoubleXp  = new Set();
  lobby.powerupXpBonus   = new Map();
  for (const p of lobby.players.values()) {
    if (p.isBot) continue;
    const picks = shuffle([...POWERUP_POOL]).slice(0, 2);
    lobby.playerPowerups.set(p.id, picks);
  }
}

// ── Streak helpers ─────────────────────────────────────────────────────────────

function updateStreak(lobby, playerId, correct) {
  if (!lobby.streaks)       lobby.streaks       = new Map();
  if (!lobby.bonusCorrects) lobby.bonusCorrects = new Map();
  const old       = lobby.streaks.get(playerId) || 0;
  const newStreak = correct ? old + 1 : 0;
  lobby.streaks.set(playerId, newStreak);
  if (correct && newStreak >= 3) {
    lobby.bonusCorrects.set(playerId, (lobby.bonusCorrects.get(playerId) || 0) + 1);
  }
  return { streak: newStreak, onFire: correct && newStreak === 3 };
}

function streakSnapshot(lobby) {
  const out = {};
  if (!lobby.streaks) return out;
  for (const [id, s] of lobby.streaks) out[id] = s;
  return out;
}

// ── Game flow ──────────────────────────────────────────────────────────────────

// ── Buzz Fun ───────────────────────────────────────────────────────────────────

const BUZZ_FUN_ROUNDS = 30;

function startBuzzFun(lobby) {
  const pool = questionBank.filter(q => (q.game_modes || []).includes('buzz_fun'));
  if (pool.length < 1) {
    io.to(lobby.id).emit('error', { message: 'No Buzz Fun questions available. Add some via the admin panel.' });
    return;
  }

  lobby.status          = 'buzz_fun_question';
  lobby.round           = 0;
  lobby.streaks         = new Map();
  lobby.buzzFirstCorrect = null;
  lobby.buzzAnswerTimes  = new Map();
  lobby.buzzTimerStart   = 0;

  const shuffled = shuffle(pool);
  lobby.questionQueue = shuffled.slice(0, Math.min(BUZZ_FUN_ROUNDS, shuffled.length));
  lobby.questionIdx   = -1;

  for (const p of lobby.players.values()) { p.score = 0; p.alive = true; p.lives = 3; }

  io.to(lobby.id).emit('game_start', { gameMode: 'buzz_fun', message: 'Buzz Fun begins!' });
  setTimeout(() => nextBuzzFunQuestion(lobby), 1500);
}

function nextBuzzFunQuestion(lobby) {
  lobby.questionIdx++;
  if (lobby.questionIdx >= lobby.questionQueue.length) { endGame(lobby, 'questions_exhausted'); return; }

  lobby.round++;
  lobby.status            = 'buzz_fun_question';
  lobby.answers.clear();
  lobby.buzzFirstCorrect  = null;
  lobby.buzzAnswerTimes   = new Map();
  lobby.buzzTimerStart    = Date.now();

  const q         = lobby.questionQueue[lobby.questionIdx];
  const timeLimit = 8;

  io.to(lobby.id).emit('new_question', {
    id: q.id, question: q.question, options: q.options,
    round: lobby.round, timeLimit, alivePlayers: lobby.players.size,
    buzz_type: q.buzz_type || 'BUZZWORD',
    totalRounds: lobby.questionQueue.length,
  });

  lobby.timerEnd = Date.now() + timeLimit * 1000;
  lobby.timer    = setTimeout(() => processBuzzFunAnswers(lobby), timeLimit * 1000);
  scheduleBotAnswers(lobby, q, timeLimit);
}

function processBuzzFunAnswers(lobby) {
  if (lobby.status !== 'buzz_fun_question') return;
  clearTimer(lobby);
  lobby.status = 'buzz_fun_reviewing';

  const q       = lobby.questionQueue[lobby.questionIdx];
  const results = [];

  for (const player of lobby.players.values()) {
    const answer     = lobby.answers.get(player.id);
    const correct    = answer === q.correct;
    const answerTime = lobby.buzzAnswerTimes.get(player.id) ?? null;

    let pointsEarned = 0;
    if (correct) {
      pointsEarned = 100;
      if (answerTime !== null) {
        const speedBonus = Math.round(50 * Math.max(0, 1 - answerTime / 8000));
        pointsEarned += speedBonus;
      }
      if (lobby.buzzFirstCorrect === player.id) pointsEarned += 50;
      player.score += pointsEarned;
    }

    const sr = updateStreak(lobby, player.id, correct);
    results.push({ id: player.id, username: player.username, answered: answer !== undefined, correct, lives: 3, alive: true, streak: sr.streak });

    const sock = io.sockets.sockets.get(player.id);
    if (sock) sock.emit('answer_result', {
      correct, correctAnswer: q.correct, lives: 3, alive: true,
      score: player.score, explanation: lobby.difficulty === 'hard' ? '' : (q.explanation || ''),
      streak: sr.streak, onFire: sr.onFire, pointsEarned,
    });
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: 3, score: p.score, alive: true,
    streak: lobby.streaks?.get(p.id) || 0,
  }));

  io.to(lobby.id).emit('round_results', {
    results, correctAnswer: q.correct, explanation: lobby.difficulty === 'hard' ? '' : (q.explanation || ''), eliminated: [], players: snapshot,
  });

  if (lobby.questionIdx >= lobby.questionQueue.length - 1) {
    setTimeout(() => endGame(lobby, 'questions_exhausted'), 4500);
    return;
  }
  setTimeout(() => nextBuzzFunQuestion(lobby), 4500);
}

function startGame(lobby) {
  if (lobby.gameMode === 'speed_race')     return startSpeedRace(lobby);
  if (lobby.gameMode === 'trivia_pursuit') return startTriviaPursuit(lobby);
  if (lobby.gameMode === 'buzz_fun')       return startBuzzFun(lobby);

  // ── Battle Royale & Scan Master ────────────────────────────────────────────
  // Guard: Scan Master needs image questions
  if (lobby.gameMode === 'scan_master') {
    const imagePool = questionBank.filter(q => q.image_url && (q.game_modes || []).includes('scan_master'));
    if (imagePool.length < 1) {
      io.to(lobby.id).emit('error', { message: 'No image questions available yet. Add some via the admin panel.' });
      return;
    }
  }

  lobby.status        = 'question';
  lobby.round         = 0;
  lobby.correctCounts = new Map();
  lobby.streaks       = new Map();
  lobby.bonusCorrects = new Map();
  lobby.suddenDeath   = false;
  assignPowerups(lobby);

  let pool;
  if (lobby.gameMode === 'scan_master') {
    pool = questionBank.filter(q => q.image_url && (q.game_modes || []).includes('scan_master'));
  } else {
    const brPool = questionBank.filter(q => (q.game_modes || ['battle_royale']).includes('battle_royale'));
    const raw = lobby.subject === 'all'
      ? brPool
      : brPool.filter(q => q.subject === lobby.subject);
    pool = raw.length >= 5 ? raw : brPool;
  }
  lobby.questionQueue = shuffle(pool);
  lobby.questionIdx   = -1;

  const lives = gameSettings.startingLives;
  for (const p of lobby.players.values()) {
    p.lives = lives; p.score = 0; p.alive = true;
  }

  io.to(lobby.id).emit('game_start', { gameMode: lobby.gameMode, message: 'Battle begins!' });
  for (const [pid, pups] of lobby.playerPowerups) {
    const sock = io.sockets.sockets.get(pid);
    if (sock) sock.emit('powerup_assigned', { powerups: pups });
  }
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
  if (lobby.usedPowerupThisQ) lobby.usedPowerupThisQ.clear();
  if (lobby.frozenPlayers)   lobby.frozenPlayers.clear();

  const q         = lobby.questionQueue[lobby.questionIdx];
  const timeLimit = lobby.suddenDeath ? 5
    : lobby.gameMode === 'scan_master' ? 25
    : lobby.difficulty === 'hard' ? 10
    : gameSettings.timerDuration;

  io.to(lobby.id).emit('new_question', {
    id: q.id, question: q.question, options: q.options,
    round: lobby.round, timeLimit, alivePlayers: alive.length,
    suddenDeath: lobby.suddenDeath || false,
    image_url: q.image_url || null,
  });

  lobby.timerEnd = Date.now() + timeLimit * 1000;
  lobby.timer    = setTimeout(() => processAnswers(lobby), timeLimit * 1000);
  scheduleBotAnswers(lobby, q, timeLimit);
}

function processAnswers(lobby) {
  if (lobby.status !== 'question') return;
  clearTimer(lobby);
  lobby.status = 'reviewing';

  const q          = lobby.questionQueue[lobby.questionIdx];
  const eliminated = [];
  const results    = [];

  for (const player of lobby.players.values()) {
    if (!player.alive) continue;

    const answer      = lobby.answers.get(player.id);
    const frozenUntil = lobby.frozenPlayers?.get(player.id);
    const isFrozen    = frozenUntil && Date.now() < frozenUntil;
    const isSkip      = answer === '__skip__' || isFrozen;

    let correct = false;
    let streak  = lobby.streaks?.get(player.id) || 0;
    let onFire  = false;

    if (!isSkip) {
      const sr = updateStreak(lobby, player.id, answer === q.correct);
      streak  = sr.streak;
      onFire  = sr.onFire;
      correct = answer === q.correct;
    }

    if (correct && lobby.pendingDoubleXp?.has(player.id)) {
      lobby.powerupXpBonus.set(player.id, (lobby.powerupXpBonus.get(player.id) || 0) + XP_PER_CORRECT);
      lobby.pendingDoubleXp.delete(player.id);
    }

    if (lobby.suddenDeath) {
      if (!correct && !isSkip) {
        player.lives = 0;
        player.alive = false;
        eliminated.push(player.username);
      }
    } else {
      if (correct) {
        player.score += 100;
        lobby.correctCounts.set(player.id, (lobby.correctCounts.get(player.id) || 0) + 1);
      } else if (!isSkip) {
        player.lives = Math.max(0, player.lives - 1);
        if (player.lives === 0) { player.alive = false; eliminated.push(player.username); }
      }
    }

    results.push({
      id: player.id, username: player.username,
      answered: answer !== undefined, correct, lives: player.lives, alive: player.alive,
      streak,
    });

    const sock = io.sockets.sockets.get(player.id);
    if (sock) {
      sock.emit('answer_result', {
        correct, correctAnswer: q.correct,
        lives: player.lives, alive: player.alive,
        score: player.score, explanation: lobby.difficulty === 'hard' ? '' : (q.explanation || ''),
        streak, onFire,
      });
    }
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: p.lives, score: p.score, alive: p.alive,
    streak: lobby.streaks?.get(p.id) || 0,
  }));

  io.to(lobby.id).emit('round_results', {
    results, correctAnswer: q.correct, explanation: lobby.difficulty === 'hard' ? '' : (q.explanation || ''), eliminated, players: snapshot,
  });

  const alive = alivePlayers(lobby);

  if (alive.length <= 1) {
    setTimeout(() => endGame(lobby, 'last_standing'), lobby.suddenDeath ? 4000 : 14000);
    return;
  }

  // Trigger sudden death when exactly 2 players remain for the first time
  if (alive.length === 2 && !lobby.suddenDeath) {
    lobby.suddenDeath = true;
    // Emit announcement after round results have been shown, then give 3s for the screen
    setTimeout(() => io.to(lobby.id).emit('sudden_death'), 14000);
    setTimeout(() => nextQuestion(lobby), 17000);
    return;
  }

  setTimeout(() => nextQuestion(lobby), lobby.suddenDeath ? 4500 : 14500);
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
    gameMode: lobby.gameMode,
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
    const bonusCorrects = lobby.bonusCorrects?.get(player.id) || 0;
    const powerupBonus  = lobby.powerupXpBonus?.get(player.id) || 0;
    const totalXp   = baseXp + correctCount * XP_PER_CORRECT + bonusCorrects * XP_PER_CORRECT + powerupBonus;

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
        game_mode:       lobby.gameMode || 'battle_royale',
        placement,
        xp_earned:       totalXp,
        correct_answers: correctCount,
        total_questions: lobby.questionIdx + 1,
      });

      // Update subject mastery
      if (lobby.subject !== 'all') {
        await upsertMastery(sock.userId, lobby.subject, lobby.questionIdx + 1, correctCount);
      }

      // Update quest progress
      await updateQuestProgress(sock.userId, 'play_game', 1);
      if (correctCount > 0) {
        await updateQuestProgress(sock.userId, 'correct_answer', correctCount);
      }
      if (isWinner && lobby.gameMode === 'battle_royale') {
        await updateQuestProgress(sock.userId, 'win_battle_royale', 1);
      }
      if (isWinner && lobby.gameMode === 'speed_race') {
        await updateQuestProgress(sock.userId, 'win_speed_race', 1);
      }
      await updateQuestProgress(sock.userId, 'game_mode', 1);

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
const SPEED_RACE_Q_TIME  = 10;             // seconds per question

function emitRaceProgress(lobby) {
  const progress = [...lobby.players.values()].map(p => ({
    id:       p.id,
    username: p.username,
    correct:  lobby.raceCorrects.get(p.id) || 0,
    streak:   lobby.streaks?.get(p.id) || 0,
    finished: lobby.raceFinishedOrder.includes(p.id),
    position: lobby.raceFinishedOrder.includes(p.id)
                ? lobby.raceFinishedOrder.indexOf(p.id) + 1 : null,
  }));
  io.to(lobby.id).emit('race_progress', { progress, goal: SPEED_RACE_GOAL });
}

function startSpeedRace(lobby) {
  lobby.status            = 'speed_race';
  lobby.raceCorrects      = new Map();
  lobby.raceFinishedOrder = [];
  lobby.speedPlayers      = new Map(); // playerId → { idx, timer, botTimer, finished }
  lobby.streaks           = new Map();
  lobby.bonusCorrects     = new Map();
  assignPowerups(lobby);

  for (const p of lobby.players.values()) {
    lobby.raceCorrects.set(p.id, 0);
    p.lives = 3; p.score = 0; p.alive = true;
    lobby.speedPlayers.set(p.id, { idx: 0, timer: null, botTimer: null, finished: false, timerEnd: 0, usedPowerupThisQ: false });
  }

  const srBank = questionBank.filter(q => (q.game_modes || ['speed_race']).includes('speed_race'));
  const pool = lobby.subject === 'all'
    ? srBank
    : srBank.filter(q => q.subject === lobby.subject);
  lobby.questionQueue = shuffle(pool.length >= 5 ? pool : srBank);

  io.to(lobby.id).emit('game_start', { gameMode: 'speed_race' });
  for (const [pid, pups] of lobby.playerPowerups) {
    const sock = io.sockets.sockets.get(pid);
    if (sock) sock.emit('powerup_assigned', { powerups: pups });
  }

  lobby.raceTimer = setTimeout(() => {
    if (lobby.status === 'speed_race') endSpeedRace(lobby, 'time_up');
  }, SPEED_RACE_TIMEOUT);

  setTimeout(() => {
    for (const p of lobby.players.values()) sendSpeedQuestion(lobby, p.id);
    emitRaceProgress(lobby);
  }, 1500);
}

function sendSpeedQuestion(lobby, playerId) {
  if (lobby.status !== 'speed_race') return;
  const player = lobby.players.get(playerId);
  const state  = lobby.speedPlayers?.get(playerId);
  if (!player || !state || state.finished) return;

  const q         = lobby.questionQueue[state.idx % lobby.questionQueue.length];
  const timeLimit = SPEED_RACE_Q_TIME;

  if (!player.isBot) {
    const sock = io.sockets.sockets.get(playerId);
    if (sock) {
      sock.emit('new_question', {
        id: q.id, question: q.question, options: q.options,
        round: state.idx + 1, timeLimit, alivePlayers: lobby.players.size,
      });
    }
  }

  clearTimeout(state.timer);
  state.timerEnd         = Date.now() + timeLimit * 1000;
  state.usedPowerupThisQ = false;
  state.timer            = setTimeout(() => advanceSpeedPlayer(lobby, playerId, null), timeLimit * 1000);

  if (player.isBot) {
    clearTimeout(state.botTimer);
    const delay = botReactionDelay(player.difficulty, timeLimit);
    state.botTimer = setTimeout(() => {
      const correct = Math.random() < BOT_ACCURACY[player.difficulty];
      advanceSpeedPlayer(lobby, playerId, correct ? q.correct : randomWrongAnswer(q.correct));
    }, delay);
  }
}

function advanceSpeedPlayer(lobby, playerId, answer) {
  if (lobby.status !== 'speed_race') return;
  const player = lobby.players.get(playerId);
  const state  = lobby.speedPlayers?.get(playerId);
  if (!player || !state || state.finished) return;

  clearTimeout(state.timer);
  clearTimeout(state.botTimer);
  state.timer = null;
  state.botTimer = null;

  const q      = lobby.questionQueue[state.idx % lobby.questionQueue.length];
  const isSkip = answer === '__skip__';
  const correct = !isSkip && answer !== null && answer === q.correct;
  const { streak, onFire } = isSkip
    ? { streak: lobby.streaks?.get(playerId) || 0, onFire: false }
    : updateStreak(lobby, playerId, answer !== null && answer === q.correct);

  if (correct) {
    if (lobby.pendingDoubleXp?.has(playerId)) {
      lobby.powerupXpBonus.set(playerId, (lobby.powerupXpBonus.get(playerId) || 0) + XP_PER_CORRECT);
      lobby.pendingDoubleXp.delete(playerId);
    }
    const n = (lobby.raceCorrects.get(playerId) || 0) + 1;
    lobby.raceCorrects.set(playerId, n);
    player.score = n;

    if (n >= SPEED_RACE_GOAL && !lobby.raceFinishedOrder.includes(playerId)) {
      lobby.raceFinishedOrder.push(playerId);
      state.finished = true;
      emitRaceProgress(lobby);
      setTimeout(() => endSpeedRace(lobby, 'goal_reached'), 500);
      return;
    }
  }

  if (!player.isBot) {
    const sock = io.sockets.sockets.get(playerId);
    if (sock) {
      sock.emit('answer_result', {
        correct, correctAnswer: q.correct,
        lives: 3, alive: true,
        score: lobby.raceCorrects.get(playerId) || 0,
        streak, onFire,
      });
    }
  }

  emitRaceProgress(lobby);
  state.idx++;
  setTimeout(() => sendSpeedQuestion(lobby, playerId), 150);
}

function endSpeedRace(lobby, reason) {
  if (lobby.status === 'game_over') return;
  lobby.status = 'game_over';

  if (lobby.speedPlayers) {
    for (const state of lobby.speedPlayers.values()) {
      clearTimeout(state.timer);
      clearTimeout(state.botTimer);
    }
  }
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

// ── Trivia Pursuit (Board Game) ──────────────────────────────────────────────

const TRIVIA_CATS      = ['cardiology','neurology','pharmacology','microbiology','biochemistry','biostatistics'];
const TRIVIA_Q_TIME    = 20;
const TRIVIA_BOARD_SIZE = 36;

// 6 sectors × 6 spaces; sector i starts with HQ for TRIVIA_CATS[i]
const TRIVIA_BOARD = (() => {
  const b = [];
  for (let s = 0; s < 6; s++)
    for (let i = 0; i < 6; i++)
      b.push({ category: TRIVIA_CATS[(s + i) % 6], isHQ: i === 0 });
  return b;
})();

// ── Bot system ────────────────────────────────────────────────────────────────

const BOT_NAMES = [
  'Dr. Neural', 'Dr. Cortex', 'Dr. Synapse', 'Dr. Axon',
  'Dr. Dendrite', 'Dr. Medulla', 'Dr. Thalamus', 'Dr. Hypothalamus',
  'Dr. Cerebrum', 'Dr. Ventricle', 'Dr. Cochlea', 'Dr. Retina',
];

const BOT_ACCURACY = { easy: 0.40, medium: 0.65, hard: 0.85, expert: 0.95 };

// Reaction time [minMs, maxMs] — capped to (timeLimit - 500ms) at call site
const BOT_REACTION_MS = {
  easy:   [12000, 18000],
  medium: [8000,  14000],
  hard:   [3000,  8000],
  expert: [1000,  3000],
};

function randomWrongAnswer(correct) {
  const opts = ['A', 'B', 'C', 'D'].filter(o => o !== correct);
  return opts[Math.floor(Math.random() * opts.length)];
}

function botReactionDelay(difficulty, timeLimitSec) {
  const [minMs, maxMs] = BOT_REACTION_MS[difficulty] || [5000, 10000];
  const raw = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return Math.min(raw, (timeLimitSec - 0.6) * 1000);
}

function scheduleBotAnswers(lobby, q, timeLimitSec) {
  const bots = [...lobby.players.values()].filter(p => p.isBot && p.alive);
  for (const bot of bots) {
    const delay = botReactionDelay(bot.difficulty, timeLimitSec);
    setTimeout(() => {
      if (lobby.status !== 'question') return;
      if (lobby.answers.has(bot.id)) return;
      const correct    = Math.random() < BOT_ACCURACY[bot.difficulty];
      const botAnswer  = correct ? q.correct : randomWrongAnswer(q.correct);
      lobby.answers.set(bot.id, botAnswer);
      // In sudden death a wrong answer triggers immediate processing
      if (lobby.suddenDeath && !correct) {
        clearTimer(lobby);
        setTimeout(() => processAnswers(lobby), 200);
        return;
      }
      const alive        = alivePlayers(lobby);
      const answeredCount = [...lobby.answers.keys()].filter(id => lobby.players.get(id)?.alive).length;
      io.to(lobby.id).emit('answer_count', { answered: answeredCount, total: alive.length });
      if (answeredCount >= alive.length) { clearTimer(lobby); setTimeout(() => processAnswers(lobby), 600); }
    }, delay);
  }
}


function triviaWedgeSnapshot(lobby) {
  const state = {};
  if (!lobby.triviaWedges) return state;
  for (const [sid, ws] of lobby.triviaWedges) {
    const p = lobby.players.get(sid);
    if (p) state[sid] = { username: p.username, wedges: [...ws] };
  }
  return state;
}

function triviaPositionSnapshot(lobby) {
  const pos = {};
  if (!lobby.triviaPositions) return pos;
  for (const [sid, position] of lobby.triviaPositions) pos[sid] = position;
  return pos;
}

function buildTurnPayload(lobby) {
  const order = lobby.triviaPlayerOrder;
  return {
    currentPlayerId: lobby.triviaCurrentPlayerId,
    currentUsername: lobby.players.get(lobby.triviaCurrentPlayerId)?.username || '?',
    round:       lobby.round,
    wedgeState:  triviaWedgeSnapshot(lobby),
    positions:   triviaPositionSnapshot(lobby),
    playerOrder: order.map(id => {
      const p = lobby.players.get(id);
      return { id, username: p?.username || '?' };
    }),
  };
}

function startTriviaPursuit(lobby) {
  lobby.status             = 'trivia_roll';
  lobby.round              = 0;
  lobby.triviaWedges       = new Map();
  lobby.triviaPositions    = new Map();
  lobby.triviaTurnIdx      = 0;
  lobby.triviaCurrentPlayerId  = null;
  lobby.triviaCurrentCategory  = null;
  lobby.triviaCurrentQuestion  = null;
  lobby.triviaIsHQ             = false;
  lobby.triviaCanEarnWedge     = false;
  lobby.triviaIsFinalQuestion  = false;
  lobby.streaks                = new Map();
  lobby.bonusCorrects          = new Map();

  const players = [...lobby.players.values()];
  lobby.triviaPlayerOrder = shuffle(players.map(p => p.id));

  for (const p of players) {
    lobby.triviaWedges.set(p.id, new Set());
    lobby.triviaPositions.set(p.id, 0);
    p.lives = 3; p.score = 0; p.alive = true;
  }

  io.to(lobby.id).emit('game_start', { gameMode: 'trivia_pursuit' });
  setTimeout(() => nextTriviaTurn(lobby), 1500);
}

function nextTriviaTurn(lobby) {
  if (lobby.status === 'game_over') return;

  lobby.round++;
  lobby.answers = new Map();
  lobby.triviaIsFinalQuestion = false;

  const order  = lobby.triviaPlayerOrder;
  const sid    = order[lobby.triviaTurnIdx % order.length];
  const player = lobby.players.get(sid);

  if (!player) {
    lobby.triviaTurnIdx++;
    setTimeout(() => nextTriviaTurn(lobby), 200);
    return;
  }

  lobby.triviaCurrentPlayerId = sid;

  // If player already has all wedges → send final question
  const playerWedges = lobby.triviaWedges.get(sid) || new Set();
  if (playerWedges.size >= TRIVIA_CATS.length) {
    lobby.status            = 'trivia_question';
    lobby.triviaIsFinalQuestion = true;

    io.to(lobby.id).emit('trivia_turn', { ...buildTurnPayload(lobby), phase: 'final_question' });

    setTimeout(() => {
      if (lobby.status !== 'trivia_question') return;
      const q = questionBank[Math.floor(Math.random() * questionBank.length)];
      lobby.triviaCurrentQuestion = q;
      lobby.triviaCurrentCategory = q.subject;
      lobby.triviaCanEarnWedge    = false;

      io.to(lobby.id).emit('trivia_question', {
        question: { id: q.id, question: q.question, options: q.options },
        category: q.subject, isHQ: false, canEarnWedge: false,
        isFinalQuestion: true, round: lobby.round, timeLimit: TRIVIA_Q_TIME,
        wedgeState: triviaWedgeSnapshot(lobby),
      });
      if (player?.isBot) {
        lobby.timer = setTimeout(() => {
          if (lobby.status !== 'trivia_question') return;
          const correct = Math.random() < BOT_ACCURACY[player.difficulty];
          processTriviaAnswer(lobby, correct ? q.correct : randomWrongAnswer(q.correct));
        }, botReactionDelay(player.difficulty, TRIVIA_Q_TIME));
      } else {
        lobby.timer = setTimeout(() => processTriviaAnswer(lobby, null), TRIVIA_Q_TIME * 1000);
      }
    }, 1500);
    return;
  }

  // Regular roll turn
  lobby.status = 'trivia_roll';
  io.to(lobby.id).emit('trivia_turn', { ...buildTurnPayload(lobby), phase: 'roll' });

  if (player.isBot) {
    // Bot auto-rolls after a short dramatic pause
    lobby.timer = setTimeout(() => {
      if (lobby.status !== 'trivia_roll') return;
      handleTriviaRoll(lobby);
    }, 1200 + Math.floor(Math.random() * 1300));
  } else {
    // Auto-skip if human player goes idle for 30s
    lobby.timer = setTimeout(() => {
      if (lobby.status !== 'trivia_roll') return;
      lobby.triviaTurnIdx++;
      setTimeout(() => nextTriviaTurn(lobby), 300);
    }, 30000);
  }
}

function handleTriviaRoll(lobby) {
  clearTimer(lobby);
  if (lobby.status !== 'trivia_roll') return;

  const dice   = Math.floor(Math.random() * 6) + 1;
  const sid    = lobby.triviaCurrentPlayerId;
  const oldPos = lobby.triviaPositions?.get(sid) ?? 0;
  const newPos = (oldPos + dice) % TRIVIA_BOARD_SIZE;

  lobby.triviaPositions.set(sid, newPos);
  lobby.status = 'trivia_question';

  const space = TRIVIA_BOARD[newPos];
  lobby.triviaCurrentCategory = space.category;
  lobby.triviaIsHQ            = space.isHQ;

  const playerWedges   = lobby.triviaWedges.get(sid) || new Set();
  const canEarnWedge   = space.isHQ && !playerWedges.has(space.category);
  lobby.triviaCanEarnWedge = canEarnWedge;

  io.to(lobby.id).emit('trivia_rolled', {
    currentPlayerId: sid, dice, oldPosition: oldPos, newPosition: newPos,
    category: space.category, isHQ: space.isHQ, canEarnWedge,
    positions: triviaPositionSnapshot(lobby),
  });

  // Send question after movement animation
  setTimeout(() => {
    if (lobby.status !== 'trivia_question') return;
    const tpBank = questionBank.filter(q => (q.game_modes || ['trivia_pursuit']).includes('trivia_pursuit'));
    const pool = tpBank.filter(q => q.subject === space.category);
    const q    = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : tpBank[Math.floor(Math.random() * tpBank.length)];
    lobby.triviaCurrentQuestion = q;

    io.to(lobby.id).emit('trivia_question', {
      question: { id: q.id, question: q.question, options: q.options },
      category: space.category, isHQ: space.isHQ, canEarnWedge,
      isFinalQuestion: false, round: lobby.round, timeLimit: TRIVIA_Q_TIME,
      wedgeState: triviaWedgeSnapshot(lobby),
    });
    const botP = lobby.players.get(sid);
    if (botP?.isBot) {
      lobby.timer = setTimeout(() => {
        if (lobby.status !== 'trivia_question') return;
        const correct = Math.random() < BOT_ACCURACY[botP.difficulty];
        processTriviaAnswer(lobby, correct ? q.correct : randomWrongAnswer(q.correct));
      }, botReactionDelay(botP.difficulty, TRIVIA_Q_TIME));
    } else {
      lobby.timer = setTimeout(() => processTriviaAnswer(lobby, null), TRIVIA_Q_TIME * 1000);
    }
  }, 1800);
}

function processTriviaAnswer(lobby, answer) {
  clearTimer(lobby);
  if (lobby.status !== 'trivia_question') return;

  const { triviaCurrentPlayerId: sid, triviaCurrentCategory: category,
          triviaCurrentQuestion: q,   triviaCanEarnWedge: canEarnWedge,
          triviaIsFinalQuestion: isFinalQuestion, triviaIsHQ: isHQ } = lobby;

  if (!q) { lobby.triviaTurnIdx++; setTimeout(() => nextTriviaTurn(lobby), 300); return; }

  const correct   = answer !== null && answer === q.correct;
  let earnedWedge = false;

  const { streak, onFire } = updateStreak(lobby, sid, correct);

  if (correct && canEarnWedge) {
    const wedges = lobby.triviaWedges.get(sid);
    if (wedges && !wedges.has(category)) {
      wedges.add(category);
      earnedWedge = true;
      const p = lobby.players.get(sid);
      if (p) p.score = wedges.size;
    }
  }

  const wedgeState   = triviaWedgeSnapshot(lobby);
  const playerWedges = lobby.triviaWedges.get(sid);
  const allWedges    = playerWedges && playerWedges.size >= TRIVIA_CATS.length;

  lobby.status = 'trivia_result';

  io.to(lobby.id).emit('trivia_answer_result', {
    playerId: sid, correct, correctAnswer: q.correct, explanation: q.explanation,
    earnedWedge, category, isHQ, canEarnWedge, isFinalQuestion, allWedges, wedgeState,
    streak, onFire, streaks: streakSnapshot(lobby),
  });

  if (correct && isFinalQuestion) {
    setTimeout(() => endTriviaPursuit(lobby, sid), 3000);
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
  const winner    = winPlayer ? { username: winPlayer.username, score: TRIVIA_CATS.length } : null;

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

  socket.on('create_lobby', ({ username, subject = 'all', gameMode = 'battle_royale', difficulty = 'easy', clanTag = null, isGuest = false }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    const lobby = makeLobby(socket.id, subject, gameMode, difficulty);
    lobby.players.set(socket.id, {
      id: socket.id, username: name, clanTag: clanTag || null, isGuest: Boolean(isGuest), lives: gameSettings.startingLives, score: 0, alive: true,
    });
    socket.lobbyId = lobby.id;
    socket.join(lobby.id);
    registeredPlayers.add(name.toLowerCase());

    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
    console.log(`Lobby ${lobby.id} created by ${name}`);
  });

  socket.on('join_lobby', ({ username, lobbyId, clanTag = null, isGuest = false }, ack) => {
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
      id: socket.id, username: name, clanTag: clanTag || null, isGuest: Boolean(isGuest), lives: gameSettings.startingLives, score: 0, alive: true,
    });
    socket.lobbyId = lobby.id;
    socket.join(lobby.id);
    registeredPlayers.add(name.toLowerCase());

    ack({ ok: true, lobbyId: lobby.id });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
    console.log(`${name} joined lobby ${lobby.id}`);
  });

  socket.on('quick_join', ({ username, gameMode = 'battle_royale', clanTag = null, isGuest = false }, ack) => {
    const name = (username ?? '').trim().slice(0, 20);
    if (!name) return ack({ ok: false, error: 'Username required.' });

    // Find best open lobby: same mode, waiting, open to quick join, no username clash
    const candidates = [...lobbies.values()]
      .filter(l =>
        l.status === 'waiting' &&
        l.openToQuickJoin !== false &&
        l.gameMode === gameMode &&
        l.players.size >= 1 &&
        ![...l.players.values()].some(p => p.username.toLowerCase() === name.toLowerCase())
      )
      .sort((a, b) => b.players.size - a.players.size);

    if (candidates.length > 0) {
      const lobby = candidates[0];
      lobby.players.set(socket.id, {
        id: socket.id, username: name, clanTag: clanTag || null, isGuest: Boolean(isGuest),
        lives: gameSettings.startingLives, score: 0, alive: true,
      });
      socket.lobbyId = lobby.id;
      socket.join(lobby.id);
      registeredPlayers.add(name.toLowerCase());
      ack({ ok: true, lobbyId: lobby.id, subject: lobby.subject, created: false });
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
      console.log(`${name} quick-joined lobby ${lobby.id}`);
      return;
    }

    // No open lobby — create a new one
    const lobby = makeLobby(socket.id, 'all', gameMode);
    lobby.players.set(socket.id, {
      id: socket.id, username: name, clanTag: clanTag || null, isGuest: Boolean(isGuest),
      lives: gameSettings.startingLives, score: 0, alive: true,
    });
    socket.lobbyId = lobby.id;
    socket.join(lobby.id);
    registeredPlayers.add(name.toLowerCase());
    ack({ ok: true, lobbyId: lobby.id, subject: 'all', created: true });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
    console.log(`${name} quick-join: no open lobby, created ${lobby.id}`);
  });

  socket.on('toggle_quick_join', ({ open }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby || lobby.hostId !== socket.id || lobby.status !== 'waiting') return;
    lobby.openToQuickJoin = Boolean(open);
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
  });

  socket.on('use_powerup', ({ type, targetId }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;

    const powerups = lobby.playerPowerups?.get(socket.id);
    if (!powerups || !powerups.includes(type)) return;

    const isSpeedRace    = lobby.status === 'speed_race';
    const isBattleRoyale = lobby.status === 'question';
    if (!isSpeedRace && !isBattleRoyale) return;

    // Freeze is BR-only
    if (type === 'freeze' && !isBattleRoyale) return;

    // One powerup per question
    if (isSpeedRace) {
      const state = lobby.speedPlayers?.get(socket.id);
      if (!state || state.usedPowerupThisQ) return;
      state.usedPowerupThisQ = true;
    } else {
      if (!lobby.usedPowerupThisQ) lobby.usedPowerupThisQ = new Set();
      if (lobby.usedPowerupThisQ.has(socket.id)) return;
      lobby.usedPowerupThisQ.add(socket.id);
    }

    // Consume powerup
    const idx = powerups.indexOf(type);
    powerups.splice(idx, 1);

    if (type === '50_50') {
      let q;
      if (isSpeedRace) {
        const state = lobby.speedPlayers?.get(socket.id);
        if (!state) return;
        q = lobby.questionQueue[state.idx % lobby.questionQueue.length];
      } else {
        q = lobby.questionQueue[lobby.questionIdx];
      }
      const wrong  = ['A', 'B', 'C', 'D'].filter(o => o !== q.correct);
      const hidden = shuffle(wrong).slice(0, 2);
      socket.emit('powerup_result', { type: '50_50', hiddenOptions: hidden });

    } else if (type === 'extra_time') {
      const bonus = 10;
      socket.emit('powerup_result', { type: 'extra_time', bonusSeconds: bonus });
      if (isBattleRoyale && lobby.timerEnd) {
        clearTimeout(lobby.timer);
        lobby.timerEnd += bonus * 1000;
        const remaining = lobby.timerEnd - Date.now();
        if (remaining > 0) lobby.timer = setTimeout(() => processAnswers(lobby), remaining);
      } else if (isSpeedRace) {
        const state = lobby.speedPlayers?.get(socket.id);
        if (state && state.timerEnd) {
          clearTimeout(state.timer);
          state.timerEnd += bonus * 1000;
          const remaining = state.timerEnd - Date.now();
          if (remaining > 0) state.timer = setTimeout(() => advanceSpeedPlayer(lobby, socket.id, null), remaining);
        }
      }

    } else if (type === 'skip') {
      socket.emit('powerup_result', { type: 'skip' });
      if (isSpeedRace) {
        advanceSpeedPlayer(lobby, socket.id, '__skip__');
      } else {
        const player = lobby.players.get(socket.id);
        if (player?.alive && !lobby.answers.has(socket.id)) {
          lobby.answers.set(socket.id, '__skip__');
          const alive = alivePlayers(lobby);
          const answeredCount = [...lobby.answers.keys()].filter(id => lobby.players.get(id)?.alive).length;
          io.to(lobby.id).emit('answer_count', { answered: answeredCount, total: alive.length });
          if (answeredCount >= alive.length) { clearTimer(lobby); setTimeout(() => processAnswers(lobby), 600); }
        }
      }

    } else if (type === 'freeze') {
      if (!targetId) return;
      const target = lobby.players.get(targetId);
      if (!target?.alive) return;
      if (!lobby.frozenPlayers) lobby.frozenPlayers = new Map();
      lobby.frozenPlayers.set(targetId, Date.now() + 5000);
      const targetSock = io.sockets.sockets.get(targetId);
      if (targetSock) targetSock.emit('frozen', { duration: 5000 });
      socket.emit('powerup_result', { type: 'freeze', targetUsername: target.username });
      setTimeout(() => {
        if (lobby.frozenPlayers) lobby.frozenPlayers.delete(targetId);
        const ts = io.sockets.sockets.get(targetId);
        if (ts) ts.emit('unfrozen');
      }, 5000);

    } else if (type === 'double_xp') {
      if (!lobby.pendingDoubleXp) lobby.pendingDoubleXp = new Set();
      lobby.pendingDoubleXp.add(socket.id);
      socket.emit('powerup_result', { type: 'double_xp' });
    }
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

    // Reject answer if player is currently frozen
    const frozenUntil = lobby.frozenPlayers?.get(socket.id);
    if (frozenUntil && Date.now() < frozenUntil) return;

    // ── Buzz Fun ───────────────────────────────────────────────────────────
    if (lobby.status === 'buzz_fun_question') {
      if (lobby.answers.has(socket.id)) return;
      const player = lobby.players.get(socket.id);
      if (!player) return;
      const elapsed = Date.now() - lobby.buzzTimerStart;
      lobby.answers.set(socket.id, answer);
      lobby.buzzAnswerTimes.set(socket.id, elapsed);
      const q = lobby.questionQueue[lobby.questionIdx];
      if (answer === q.correct && !lobby.buzzFirstCorrect) lobby.buzzFirstCorrect = socket.id;
      const answeredCount = lobby.answers.size;
      const totalPlayers  = lobby.players.size;
      io.to(lobby.id).emit('answer_count', { answered: answeredCount, total: totalPlayers });
      if (answeredCount >= totalPlayers) { clearTimer(lobby); setTimeout(() => processBuzzFunAnswers(lobby), 600); }
      return;
    }

    // ── Speed Race ─────────────────────────────────────────────────────────
    if (lobby.status === 'speed_race') {
      advanceSpeedPlayer(lobby, socket.id, answer);
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

    // Sudden death: wrong answer triggers immediate processing
    if (lobby.suddenDeath) {
      const q = lobby.questionQueue[lobby.questionIdx];
      if (answer !== q.correct) {
        clearTimer(lobby);
        setTimeout(() => processAnswers(lobby), 200);
        return;
      }
    }

    const alive = alivePlayers(lobby);
    const answeredCount = [...lobby.answers.keys()]
      .filter(id => lobby.players.get(id)?.alive).length;

    io.to(lobby.id).emit('answer_count', { answered: answeredCount, total: alive.length });

    if (answeredCount >= alive.length) {
      clearTimer(lobby);
      setTimeout(() => processAnswers(lobby), 600);
    }
  });

  socket.on('trivia_roll', () => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby) return;
    if (socket.id !== lobby.triviaCurrentPlayerId) return;
    handleTriviaRoll(lobby);
  });

  socket.on('add_bot', ({ difficulty }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby || lobby.hostId !== socket.id || lobby.status !== 'waiting') return;
    const bots = [...lobby.players.values()].filter(p => p.isBot);
    if (bots.length >= 3) return;
    if (!BOT_ACCURACY[difficulty]) return;

    const usedNames = new Set([...lobby.players.values()].map(p => p.username));
    const available = BOT_NAMES.filter(n => !usedNames.has(`${n} 🤖`));
    if (available.length === 0) return;

    const name  = available[Math.floor(Math.random() * available.length)];
    const botId = `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    lobby.players.set(botId, {
      id: botId, username: `${name} 🤖`, clanTag: null,
      lives: gameSettings.startingLives, score: 0, alive: true,
      isBot: true, difficulty,
    });
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
  });

  socket.on('remove_bot', ({ botId }) => {
    const lobby = lobbies.get(socket.lobbyId);
    if (!lobby || lobby.hostId !== socket.id || lobby.status !== 'waiting') return;
    const bot = lobby.players.get(botId);
    if (!bot?.isBot) return;
    lobby.players.delete(botId);
    io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
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
      const state = lobby.speedPlayers?.get(socket.id);
      if (state) {
        clearTimeout(state.timer);
        clearTimeout(state.botTimer);
        lobby.speedPlayers.delete(socket.id);
      }
      if (lobby.players.size <= 1) endSpeedRace(lobby, 'forfeit');
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
  const subject    = (req.query.subject || 'all').toLowerCase();
  const towerFloor = parseInt(req.query.tower_floor);

  if (!isNaN(towerFloor) && towerFloor >= 1 && towerFloor <= 100) {
    const zoneNum   = Math.ceil(towerFloor / 10);
    const zoneStart = (zoneNum - 1) * 10 + 1;
    const zoneEnd   = zoneNum * 10;
    const towerPool = questionBank.filter(q =>
      Array.isArray(q.game_modes) && q.game_modes.includes('tower') &&
      q.tower_floor >= zoneStart && q.tower_floor <= zoneEnd
    );
    if (towerPool.length >= 3) {
      return res.json({ questions: shuffle(towerPool) });
    }
    // Fallback: serve subject questions when no tower-specific questions exist yet
    const fallback = subject === 'all' ? questionBank : questionBank.filter(q => q.subject === subject);
    return res.json({ questions: shuffle(fallback.length >= 5 ? fallback : questionBank) });
  }

  const pool = subject === 'all'
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

app.put('/auth/username', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

  const { username: newUsername } = req.body;
  if (!newUsername || typeof newUsername !== 'string')
    return res.status(400).json({ error: 'Username required.' });

  const trimmed = newUsername.trim();
  if (trimmed.length < 3 || trimmed.length > 20)
    return res.status(400).json({ error: 'Username must be 3–20 characters.' });
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
    return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });

  try {
    // Use select('*') so the query never fails on a missing column (e.g. last_username_change
    // may not yet exist on older DB deployments — adding it to schema.sql and running
    // the ALTER TABLE migration will unlock the cooldown feature).
    const { data: user, error: userErr } = await supabase
      .from('users').select('*').eq('id', req.userId).single();
    if (userErr || !user) return res.status(404).json({ error: 'User not found.' });

    // 365-day cooldown (only enforced once the last_username_change column exists)
    if (user.last_username_change) {
      const lastChange  = new Date(user.last_username_change);
      const msElapsed   = Date.now() - lastChange.getTime();
      const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
      if (msElapsed < MS_PER_YEAR) {
        const nextChange = new Date(lastChange.getTime() + MS_PER_YEAR);
        return res.status(429).json({
          error: `You can next change your username on ${nextChange.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
          nextChange: nextChange.toISOString(),
        });
      }
    }

    // Same name
    if (trimmed.toLowerCase() === user.username?.toLowerCase())
      return res.status(400).json({ error: 'That is already your username.' });

    // Uniqueness check
    const { data: existing } = await supabase
      .from('users').select('id').ilike('username', trimmed).neq('id', req.userId).maybeSingle();
    if (existing) return res.status(409).json({ error: 'That username is already taken.' });

    // Only stamp last_username_change if the column exists (present in the fetched row)
    const updateData = { username: trimmed };
    if ('last_username_change' in user) {
      updateData.last_username_change = new Date().toISOString();
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
      .select('*')
      .single();
    if (updateErr) return res.status(500).json({ error: updateErr.message });

    res.json({ ok: true, username: updated.username, last_username_change: updated.last_username_change ?? null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

app.get('/api/username/check', async (req, res) => {
  if (!supabase) return res.json({ available: true });
  const raw = String(req.query.username || '').trim();
  if (!raw) return res.status(400).json({ error: 'username required' });
  if (raw.length < 3 || raw.length > 20 || !/^[a-zA-Z0-9_]+$/.test(raw))
    return res.json({ available: false, reason: 'invalid' });
  try {
    const { data } = await supabase.from('users').select('id').ilike('username', raw).maybeSingle();
    res.json({ available: !data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.get('/admin/stats', adminAuth, async (req, res) => {
  const stats = {
    questionsByCategory: {},
    totalQuestions: 0,
    totalGamesPlayed: 0,
    totalPlayersRegistered: 0,
    activeLobbies: lobbies.size,
  };

  // Count questions by category from in-memory bank
  try {
    for (const q of questionBank) {
      stats.questionsByCategory[q.subject] = (stats.questionsByCategory[q.subject] || 0) + 1;
    }
    stats.totalQuestions = questionBank.length;
  } catch (err) {
    console.error('[Admin Stats] Questions count error:', err.message);
  }

  // Query Supabase for accurate database stats
  if (supabase) {
    // Get total users count
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (!error && count !== null) {
        stats.totalPlayersRegistered = count;
      }
    } catch (err) {
      console.error('[Admin Stats] Users count error:', err.message);
    }

    // Get total games played
    try {
      const { count, error } = await supabase
        .from('game_history')
        .select('id', { count: 'exact', head: true });

      if (!error && count !== null) {
        stats.totalGamesPlayed = count;
      }
    } catch (err) {
      console.error('[Admin Stats] Games count error:', err.message);
    }

    // If questions not loaded in memory, try loading from Supabase
    if (stats.totalQuestions === 0) {
      try {
        const { count, error } = await supabase
          .from('questions')
          .select('question_id', { count: 'exact', head: true });

        if (!error && count !== null) {
          stats.totalQuestions = count;
        }
      } catch (err) {
        console.error('[Admin Stats] Questions DB count error:', err.message);
      }
    }
  } else {
    // Fallback to in-memory stats if Supabase not available
    stats.totalGamesPlayed = totalGamesPlayed;
    stats.totalPlayersRegistered = registeredPlayers.size;
  }

  res.json(stats);
});

app.get('/admin/settings', adminAuth, (req, res) => res.json(gameSettings));

app.post('/admin/settings', adminAuth, async (req, res) => {
  console.log('[admin/settings] Received settings update:', req.body);
  const b = req.body;
  // Legacy compat
  if (b.hardModeEnabled !== undefined) gameSettings.hardModeEnabled = Boolean(b.hardModeEnabled);
  if (b.step2Enabled    !== undefined) gameSettings.step2Enabled    = Boolean(b.step2Enabled);
  if (b.timerDuration   !== undefined) gameSettings.timerDuration   = Math.max(5, Math.min(60, Number(b.timerDuration)));
  if (b.startingLives   !== undefined) gameSettings.startingLives   = Math.max(1, Math.min(10, Number(b.startingLives)));
  // Numeric fields
  const numFields = [
    'timerDefault','timerSpeedRace','timerTriviaPursuit','timerScanMaster','explanationTime',
    'speedRaceQuestions','battleRoyaleMaxQ','minQuestionsPerCategory',
    'battleRoyaleLives','suddenDeathTrigger','suddenDeathTimer','towerFloorLives','bossTolerance',
    'maxPlayersPerLobby','minPlayersToStart','maxBotsPerLobby','lobbyAutoStart',
    'xpFirst','xpSecond','xpThird','xpOther','xpPerCorrect','xpDailyChallenge','xpPerLevel','streakBonusMultiplier',
    'maxConcurrentLobbies',
    'towerQuestionsNormal','towerQuestionsChallenge','towerQuestionsBoss','towerQuestionTimer',
    'towerXpNormal','towerXpChallenge','towerXpBoss','towerXpPerfectBonus','towerXpZoneBonus',
    'towerTotalFloors','towerChallengeInterval','towerBossInterval',
  ];
  // Boolean fields
  const boolFields = [
    'allowGuests','allowQuickJoin',
    'modesBattleRoyale','modesSpeedRace','modesTriviaPursuit','modesScanMaster','modesTower',
    'dailyChallengeEnabled','weeklyTournamentEnabled','powerUpsEnabled',
    'maintenanceMode','showStreakCounter','showPlayerCount','showCorrectAnswer',
    'showGameLeaderboard','soundEffectsEnabled','backgroundMusicEnabled',
    'navbarBlurEnabled','stats_board_visible',
  ];
  for (const k of numFields)  { if (b[k] !== undefined) gameSettings[k] = Number(b[k]); }
  for (const k of boolFields) { if (b[k] !== undefined) gameSettings[k] = Boolean(b[k]); }

  // Stats board numeric settings
  if (b.stats_board_width !== undefined) gameSettings.stats_board_width = Number(b.stats_board_width);
  if (b.stats_board_top !== undefined) gameSettings.stats_board_top = Number(b.stats_board_top);
  if (b.stats_board_opacity !== undefined) gameSettings.stats_board_opacity = Number(b.stats_board_opacity);

  // Stats board position (string: 'left' or 'right')
  if (b.stats_board_position !== undefined) gameSettings.stats_board_position = String(b.stats_board_position);
  if (b.maintenanceMessage !== undefined) gameSettings.maintenanceMessage = String(b.maintenanceMessage).slice(0, 500);
  // Zone names and descriptions
  for (let i = 1; i <= 10; i++) {
    const nk = `towerZone${i}Name`, dk = `towerZone${i}Desc`;
    if (b[nk] !== undefined) gameSettings[nk] = String(b[nk]).slice(0, 100);
    if (b[dk] !== undefined) gameSettings[dk] = String(b[dk]).slice(0, 500);
  }
  // Persist to Supabase so settings survive server restarts
  console.log('[admin/settings] Updated gameSettings, now persisting to DB...');
  console.log('[admin/settings] Stats board settings:', {
    stats_board_width: gameSettings.stats_board_width,
    stats_board_top: gameSettings.stats_board_top,
    stats_board_position: gameSettings.stats_board_position,
    stats_board_opacity: gameSettings.stats_board_opacity,
    stats_board_visible: gameSettings.stats_board_visible,
  });
  const persistErr = await persistSettingsToDB();
  if (persistErr) {
    console.warn('[Settings] Persist error:', persistErr.message);
    return res.status(500).json({ error: 'Settings updated but failed to persist to database: ' + persistErr.message });
  }
  console.log('[admin/settings] Settings persisted successfully');
  res.json(gameSettings);
});

app.post('/admin/reset-leaderboards', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    await supabase.from('users').update({ xp: 0, level: 1 }).not('id', 'is', null);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/admin/reset-tower-progress', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    await supabase.from('users').update({ tower_floor: 1 }).not('id', 'is', null);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/admin/questions', adminAuth, async (req, res) => {
  console.log('[admin/questions] Request received, supabase available:', !!supabase);

  // Always fetch fresh from Supabase for admin panel
  if (supabase) {
    try {
      console.log('[admin/questions] Fetching from Supabase...');
      const { data, error, count } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .order('question_id');

      console.log(`[admin/questions] Supabase response: error=${error?.message || 'none'}, data length=${data?.length || 0}, count=${count}`);

      if (error) {
        console.error('[admin/questions] Supabase error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        // Transform Supabase format to internal format
        questionBank = data.map(q => ({
          id: q.question_id,
          subject: q.category,
          difficulty: q.difficulty || 'easy',
          question: q.question,
          options: q.choices,
          correct: q.correct,
          explanation: q.explanation || '',
          game_modes: q.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
          image_url: q.image_url || undefined,
          tower_floor: q.tower_floor || undefined,
          topic_id: q.topic_id || undefined,
          buzz_type: q.buzz_type || undefined,
          question_type: q.question_type || 'mcq',
          _supabase_id: q.id,
        }));
        questionsLastLoaded = Date.now();
        console.log(`[admin/questions] Fetched ${questionBank.length} questions from Supabase`);
      } else {
        console.log('[admin/questions] No questions found in Supabase - table may be empty');
        // Try to load from local file as fallback
        try {
          const localQuestions = require('./questions');
          if (Array.isArray(localQuestions) && localQuestions.length > 0) {
            console.log(`[admin/questions] Falling back to local file: ${localQuestions.length} questions`);
            questionBank = [...localQuestions];
          } else {
            questionBank = [];
          }
        } catch (e) {
          console.log('[admin/questions] No local questions file available');
          questionBank = [];
        }
      }
    } catch (err) {
      console.error('[admin/questions] Error fetching from Supabase:', err.message, err.code, err.details);
      // Fall back to current cache or local file
      if (questionBank.length === 0) {
        try {
          const localQuestions = require('./questions');
          if (Array.isArray(localQuestions) && localQuestions.length > 0) {
            questionBank = [...localQuestions];
            console.log(`[admin/questions] Using local fallback: ${questionBank.length} questions`);
          }
        } catch (e) {
          console.log('[admin/questions] No local fallback available');
        }
      }
    }
  } else {
    console.log('[admin/questions] Supabase not available, using local file');
    try {
      const localQuestions = require('./questions');
      questionBank = Array.isArray(localQuestions) ? [...localQuestions] : [];
    } catch (e) {
      console.log('[admin/questions] No local questions file');
      questionBank = [];
    }
  }

  console.log(`[admin/questions] returning ${questionBank.length} questions`);
  res.json({ questions: questionBank, _debug: { supabaseAvailable: !!supabase, count: questionBank.length } });
});

app.post('/admin/questions/bulk', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured. Cannot save questions.' });

  const { questions, topic_id, category: defaultCategory, difficulty: defaultDifficulty } = req.body;
  if (!Array.isArray(questions)) return res.status(400).json({ error: 'Expected { questions: [...] }' });

  console.log(`[bulk-import] ═══════════════════════════════════════════════════════════`);
  console.log(`[bulk-import] Starting import of ${questions.length} questions`);
  console.log(`[bulk-import] Defaults: topic_id=${topic_id || 'none'}, category=${defaultCategory || 'none'}, difficulty=${defaultDifficulty || 'none'}`);

  const added = [];
  const updated = [];
  const skipped = [];

  for (let i = 0; i < questions.length; i++) {
    const raw = questions[i];
    console.log(`[bulk-import] ───────────────────────────────────────────────────────────`);
    console.log(`[bulk-import] Q${i + 1} Raw data:`, JSON.stringify({
      hasQuestion: !!raw.question,
      questionPreview: raw.question ? raw.question.substring(0, 50) : null,
      hasOptions: !!raw.options,
      hasChoices: !!raw.choices,
      optionsCount: (raw.options || raw.choices || []).length,
      hasCorrect: !!raw.correct,
      correct: raw.correct,
      hasExplanation: !!raw.explanation,
      category: raw.category || raw.subject,
      difficulty: raw.difficulty,
      hasQuestionId: !!raw.question_id,
    }));

    // ONLY skip if question text is completely missing
    if (!raw.question || typeof raw.question !== 'string' || raw.question.trim() === '') {
      const reason = 'Missing question text (required)';
      console.log(`[bulk-import] Q${i + 1} SKIPPED: ${reason}`);
      skipped.push({ index: i + 1, question: '(no question text)', reason });
      continue;
    }

    // Normalize category - use provided or fall back to default or 'general'
    let subject = raw.subject || raw.category || defaultCategory || 'general';
    subject = subject.toLowerCase().trim();

    // Get options from either field name, accept any array length
    const rawOptions = raw.options || raw.choices || [];
    const options = Array.isArray(rawOptions) && rawOptions.length > 0
      ? rawOptions.map(o => String(o).replace(/^[A-Za-z][.)]\s*/, '').trim())
      : ['Option A', 'Option B', 'Option C', 'Option D']; // Default if no options

    // Use provided difficulty or default
    let difficulty = raw.difficulty || defaultDifficulty || 'medium';
    difficulty = difficulty.toLowerCase().trim();

    // Use provided correct answer or default to 'A'
    const correct = raw.correct || raw.answer || 'A';

    // Use provided explanation or empty string
    const explanation = raw.explanation || raw.rationale || '';

    // Generate question_id if not provided
    const questionId = raw.question_id || raw.id || nextQuestionId(subject);

    // Game modes - use provided or defaults
    const gameModes = Array.isArray(raw.game_modes) && raw.game_modes.length > 0
      ? raw.game_modes
      : (raw.image_url ? ['scan_master'] : ['battle_royale', 'speed_race', 'trivia_pursuit']);

    console.log(`[bulk-import] Q${i + 1} Normalized: category=${subject}, difficulty=${difficulty}, options=${options.length}, correct=${correct}, questionId=${questionId}`);

    // Build record for Supabase
    const record = {
      question_id: questionId,
      question: raw.question.trim(),
      choices: options,
      correct: correct,
      explanation: explanation,
      category: subject,
      difficulty: difficulty,
      game_modes: gameModes,
      image_url: raw.image_url || null,
      tower_floor: (raw.tower_floor != null && !isNaN(parseInt(raw.tower_floor))) ? parseInt(raw.tower_floor) : null,
      buzz_type: (raw.buzz_type && gameModes.includes('buzz_fun')) ? raw.buzz_type : null,
      topic_id: topic_id || raw.topic_id || null,
    };

    try {
      // First check if this exact question text already exists
      const { data: existingByText } = await supabase
        .from('questions')
        .select('question_id, id')
        .eq('question', raw.question.trim())
        .maybeSingle();

      if (existingByText) {
        // Update existing question
        console.log(`[bulk-import] Q${i + 1} Found existing by text: ${existingByText.question_id}`);
        const { data: updatedData, error: updateError } = await supabase
          .from('questions')
          .update({
            choices: options,
            correct: correct,
            explanation: explanation,
            category: subject,
            difficulty: difficulty,
            game_modes: gameModes,
            topic_id: topic_id || raw.topic_id || null,
            image_url: raw.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByText.id)
          .select()
          .single();

        if (updateError) {
          console.log(`[bulk-import] Q${i + 1} Update error: ${updateError.message}`);
          throw updateError;
        }
        console.log(`[bulk-import] Q${i + 1} UPDATED: ${existingByText.question_id}`);
        updated.push({ id: existingByText.question_id, question: raw.question.substring(0, 50) });
        continue;
      }

      // Insert new question
      const { data, error } = await supabase
        .from('questions')
        .insert(record)
        .select()
        .single();

      if (error) {
        console.log(`[bulk-import] Q${i + 1} Insert error: code=${error.code}, message=${error.message}, details=${error.details}`);

        // If duplicate question_id, generate a new one and retry
        if (error.code === '23505' && error.message.includes('question_id')) {
          console.log(`[bulk-import] Q${i + 1} Duplicate question_id, generating new one...`);
          const newId = nextQuestionId(subject) + '_' + Date.now();
          record.question_id = newId;

          const { data: retryData, error: retryError } = await supabase
            .from('questions')
            .insert(record)
            .select()
            .single();

          if (retryError) throw retryError;

          console.log(`[bulk-import] Q${i + 1} ADDED (retry): ${newId}`);
          const newQ = { ...record, id: newId, options, _supabase_id: retryData.id };
          questionBank.push(newQ);
          added.push(newQ);
          continue;
        }
        throw error;
      }

      console.log(`[bulk-import] Q${i + 1} ADDED: ${questionId}`);

      // Also add to in-memory cache
      const newQ = {
        id: questionId,
        subject,
        difficulty: record.difficulty,
        question: record.question,
        options,
        correct: record.correct,
        explanation: record.explanation,
        game_modes: gameModes,
        image_url: record.image_url || undefined,
        tower_floor: record.tower_floor || undefined,
        topic_id: record.topic_id || undefined,
        buzz_type: record.buzz_type || undefined,
        _supabase_id: data.id,
      };
      questionBank.push(newQ);
      added.push(newQ);
    } catch (err) {
      const reason = `Database error: ${err.message || 'Unknown error'}`;
      console.log(`[bulk-import] Q${i + 1} ERROR: ${reason}`);
      skipped.push({ index: i + 1, question: raw.question.substring(0, 50) + '...', reason });
    }
  }

  // Verify by fetching count from Supabase
  let totalCount = 0;
  try {
    const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true });
    totalCount = count || 0;
  } catch (e) {
    console.log(`[bulk-import] Count error: ${e.message}`);
  }

  console.log(`[bulk-import] ═══════════════════════════════════════════════════════════`);
  console.log(`[bulk-import] COMPLETE: Added=${added.length}, Updated=${updated.length}, Skipped=${skipped.length}, Total in DB=${totalCount}`);

  res.json({
    added: added.length,
    updated: updated.length,
    skipped: skipped.length,
    totalInDatabase: totalCount,
    questions: added,
    updatedQuestions: updated.length > 0 ? updated : undefined,
    skippedDetails: skipped.length > 0 ? skipped : undefined,
  });
});

app.post('/admin/upload-image', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured. Cannot upload images.' });
  const { base64, filename, mimeType } = req.body;
  if (!base64 || !filename || !mimeType) return res.status(400).json({ error: 'base64, filename, and mimeType required.' });

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(mimeType)) return res.status(400).json({ error: 'Only JPG, PNG, and WEBP are allowed.' });

  try {
    const b64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer  = Buffer.from(b64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) return res.status(400).json({ error: 'Image must be under 5MB.' });

    const ext        = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const safeName   = filename.replace(/[^a-zA-Z0-9._-]/g, '_').split('.')[0];
    const uniqueName = `${Date.now()}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('question-images')
      .upload(uniqueName, buffer, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('question-images').getPublicUrl(uniqueName);
    res.json({ ok: true, url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Landing Page Images ─────────────────────────────────────────────────────

const LANDING_IMAGE_SLOTS = ['hero_bg', 'battle_royale', 'speed_race', 'tower', 'more_to_come'];

// Public endpoint to fetch all landing images
app.get('/api/landing-images', async (req, res) => {
  if (!supabase) return res.json({ images: {} });
  try {
    const { data, error } = await supabase
      .from('landing_images')
      .select('slot_name, image_url');
    if (error) throw error;
    const images = {};
    (data || []).forEach(row => { images[row.slot_name] = row.image_url; });
    res.json({ images });
  } catch (err) {
    console.error('Error fetching landing images:', err.message);
    res.json({ images: {} });
  }
});

// Public endpoint to fetch landing page settings
app.get('/api/landing-settings', (req, res) => {
  res.json({
    navbarBlurEnabled: gameSettings.navbarBlurEnabled,
    stats_board_width: gameSettings.stats_board_width,
    stats_board_top: gameSettings.stats_board_top,
    stats_board_position: gameSettings.stats_board_position,
    stats_board_opacity: gameSettings.stats_board_opacity,
    stats_board_visible: gameSettings.stats_board_visible,
  });
});

// Admin endpoint to get all landing images with metadata
app.get('/admin/landing-images', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data, error } = await supabase
      .from('landing_images')
      .select('*')
      .order('slot_name');
    if (error) throw error;
    res.json({ images: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to upload a landing image
app.post('/admin/landing-images', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured. Cannot upload images.' });
  const { slot_name, base64, filename, mimeType } = req.body;

  if (!slot_name || !LANDING_IMAGE_SLOTS.includes(slot_name)) {
    return res.status(400).json({ error: `Invalid slot_name. Must be one of: ${LANDING_IMAGE_SLOTS.join(', ')}` });
  }
  if (!base64 || !filename || !mimeType) {
    return res.status(400).json({ error: 'base64, filename, and mimeType required.' });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(mimeType)) {
    return res.status(400).json({ error: 'Only JPG, PNG, and WEBP are allowed.' });
  }

  try {
    const b64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const buffer  = Buffer.from(b64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be under 5MB.' });
    }

    const ext        = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const uniqueName = `landing/${slot_name}-${Date.now()}.${ext}`;

    // Upload to landing-images bucket
    const { error: uploadError } = await supabase.storage
      .from('landing-images')
      .upload(uniqueName, buffer, { contentType: mimeType, upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('landing-images').getPublicUrl(uniqueName);
    const image_url = urlData.publicUrl;

    // Upsert into landing_images table
    const { error: dbError } = await supabase
      .from('landing_images')
      .upsert({ slot_name, image_url, updated_at: new Date().toISOString() }, { onConflict: 'slot_name' });
    if (dbError) throw dbError;

    res.json({ ok: true, slot_name, image_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin endpoint to delete a landing image
app.delete('/admin/landing-images/:slot_name', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { slot_name } = req.params;

  if (!LANDING_IMAGE_SLOTS.includes(slot_name)) {
    return res.status(400).json({ error: `Invalid slot_name. Must be one of: ${LANDING_IMAGE_SLOTS.join(', ')}` });
  }

  try {
    // Get current image URL to delete from storage
    const { data: existing } = await supabase
      .from('landing_images')
      .select('image_url')
      .eq('slot_name', slot_name)
      .single();

    if (existing?.image_url) {
      // Extract filename from URL and delete from storage
      const urlParts = existing.image_url.split('/');
      const fileName = urlParts.slice(-2).join('/'); // landing/filename.ext
      await supabase.storage.from('landing-images').remove([fileName]);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('landing_images')
      .delete()
      .eq('slot_name', slot_name);
    if (dbError) throw dbError;

    res.json({ ok: true, slot_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Home Page Images ───────────────────────────────────────────────────────────

// Get all home page images
app.get('/admin/home-images', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data, error } = await supabase
      .from('home_images')
      .select('*');
    if (error) throw error;

    console.log('[/admin/home-images GET] Fetched rows:', data?.length || 0);
    const images = {};
    (data || []).forEach(img => {
      images[img.slot_name] = img.image_url;
    });

    res.json({ images });
  } catch (err) {
    console.error('[/admin/home-images GET] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Upload a home page image
app.post('/admin/home-images', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { slot_name, base64, filename, mimeType } = req.body;

  console.log('[/admin/home-images POST] Uploading:', slot_name);

  if (!slot_name || !base64 || !filename) {
    return res.status(400).json({ error: 'Missing required fields: slot_name, base64, filename' });
  }

  try {
    // Remove data URL prefix
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const ext = filename.split('.').pop();
    const uniqueName = `${slot_name}_${Date.now()}.${ext}`;
    const filePath = `home/${uniqueName}`;

    // Delete old image if exists
    const { data: existing } = await supabase
      .from('home_images')
      .select('image_url')
      .eq('slot_name', slot_name)
      .single();

    if (existing?.image_url) {
      const urlParts = existing.image_url.split('/');
      const oldFileName = urlParts.slice(-2).join('/');
      await supabase.storage.from('home-images').remove([oldFileName]);
    }

    // Upload new image
    const { error: uploadError } = await supabase.storage
      .from('home-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('home-images')
      .getPublicUrl(filePath);

    const image_url = urlData.publicUrl;

    // Save to database
    const { error: dbError } = await supabase
      .from('home_images')
      .upsert({
        slot_name,
        image_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'slot_name' });

    if (dbError) throw dbError;

    console.log(`[/admin/home-images POST] Successfully saved ${slot_name}:`, image_url.substring(0, 60) + '...');
    res.json({ ok: true, slot_name, image_url });
  } catch (err) {
    console.error('[/admin/home-images POST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a home page image
app.delete('/admin/home-images/:slot_name', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { slot_name } = req.params;

  try {
    // Get current image URL to delete from storage
    const { data: existing } = await supabase
      .from('home_images')
      .select('image_url')
      .eq('slot_name', slot_name)
      .single();

    if (existing?.image_url) {
      const urlParts = existing.image_url.split('/');
      const fileName = urlParts.slice(-2).join('/');
      await supabase.storage.from('home-images').remove([fileName]);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('home_images')
      .delete()
      .eq('slot_name', slot_name);
    if (dbError) throw dbError;

    res.json({ ok: true, slot_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save all home images (for batch save)
app.post('/admin/home-images/save', adminAuth, async (req, res) => {
  // This is just a confirmation endpoint since images are already saved on upload
  res.json({ ok: true });
});

// Public endpoint to get home images (no auth required)
app.get('/api/home-images', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data, error } = await supabase
      .from('home_images')
      .select('*');
    if (error) throw error;

    console.log('[/api/home-images] Fetched rows:', data?.length || 0);
    const images = {};
    (data || []).forEach(img => {
      images[img.slot_name] = img.image_url;
      console.log(`  - ${img.slot_name}: ${img.image_url ? img.image_url.substring(0, 60) + '...' : '(empty)'}`);
    });

    res.json({ images });
  } catch (err) {
    console.error('[/api/home-images] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/questions', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured. Cannot save questions.' });

  const { subject, difficulty, question, options, correct, explanation, image_url, game_modes, tower_floor, buzz_type, topic_id } = req.body;
  if (!subject || !question || !Array.isArray(options) || options.length < 2 || options.length > 10 || !correct || !explanation)
    return res.status(400).json({ error: 'Missing required fields (options must be array of 2-10)' });

  const questionId = nextQuestionId(subject);
  const gameModes = Array.isArray(game_modes) && game_modes.length > 0 ? game_modes : ['battle_royale', 'speed_race', 'trivia_pursuit'];

  const record = {
    question_id: questionId,
    question,
    choices: options,
    correct,
    explanation,
    category: subject,
    difficulty: difficulty || 'easy',
    game_modes: gameModes,
    image_url: image_url || null,
    tower_floor: (tower_floor != null && !isNaN(parseInt(tower_floor))) ? parseInt(tower_floor) : null,
    buzz_type: (buzz_type && gameModes.includes('buzz_fun')) ? buzz_type : null,
    topic_id: topic_id || null,
  };

  try {
    const { data, error } = await supabase.from('questions').insert(record).select().single();
    if (error) throw error;

    // Also add to in-memory cache
    const newQ = {
      id: questionId,
      subject,
      difficulty: record.difficulty,
      question,
      options,
      correct,
      explanation,
      game_modes: gameModes,
      image_url: record.image_url || undefined,
      tower_floor: record.tower_floor || undefined,
      topic_id: record.topic_id || undefined,
      buzz_type: record.buzz_type || undefined,
      _supabase_id: data.id,
    };
    questionBank.push(newQ);
    res.json(newQ);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/admin/questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  const id  = req.params.id;
  const idx = questionBank.findIndex(q => String(q.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });

  const existing = questionBank[idx];
  const updated = { ...existing, ...req.body, id };

  // Build Supabase update record
  const record = {
    question: updated.question,
    choices: updated.options,
    correct: updated.correct,
    explanation: updated.explanation,
    category: updated.subject,
    difficulty: updated.difficulty || 'easy',
    game_modes: updated.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
    image_url: updated.image_url || null,
    tower_floor: updated.tower_floor || null,
    topic_id: updated.topic_id || null,
    buzz_type: updated.buzz_type || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase
      .from('questions')
      .update(record)
      .eq('question_id', id);
    if (error) throw error;

    // Update in-memory cache
    questionBank[idx] = updated;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/admin/questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  const id  = req.params.id;
  const idx = questionBank.findIndex(q => String(q.id) === id);
  if (idx === -1) return res.status(404).json({ error: 'Question not found' });

  try {
    const { error } = await supabase.from('questions').delete().eq('question_id', id);
    if (error) throw error;

    // Remove from in-memory cache
    questionBank.splice(idx, 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Topics API ─────────────────────────────────────────────────────────────────

app.get('/admin/topics', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ topics: [] });
  const { category, difficulty } = req.query;
  try {
    // Fetch all topics for the category — never filter by difficulty in DB
    // because the column may not exist yet; we normalise + filter in JS instead.
    let query = supabase.from('topics').select('*').order('name');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    console.log(`[topics] fetched ${(data || []).length} raw topic(s) from Supabase (category=${category || 'any'})`);
    let topics = (data || []).map(t => ({
      ...t,
      difficulty:     t.difficulty || 'easy', // default missing/null → easy
      question_count: questionBank.filter(q => q.topic_id === t.id).length,
    }));
    // Apply difficulty filter in JS so NULL/missing values default to 'easy'
    if (difficulty) {
      topics = topics.filter(t => t.difficulty === difficulty);
    }
    console.log(`[topics] returning ${topics.length} topic(s) after difficulty filter (difficulty=${difficulty || 'none'})`);
    res.json({ topics });
  } catch (err) {
    console.error('[topics] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/topics', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { name, category, difficulty } = req.body;
  if (!name?.trim() || !category) return res.status(400).json({ error: 'name and category required' });
  try {
    const { data, error } = await supabase
      .from('topics')
      .insert({ name: name.trim(), category, difficulty: difficulty || 'easy' })
      .select()
      .single();
    if (error) throw error;
    res.json({ ...data, question_count: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/topics/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const { data, error } = await supabase
      .from('topics')
      .update({ name: name.trim() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    const question_count = questionBank.filter(q => q.topic_id === req.params.id).length;
    res.json({ ...data, question_count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/topics/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const id    = req.params.id;
  const count = questionBank.filter(q => q.topic_id === id).length;
  if (count > 0) return res.status(400).json({ error: `Cannot delete — ${count} question(s) still assigned. Move or unassign them first.` });
  try {
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/admin/questions/bulk-assign-topic', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  const { questionIds, topicId } = req.body;
  if (!Array.isArray(questionIds)) return res.status(400).json({ error: 'questionIds array required' });

  let updated = 0;
  let errors = [];

  for (const id of questionIds) {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('questions')
        .update({ topic_id: topicId || null, updated_at: new Date().toISOString() })
        .eq('question_id', String(id));

      if (error) throw error;

      // Update in-memory cache
      const idx = questionBank.findIndex(q => String(q.id) === String(id));
      if (idx !== -1) {
        if (topicId) {
          questionBank[idx] = { ...questionBank[idx], topic_id: topicId };
        } else {
          const q = { ...questionBank[idx] };
          delete q.topic_id;
          questionBank[idx] = q;
        }
      }
      updated++;
    } catch (err) {
      errors.push({ id, error: err.message });
    }
  }

  res.json({ ok: true, updated, errors: errors.length > 0 ? errors : undefined });
});

// ── Tower Progress API ─────────────────────────────────────────────────────────

app.get('/api/tower/progress', requireAuth, async (req, res) => {
  if (!supabase) return res.json({ floor: 1 });
  try {
    const { data } = await supabase.from('users').select('tower_floor').eq('id', req.userId).single();
    res.json({ floor: data?.tower_floor || 1 });
  } catch { res.json({ floor: 1 }); }
});

app.put('/api/tower/progress', requireAuth, async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  const { floor } = req.body;
  if (!floor || typeof floor !== 'number' || floor < 1 || floor > 101)
    return res.status(400).json({ error: 'Invalid floor' });
  try {
    await supabase.from('users').update({ tower_floor: floor }).eq('id', req.userId);
    res.json({ ok: true });
  } catch { res.json({ ok: true }); }
});

app.get('/api/tower/leaderboard', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { data: players } = await supabase.from('users')
      .select('username, avatar_url, tower_floor')
      .gt('tower_floor', 1)
      .order('tower_floor', { ascending: false })
      .limit(50);
    if (!players?.length) return res.json({ players: [] });
    res.json({
      players: players.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        avatar_url: p.avatar_url,
        highestFloor: p.tower_floor,
        floorsCleared: Math.max(0, (p.tower_floor || 1) - 1),
      })),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Subjects API ──────────────────────────────────────────────────────────────

const SUBJECT_DEFAULTS = [
  { id: 'cardiology',       name: 'Cardiology',                  icon: '❤️',  active: true  },
  { id: 'neurology',        name: 'Neurology',                   icon: '🧠', active: true  },
  { id: 'pharmacology',     name: 'Pharmacology',                icon: '💊', active: true  },
  { id: 'microbiology',     name: 'Microbiology',                icon: '🦠', active: true  },
  { id: 'biochemistry',     name: 'Biochemistry',                icon: '⚗️', active: true  },
  { id: 'biostatistics',    name: 'Biostatistics',               icon: '📊', active: true  },
  { id: 'pathology',        name: 'Pathology',                   icon: '🔬', active: false },
  { id: 'pulmonology',      name: 'Pulmonology',                 icon: '🫁', active: false },
  { id: 'nephrology',       name: 'Nephrology',                  icon: '💧', active: false },
  { id: 'gastroenterology', name: 'Gastroenterology',            icon: '🫃', active: false },
  { id: 'endocrinology',    name: 'Endocrinology',               icon: '🦋', active: false },
  { id: 'haematology',      name: 'Haematology',                 icon: '🩸', active: false },
  { id: 'immunology',       name: 'Immunology',                  icon: '🛡️', active: false },
  { id: 'musculoskeletal',  name: 'Musculoskeletal',             icon: '🦴', active: false },
  { id: 'dermatology',      name: 'Dermatology',                 icon: '🩹', active: false },
  { id: 'reproductive',     name: 'Reproductive & Obstetrics',   icon: '👶', active: false },
  { id: 'psychiatry',       name: 'Psychiatry & Behav. Science', icon: '🧠', active: false },
  { id: 'ophthalmology',    name: 'Ophthalmology',               icon: '👁️', active: false },
  { id: 'ent',              name: 'ENT',                         icon: '👂', active: false },
  { id: 'genetics',         name: 'Genetics & Embryology',       icon: '🧬', active: false },
  { id: 'anatomy',          name: 'Anatomy',                     icon: '🫀', active: false },
];

app.get('/api/subjects', async (req, res) => {
  if (!supabase) return res.json({ subjects: SUBJECT_DEFAULTS });
  try {
    let { data, error } = await supabase
      .from('subjects')
      .select('id, name, icon, active, min_questions')
      .order('active', { ascending: false })
      .order('name',   { ascending: true  });
    if (error) throw error;
    let list = data || [];
    // Seed on first run
    if (list.length === 0) {
      const { data: inserted } = await supabase.from('subjects').insert(SUBJECT_DEFAULTS).select('id, name, icon, active, min_questions');
      list = inserted || SUBJECT_DEFAULTS;
    } else {
      // Insert any subjects added to defaults since last run
      const dbIds   = new Set(list.map(s => s.id));
      const missing = SUBJECT_DEFAULTS.filter(s => !dbIds.has(s.id));
      if (missing.length) {
        const { data: newRows } = await supabase.from('subjects').insert(missing).select('id, name, icon, active, min_questions');
        if (newRows) list = [...list, ...newRows];
      }
    }
    res.json({ subjects: list });
  } catch (err) {
    console.error('[Subjects] GET error:', err.message);
    res.json({ subjects: SUBJECT_DEFAULTS });
  }
});

app.put('/admin/subjects/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const id     = req.params.id;
  const active = !!req.body.active;
  try {
    const { data: existing } = await supabase.from('subjects').select('id').eq('id', id).single();
    if (existing) {
      const { data, error } = await supabase.from('subjects').update({ active }).eq('id', id).select('id, name, icon, active, min_questions').single();
      if (error) throw error;
      return res.json(data);
    }
    // Upsert if row missing (e.g. table was just created)
    const def = SUBJECT_DEFAULTS.find(s => s.id === id);
    if (!def) return res.status(404).json({ error: 'Subject not found' });
    const { data, error } = await supabase.from('subjects').insert({ ...def, active }).select('id, name, icon, active, min_questions').single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Announcements API ─────────────────────────────────────────────────────────

const WELCOME_ANNOUNCEMENT = {
  id: 'welcome-default',
  title: 'Welcome to Med Royale! 🏥',
  message: 'Welcome to Med Royale - the most fun way to prepare for your medical exams. We are just getting started and have big plans ahead. Good luck on your journey to becoming a doctor. Study hard, play hard!',
  category: 'Update',
  pinned: true,
  urgent: false,
  created_at: new Date().toISOString(),
};

// Public endpoint to get game settings (for checking hard mode availability, etc.)
app.get('/api/game-settings', (req, res) => {
  res.json({
    hardModeEnabled: gameSettings.hardModeEnabled,
    maintenanceMode: gameSettings.maintenanceMode,
    maintenanceMessage: gameSettings.maintenanceMessage,
  });
});

app.get('/api/announcements', async (req, res) => {
  if (!supabase) return res.json({ announcements: [WELCOME_ANNOUNCEMENT] });
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    let list = data || [];
    if (list.length === 0) {
      const { data: inserted } = await supabase
        .from('announcements')
        .insert({ title: WELCOME_ANNOUNCEMENT.title, message: WELCOME_ANNOUNCEMENT.message, category: 'Update', pinned: true, urgent: false })
        .select().single();
      list = inserted ? [inserted] : [WELCOME_ANNOUNCEMENT];
    }
    res.json({ announcements: list });
  } catch (err) {
    console.error('[Announcements] GET error:', err.message);
    res.json({ announcements: [WELCOME_ANNOUNCEMENT] });
  }
});

app.post('/admin/announcements', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const { title, message, category, pinned, urgent } = req.body;
  if (!title?.trim() || !message?.trim()) return res.status(400).json({ error: 'title and message are required.' });
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title: title.trim(), message: message.trim(), category: category || 'Update', pinned: !!pinned, urgent: !!urgent })
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/announcements/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const { title, message, category, pinned, urgent } = req.body;
  try {
    const { data, error } = await supabase
      .from('announcements')
      .update({ title: title?.trim(), message: message?.trim(), category, pinned: !!pinned, urgent: !!urgent })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/announcements/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Health check ───────────────────────────────────────────────────────────────

// ── Stats endpoints ────────────────────────────────────────────────────────────

app.get('/api/stats/xp-history', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('game_history')
      .select('xp_earned, played_at')
      .eq('user_id', req.userId)
      .gte('played_at', since.toISOString());

    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), xp: 0 });
    }
    (data || []).forEach(g => {
      const day = g.played_at ? g.played_at.slice(0, 10) : null;
      if (!day) return;
      const entry = days.find(d => d.date === day);
      if (entry) entry.xp += g.xp_earned || 0;
    });

    res.json({ days });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/global', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  try {
    const [usersRes, histRes] = await Promise.all([
      supabase.from('users').select('games_played, games_won, tower_floor, tower_progress').gt('games_played', 0),
      supabase.from('game_history').select('correct_answers, total_questions'),
    ]);

    const users = usersRes.data || [];
    const hist  = histRes.data  || [];

    let totalC = 0, totalQ = 0;
    hist.forEach(g => { totalC += g.correct_answers || 0; totalQ += g.total_questions || 0; });
    const accuracy = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 50;

    let totalPlayed = 0, totalWon = 0, totalFloor = 0;
    users.forEach(u => {
      totalPlayed += u.games_played || 0;
      totalWon    += u.games_won    || 0;
      totalFloor  += u.tower_floor || u.tower_progress || 0;
    });
    const winRate  = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 20;
    const avgFloor = users.length  > 0 ? Math.round(totalFloor / users.length) : 5;

    res.json({ accuracy, win_rate: winRate, tower_floor: avgFloor });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/', (req, res) => res.status(200).send('ok'));

// ══════════════════════════════════════════════════════════════════════════════
// QUEST PROGRESS HELPER
// ══════════════════════════════════════════════════════════════════════════════

async function updateQuestProgress(userId, action, value = 1) {
  if (!supabase) return [];
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get today's quests
    const { data: dailyData } = await supabase
      .from('daily_quests')
      .select('quest_ids')
      .eq('date', today)
      .single();

    if (!dailyData?.quest_ids?.length) return [];

    // Get quest details
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .in('id', dailyData.quest_ids);

    const actionToQuestType = {
      'play_game': 'play_games',
      'correct_answer': 'correct_answers',
      'win_battle_royale': 'win_battle_royale',
      'win_speed_race': 'win_speed_race',
      'tower_floor': 'tower_floors',
      'streak': 'streak',
      'game_mode': 'different_modes',
    };

    const questType = actionToQuestType[action];
    if (!questType) return [];

    const matchingQuests = (quests || []).filter(q => q.quest_type === questType);
    const newlyCompleted = [];

    for (const quest of matchingQuests) {
      // Get or create progress record
      let { data: progress } = await supabase
        .from('player_quest_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .eq('date', today)
        .single();

      if (!progress) {
        const { data: newProgress } = await supabase
          .from('player_quest_progress')
          .insert({ user_id: userId, quest_id: quest.id, date: today, current_progress: 0 })
          .select()
          .single();
        progress = newProgress;
      }

      if (progress && !progress.completed) {
        const increment = value || 1;
        const newProgress = Math.min(progress.current_progress + increment, quest.target);
        const isComplete = newProgress >= quest.target;

        const updateData = {
          current_progress: newProgress,
          completed: isComplete,
        };
        if (isComplete) {
          updateData.completed_at = new Date().toISOString();
        }

        await supabase
          .from('player_quest_progress')
          .update(updateData)
          .eq('id', progress.id);

        if (isComplete && !progress.completed) {
          newlyCompleted.push(quest);

          // Award rewards
          const { data: user } = await supabase
            .from('users')
            .select('coins, gems, xp')
            .eq('id', userId)
            .single();

          if (user) {
            await supabase
              .from('users')
              .update({
                coins: (user.coins || 0) + (quest.coin_reward || 0),
                gems: (user.gems || 0) + (quest.gem_reward || 0),
                xp: (user.xp || 0) + (quest.xp_reward || 0),
              })
              .eq('id', userId);

            // Mark rewards as claimed
            await supabase
              .from('player_quest_progress')
              .update({ rewards_claimed: true })
              .eq('user_id', userId)
              .eq('quest_id', quest.id)
              .eq('date', today);

            console.log(`[Quest] User ${userId} completed "${quest.name}" - awarded ${quest.coin_reward} coins, ${quest.gem_reward} gems, ${quest.xp_reward} XP`);
          }
        }
      }
    }

    return newlyCompleted;
  } catch (err) {
    console.error('[Quest] Progress update error:', err.message);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DAILY QUESTS SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// Get all quests (admin)
app.get('/admin/quests', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ quests: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create quest (admin)
app.post('/admin/quests', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { name, description, icon, quest_type, target, coin_reward, gem_reward, xp_reward, difficulty, active, pinned_day } = req.body;
  if (!name || !quest_type || !target) {
    return res.status(400).json({ error: 'name, quest_type, and target are required' });
  }
  try {
    const { data, error } = await supabase
      .from('quests')
      .insert({
        name,
        description: description || '',
        icon: icon || '🎮',
        quest_type,
        target: parseInt(target) || 1,
        coin_reward: parseInt(coin_reward) || 0,
        gem_reward: parseInt(gem_reward) || 0,
        xp_reward: parseInt(xp_reward) || 0,
        difficulty: difficulty || 'easy',
        active: active !== false,
        pinned_day: pinned_day != null ? parseInt(pinned_day) : null,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quest (admin)
app.put('/admin/quests/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { id } = req.params;
  const updates = {};
  const allowed = ['name', 'description', 'icon', 'quest_type', 'target', 'coin_reward', 'gem_reward', 'xp_reward', 'difficulty', 'active', 'pinned_day'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      if (['target', 'coin_reward', 'gem_reward', 'xp_reward', 'pinned_day'].includes(key)) {
        updates[key] = req.body[key] != null ? parseInt(req.body[key]) : null;
      } else {
        updates[key] = req.body[key];
      }
    }
  }
  try {
    const { data, error } = await supabase
      .from('quests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete quest (admin)
app.delete('/admin/quests/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { error } = await supabase.from('quests').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get today's daily quests (public)
app.get('/api/daily-quests', async (req, res) => {
  if (!supabase) return res.json({ quests: [], date: new Date().toISOString().split('T')[0] });

  const today = new Date().toISOString().split('T')[0];

  try {
    // Check if we already have quests selected for today
    let { data: dailyData } = await supabase
      .from('daily_quests')
      .select('quest_ids')
      .eq('date', today)
      .single();

    let questIds = dailyData?.quest_ids;

    // If no quests for today, select 3 random active quests
    if (!questIds || questIds.length === 0) {
      // Get pinned quests for today's day of week (0=Sunday)
      const dayOfWeek = new Date().getDay();
      const { data: pinnedQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('active', true)
        .eq('pinned_day', dayOfWeek);

      const pinnedIds = (pinnedQuests || []).map(q => q.id);

      // Get random quests to fill remaining slots
      const { data: activeQuests } = await supabase
        .from('quests')
        .select('id, difficulty')
        .eq('active', true)
        .is('pinned_day', null);

      // Try to get a mix of difficulties
      const easyQuests = (activeQuests || []).filter(q => q.difficulty === 'easy');
      const mediumQuests = (activeQuests || []).filter(q => q.difficulty === 'medium');
      const hardQuests = (activeQuests || []).filter(q => q.difficulty === 'hard');

      // Shuffle arrays
      const shuffle = arr => arr.sort(() => Math.random() - 0.5);
      shuffle(easyQuests);
      shuffle(mediumQuests);
      shuffle(hardQuests);

      // Select quests: prefer 1 easy, 1 medium, 1 hard (or fill as available)
      const selectedIds = [...pinnedIds];
      const remaining = 3 - selectedIds.length;

      if (remaining > 0) {
        const pool = [];
        if (easyQuests.length > 0) pool.push(easyQuests[0]);
        if (mediumQuests.length > 0) pool.push(mediumQuests[0]);
        if (hardQuests.length > 0) pool.push(hardQuests[0]);

        // Fill with shuffled pool
        shuffle(pool);
        for (let i = 0; i < remaining && pool.length > 0; i++) {
          const q = pool.shift();
          if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
        }

        // If still not enough, grab any active quest
        if (selectedIds.length < 3) {
          const allShuffled = shuffle([...easyQuests, ...mediumQuests, ...hardQuests]);
          for (const q of allShuffled) {
            if (selectedIds.length >= 3) break;
            if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
          }
        }
      }

      questIds = selectedIds.slice(0, 3);

      // Save today's selection
      if (questIds.length > 0) {
        await supabase.from('daily_quests').upsert({ date: today, quest_ids: questIds }, { onConflict: 'date' });
      }
    }

    // Fetch full quest details
    if (questIds && questIds.length > 0) {
      const { data: quests } = await supabase
        .from('quests')
        .select('*')
        .in('id', questIds);

      res.json({ quests: quests || [], date: today });
    } else {
      res.json({ quests: [], date: today });
    }
  } catch (err) {
    console.error('[daily-quests] Error:', err.message);
    res.json({ quests: [], date: today, error: err.message });
  }
});

// Preview today's quests (admin)
app.get('/admin/daily-quests/preview', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: dailyData } = await supabase
      .from('daily_quests')
      .select('quest_ids')
      .eq('date', today)
      .single();

    if (dailyData?.quest_ids?.length > 0) {
      const { data: quests } = await supabase
        .from('quests')
        .select('*')
        .in('id', dailyData.quest_ids);
      res.json({ quests: quests || [], date: today, generated: false });
    } else {
      res.json({ quests: [], date: today, generated: false, message: 'No quests selected yet. Quests will be selected when first player loads dashboard.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force regenerate today's quests (admin)
app.post('/admin/daily-quests/regenerate', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  const today = new Date().toISOString().split('T')[0];

  try {
    // Delete today's selection
    await supabase.from('daily_quests').delete().eq('date', today);

    // Trigger new selection by calling the public endpoint logic
    // Get pinned quests
    const dayOfWeek = new Date().getDay();
    const { data: pinnedQuests } = await supabase
      .from('quests')
      .select('id')
      .eq('active', true)
      .eq('pinned_day', dayOfWeek);

    const pinnedIds = (pinnedQuests || []).map(q => q.id);

    const { data: activeQuests } = await supabase
      .from('quests')
      .select('id, difficulty')
      .eq('active', true)
      .is('pinned_day', null);

    const shuffle = arr => arr.sort(() => Math.random() - 0.5);
    const easyQuests = shuffle((activeQuests || []).filter(q => q.difficulty === 'easy'));
    const mediumQuests = shuffle((activeQuests || []).filter(q => q.difficulty === 'medium'));
    const hardQuests = shuffle((activeQuests || []).filter(q => q.difficulty === 'hard'));

    const selectedIds = [...pinnedIds];
    const remaining = 3 - selectedIds.length;

    if (remaining > 0) {
      const pool = [];
      if (easyQuests.length > 0) pool.push(easyQuests[0]);
      if (mediumQuests.length > 0) pool.push(mediumQuests[0]);
      if (hardQuests.length > 0) pool.push(hardQuests[0]);
      shuffle(pool);

      for (const q of pool) {
        if (selectedIds.length >= 3) break;
        if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
      }

      if (selectedIds.length < 3) {
        const allShuffled = shuffle([...easyQuests, ...mediumQuests, ...hardQuests]);
        for (const q of allShuffled) {
          if (selectedIds.length >= 3) break;
          if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
        }
      }
    }

    const questIds = selectedIds.slice(0, 3);

    if (questIds.length > 0) {
      await supabase.from('daily_quests').insert({ date: today, quest_ids: questIds });

      const { data: quests } = await supabase
        .from('quests')
        .select('*')
        .in('id', questIds);

      res.json({ quests: quests || [], date: today, regenerated: true });
    } else {
      res.json({ quests: [], date: today, regenerated: true, message: 'No active quests available' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player's quest progress for today
app.get('/api/quest-progress', requireAuth, async (req, res) => {
  if (!supabase) return res.json({ progress: [] });

  const today = new Date().toISOString().split('T')[0];
  const userId = req.userId;

  try {
    const { data } = await supabase
      .from('player_quest_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today);

    res.json({ progress: data || [], date: today });
  } catch (err) {
    res.json({ progress: [], error: err.message });
  }
});

// Update player quest progress (called after game actions)
app.post('/api/quest-progress/update', requireAuth, async (req, res) => {
  if (!supabase) return res.json({ updated: [] });

  const today = new Date().toISOString().split('T')[0];
  const userId = req.userId;
  const { action, value } = req.body;

  // action types: 'play_game', 'correct_answer', 'win_battle_royale', 'win_speed_race', 'tower_floor', 'streak', 'game_mode'

  try {
    // Get today's quests
    const { data: dailyData } = await supabase
      .from('daily_quests')
      .select('quest_ids')
      .eq('date', today)
      .single();

    if (!dailyData?.quest_ids?.length) return res.json({ updated: [] });

    // Get quest details
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .in('id', dailyData.quest_ids);

    const actionToQuestType = {
      'play_game': 'play_games',
      'correct_answer': 'correct_answers',
      'win_battle_royale': 'win_battle_royale',
      'win_speed_race': 'win_speed_race',
      'tower_floor': 'tower_floors',
      'streak': 'streak',
      'game_mode': 'different_modes',
    };

    const questType = actionToQuestType[action];
    if (!questType) return res.json({ updated: [] });

    const matchingQuests = (quests || []).filter(q => q.quest_type === questType);
    const updated = [];
    const newlyCompleted = [];

    for (const quest of matchingQuests) {
      // Get or create progress record
      let { data: progress } = await supabase
        .from('player_quest_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .eq('date', today)
        .single();

      if (!progress) {
        const { data: newProgress } = await supabase
          .from('player_quest_progress')
          .insert({ user_id: userId, quest_id: quest.id, date: today, current_progress: 0 })
          .select()
          .single();
        progress = newProgress;
      }

      if (progress && !progress.completed) {
        const increment = value || 1;
        const newProgress = Math.min(progress.current_progress + increment, quest.target);
        const isComplete = newProgress >= quest.target;

        const updateData = {
          current_progress: newProgress,
          completed: isComplete,
        };
        if (isComplete) {
          updateData.completed_at = new Date().toISOString();
        }

        const { data: updatedProgress } = await supabase
          .from('player_quest_progress')
          .update(updateData)
          .eq('id', progress.id)
          .select()
          .single();

        updated.push(updatedProgress);

        if (isComplete && !progress.completed) {
          newlyCompleted.push({ quest, progress: updatedProgress });
        }
      }
    }

    // Award rewards for newly completed quests
    for (const { quest, progress } of newlyCompleted) {
      if (!progress.rewards_claimed) {
        // Update user's coins, gems, XP
        const { data: user } = await supabase
          .from('users')
          .select('coins, gems, xp')
          .eq('id', userId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              coins: (user.coins || 0) + (quest.coin_reward || 0),
              gems: (user.gems || 0) + (quest.gem_reward || 0),
              xp: (user.xp || 0) + (quest.xp_reward || 0),
            })
            .eq('id', userId);

          // Mark rewards as claimed
          await supabase
            .from('player_quest_progress')
            .update({ rewards_claimed: true })
            .eq('id', progress.id);
        }
      }
    }

    res.json({ updated, newlyCompleted: newlyCompleted.map(c => c.quest) });
  } catch (err) {
    console.error('[quest-progress] Error:', err.message);
    res.json({ updated: [], error: err.message });
  }
});

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

server.listen(PORT, async () => {
  console.log(`USMLE Battle Royale server running on port ${PORT}`);
  await loadSettingsFromDB();
  await loadQuestionsFromDB();

  // Refresh questions cache every 5 minutes
  setInterval(() => {
    loadQuestionsFromDB().catch(err => console.error('[Questions] Auto-refresh failed:', err.message));
  }, QUESTIONS_CACHE_TTL);
});
