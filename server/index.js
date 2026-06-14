console.log('PORT env var is:', process.env.PORT);

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const compression = require('compression');
const session    = require('express-session');
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt        = require('jsonwebtoken');
const fs         = require('fs');
const path       = require('path');
const multer     = require('multer');
const AdmZip     = require('adm-zip');
const os         = require('os');
const { fromDb, toDb, toPublicQuestion, answerResultPayload, normalizeImport } = require('./questionMapper');

// Use sql.js - pure JavaScript SQLite, no native compilation needed
const initSqlJs = require('sql.js');

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

// ── Multer setup for Anki imports ──────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => cb(null, `anki-${Date.now()}.apkg`)
});
const ankiUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.apkg') || file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Only .apkg files allowed'));
    }
  }
});

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
app.use(compression()); // gzip compress all responses
app.use(express.json({ limit: '10mb' }));

// Cache static assets
app.use((req, res, next) => {
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: true, // must be true so OAuth state is saved before the redirect
  cookie: { secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 }, // cross-origin OAuth
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Clan Perks by Level ────────────────────────────────────────────────────────

const CLAN_PERKS = {
  1: [],
  2: [{ icon: '🔄', text: '+5% Clan XP Boost' }],
  3: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+10% Gold from Battles' }],
  4: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+20% Gold from Battles' }, { icon: '⚔️', text: '+5% Damage in Clan Wars' }],
  5: [{ icon: '🔄', text: '+10% Clan XP Boost' }, { icon: '🪙', text: '+20% Gold from Battles' }, { icon: '⚔️', text: '+5% Damage in Clan Wars' }, { icon: '📋', text: '+1 Extra Daily Quest' }],
  6: [{ icon: '🔄', text: '+15% Clan XP Boost' }, { icon: '🪙', text: '+25% Gold from Battles' }, { icon: '⚔️', text: '+10% Damage in Clan Wars' }, { icon: '📋', text: '+2 Extra Daily Quests' }, { icon: '💎', text: '+5% Gem Drop Rate' }],
  7: [{ icon: '🔄', text: '+20% Clan XP Boost' }, { icon: '🪙', text: '+30% Gold from Battles' }, { icon: '⚔️', text: '+15% Damage in Clan Wars' }, { icon: '📋', text: '+2 Extra Daily Quests' }, { icon: '💎', text: '+10% Gem Drop Rate' }, { icon: '🛡', text: '+10% Defense Bonus' }],
};

const getClanPerks = (level) => {
  const clampedLevel = Math.min(Math.max(level || 1, 1), 7);
  return CLAN_PERKS[clampedLevel] || [];
};

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
      questionBank = data.map(fromDb);
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
  endocrinology: 'EN', haematology: 'HM', haematology_oncology: 'HO', immunology: 'IM',
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
  // Easy Mode settings
  easyModeTimer: 30,
  easyModeExplanationTime: 15,
  easyModeHideExplanations: false,
  easyModeDescription: 'Perfect for learning. Questions present straightforward clinical scenarios with detailed explanations to build your foundation.',
  easyModeLabel: 'Easy Mode',
  // Hard Mode settings
  hardModeTimer: 30,  // HARDCODED: 30 seconds for hard mode (not used, see line 760)
  hardModeExplanationTime: 20,  // HARDCODED: 20 seconds explanation (not used, see lines 682, 860, 870, 879)
  hardModeHideExplanations: false,
  hardModeDescription: 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.',
  hardModeLabel: 'Hard Mode',
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
  journeyThreshold: 80,  // First Aid Journey: % score needed to complete a level
  // First Aid Journey: which of the 16 hardcoded journey subjects players see
  // (ids mirror client/src/journeySubjects.js; default = all active)
  journeyActiveSubjects: [
    'biochemistry', 'immunology', 'microbiology', 'pathology', 'pharmacology', 'public_health',
    'cardiovascular', 'endocrine', 'gastrointestinal', 'heme_onc', 'msk_skin', 'neuro_special',
    'psychiatry', 'renal', 'reproductive', 'respiratory',
  ],
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
  hero_bg_dim_enabled: false,  // OFF by default - no dimming
  hero_bg_dim_opacity: 40,
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

      // Normalize keys: handle snake_case -> camelCase migration
      if (loadedSettings.hard_mode_timer !== undefined && loadedSettings.hardModeTimer === undefined) {
        loadedSettings.hardModeTimer = loadedSettings.hard_mode_timer;
      }
      if (loadedSettings.hard_mode_explanation_time !== undefined && loadedSettings.hardModeExplanationTime === undefined) {
        loadedSettings.hardModeExplanationTime = loadedSettings.hard_mode_explanation_time;
      }

      gameSettings = { ...gameSettings, ...loadedSettings };
      console.log(`[Settings] Loaded ${data.length} settings from Supabase`);
      console.log('[Settings] Sample values:', {
        hardModeEnabled: gameSettings.hardModeEnabled,
        hardModeTimer: gameSettings.hardModeTimer,
        hardModeExplanationTime: gameSettings.hardModeExplanationTime,
        timerDefault: gameSettings.timerDefault,
      });
    } else {
      console.log('[Settings] No settings found in Supabase, using defaults');
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

// ── Answer checking helper ─────────────────────────────────────────────────────

function isAnswerCorrect(submittedAnswer, question) {
  console.log('[isAnswerCorrect] Input:', {
    submittedAnswer,
    questionCorrect: question?.correct
  });

  if (!submittedAnswer || !question || !question.correct) {
    console.log('[isAnswerCorrect] Missing data, returning false');
    return false;
  }

  // Both should now be letters (A, B, C...) - simple comparison
  const result = submittedAnswer.trim().toUpperCase() === String(question.correct).trim().toUpperCase();
  console.log('[isAnswerCorrect] Result:', result);
  return result;
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
    ...toPublicQuestion(q),
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
    const correct    = isAnswerCorrect(answer, q);
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

    const explanation = lobby.difficulty === 'hard' && gameSettings.hardModeHideExplanations
      ? ''
      : (q.explanation || '');
    const sock = io.sockets.sockets.get(player.id);
    if (sock) sock.emit('answer_result', answerResultPayload({
      isCorrect: correct, q,
      extras: {
        lives: 3, alive: true,
        score: player.score, explanation,
        streak: sr.streak, onFire: sr.onFire, pointsEarned,
      },
    }));
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: 3, score: p.score, alive: true,
    streak: lobby.streaks?.get(p.id) || 0,
  }));

  const explanation = lobby.difficulty === 'hard' && gameSettings.hardModeHideExplanations
    ? ''
    : (q.explanation || '');
  io.to(lobby.id).emit('round_results', {
    results, correctAnswer: q.correct, explanation, eliminated: [], players: snapshot,
  });

  const explanationDelay = lobby.difficulty === 'hard'
    ? (gameSettings.hardModeHideExplanations ? 2500 : 22000)  // HARDCODED: 20s explanation + 2s buffer
    : (gameSettings.explanationTime * 1000 + 2000);
  if (lobby.questionIdx >= lobby.questionQueue.length - 1) {
    setTimeout(() => endGame(lobby, 'questions_exhausted'), explanationDelay);
    return;
  }
  setTimeout(() => nextBuzzFunQuestion(lobby), explanationDelay);
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
  const timeLimit = lobby.suddenDeath ? gameSettings.suddenDeathTimer
    : lobby.gameMode === 'scan_master' ? gameSettings.timerScanMaster
    : lobby.difficulty === 'hard' ? 30  // HARDCODED: 30 seconds for hard mode
    : gameSettings.timerDefault;

  io.to(lobby.id).emit('new_question', {
    ...toPublicQuestion(q),
    round: lobby.round, timeLimit, alivePlayers: alive.length,
    suddenDeath: lobby.suddenDeath || false,
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
      const isCorrectAnswer = isAnswerCorrect(answer, q);
      const sr = updateStreak(lobby, player.id, isCorrectAnswer);
      streak  = sr.streak;
      onFire  = sr.onFire;
      correct = isCorrectAnswer;
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
      const explanation = lobby.difficulty === 'hard' && gameSettings.hardModeHideExplanations
        ? ''
        : (q.explanation || '');
      sock.emit('answer_result', answerResultPayload({
        isCorrect: correct, q,
        extras: {
          lives: player.lives, alive: player.alive,
          score: player.score, explanation,
          streak, onFire,
        },
      }));
    }
  }

  const snapshot = [...lobby.players.values()].map(p => ({
    id: p.id, username: p.username, lives: p.lives, score: p.score, alive: p.alive,
    streak: lobby.streaks?.get(p.id) || 0,
  }));

  const explanation = lobby.difficulty === 'hard' && gameSettings.hardModeHideExplanations
    ? ''
    : (q.explanation || '');
  io.to(lobby.id).emit('round_results', {
    results, correctAnswer: q.correct, explanation, eliminated, players: snapshot,
  });

  const alive = alivePlayers(lobby);

  if (alive.length <= 1) {
    const explanationDelay = lobby.difficulty === 'hard'
      ? (gameSettings.hardModeHideExplanations ? 3000 : 22000)  // HARDCODED: 20s explanation + 2s buffer
      : (gameSettings.explanationTime * 1000 + 2000);
    setTimeout(() => endGame(lobby, 'last_standing'), explanationDelay);
    return;
  }

  // Trigger sudden death when exactly 2 players remain for the first time
  if (alive.length === 2 && !lobby.suddenDeath) {
    lobby.suddenDeath = true;
    const explanationDelay = lobby.difficulty === 'hard'
      ? (gameSettings.hardModeHideExplanations ? 3000 : 22000)  // HARDCODED: 20s explanation + 2s buffer
      : (gameSettings.explanationTime * 1000 + 2000);
    // Emit announcement after round results have been shown, then give 3s for the screen
    setTimeout(() => io.to(lobby.id).emit('sudden_death'), explanationDelay);
    setTimeout(() => nextQuestion(lobby), explanationDelay + 3000);
    return;
  }

  const explanationDelay = lobby.difficulty === 'hard'
    ? (gameSettings.hardModeHideExplanations ? 2500 : 22000)  // HARDCODED: 20s explanation + 2s buffer
    : (gameSettings.explanationTime * 1000 + 2000);
  setTimeout(() => nextQuestion(lobby), explanationDelay);
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

const SPEED_RACE_TIMEOUT = 10 * 60 * 1000; // 10 min

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
  io.to(lobby.id).emit('race_progress', { progress, goal: gameSettings.speedRaceQuestions });
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
  const timeLimit = gameSettings.timerSpeedRace;

  if (!player.isBot) {
    const sock = io.sockets.sockets.get(playerId);
    if (sock) {
      sock.emit('new_question', {
        ...toPublicQuestion(q),
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
  const isCorrectAnswer = !isSkip && answer !== null && isAnswerCorrect(answer, q);
  const correct = isCorrectAnswer;
  const { streak, onFire } = isSkip
    ? { streak: lobby.streaks?.get(playerId) || 0, onFire: false }
    : updateStreak(lobby, playerId, isCorrectAnswer);

  if (correct) {
    if (lobby.pendingDoubleXp?.has(playerId)) {
      lobby.powerupXpBonus.set(playerId, (lobby.powerupXpBonus.get(playerId) || 0) + XP_PER_CORRECT);
      lobby.pendingDoubleXp.delete(playerId);
    }
    const n = (lobby.raceCorrects.get(playerId) || 0) + 1;
    lobby.raceCorrects.set(playerId, n);
    player.score = n;

    if (n >= gameSettings.speedRaceQuestions && !lobby.raceFinishedOrder.includes(playerId)) {
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
      sock.emit('answer_result', answerResultPayload({
        isCorrect: correct, q,
        extras: {
          lives: 3, alive: true,
          score: lobby.raceCorrects.get(playerId) || 0,
          streak, onFire,
        },
      }));
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

const BOT_ACCURACY = { easy: 0.40, hard: 0.85, expert: 0.95 };

// Reaction time [minMs, maxMs] — capped to (timeLimit - 500ms) at call site
const BOT_REACTION_MS = {
  easy:   [12000, 18000],
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
        question: toPublicQuestion(q),
        category: q.subject, isHQ: false, canEarnWedge: false,
        isFinalQuestion: true, round: lobby.round, timeLimit: gameSettings.timerTriviaPursuit,
        wedgeState: triviaWedgeSnapshot(lobby),
      });
      if (player?.isBot) {
        lobby.timer = setTimeout(() => {
          if (lobby.status !== 'trivia_question') return;
          const correct = Math.random() < BOT_ACCURACY[player.difficulty];
          processTriviaAnswer(lobby, correct ? q.correct : randomWrongAnswer(q.correct));
        }, botReactionDelay(player.difficulty, gameSettings.timerTriviaPursuit));
      } else {
        lobby.timer = setTimeout(() => processTriviaAnswer(lobby, null), gameSettings.timerTriviaPursuit * 1000);
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
      question: toPublicQuestion(q),
      category: space.category, isHQ: space.isHQ, canEarnWedge,
      isFinalQuestion: false, round: lobby.round, timeLimit: gameSettings.timerTriviaPursuit,
      wedgeState: triviaWedgeSnapshot(lobby),
    });
    const botP = lobby.players.get(sid);
    if (botP?.isBot) {
      lobby.timer = setTimeout(() => {
        if (lobby.status !== 'trivia_question') return;
        const correct = Math.random() < BOT_ACCURACY[botP.difficulty];
        processTriviaAnswer(lobby, correct ? q.correct : randomWrongAnswer(q.correct));
      }, botReactionDelay(botP.difficulty, gameSettings.timerTriviaPursuit));
    } else {
      lobby.timer = setTimeout(() => processTriviaAnswer(lobby, null), gameSettings.timerTriviaPursuit * 1000);
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

  const correct   = answer !== null && isAnswerCorrect(answer, q);
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
    playerId: sid,
    ...answerResultPayload({
      isCorrect: correct, q,
      extras: {
        explanation: q.explanation,
        earnedWedge, category, isHQ, canEarnWedge, isFinalQuestion, allWedges, wedgeState,
        streak, onFire, streaks: streakSnapshot(lobby),
      },
    }),
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

// Track online users
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('[+] connected:', socket.id, socket.userId ? `(user ${socket.userId})` : '');

  // Handle user coming online
  socket.on('user_online', async (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;

    // Update last_seen and is_online in database
    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', userId);
      } catch(e) {
        console.error('[user_online] update error:', e.message);
      }
    }

    // Broadcast to clan members
    socket.broadcast.emit('user_status_change', { userId, online: true });
  });

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
      if (isAnswerCorrect(answer, q) && !lobby.buzzFirstCorrect) lobby.buzzFirstCorrect = socket.id;
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

  socket.on('disconnect', async () => {
    console.log('[-] disconnected:', socket.id);

    // Update user online status
    const userId = socket.userId;
    if (userId) {
      onlineUsers.delete(userId);

      if (supabase) {
        try {
          await supabase
            .from('users')
            .update({ is_online: false, last_seen: new Date().toISOString() })
            .eq('id', userId);
        } catch(e) {
          console.error('[disconnect] update error:', e.message);
        }
      }

      socket.broadcast.emit('user_status_change', { userId, online: false });
    }

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

// Get question counts per topic (for Training Grounds topic selection)
app.get('/api/questions/counts', (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    let questions = questionBank;

    // Filter by difficulty if provided
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Filter by subject if provided
    if (subject) {
      questions = questions.filter(q => q.subject === subject);
    }

    // Count questions per topic_id
    const counts = {};
    questions.forEach(q => {
      if (q.topic_id) {
        counts[q.topic_id] = (counts[q.topic_id] || 0) + 1;
      }
    });

    res.json(counts);
  } catch (e) {
    console.error('[GET /api/questions/counts] error:', e);
    res.status(500).json({});
  }
});

app.get('/api/questions', (req, res) => {
  const subject    = (req.query.subject || 'all').toLowerCase();
  const difficulty = req.query.difficulty; // STRICT: never fall back to different difficulty
  const towerFloor = parseInt(req.query.tower_floor);
  const topicId    = req.query.topic_id;

  // Training Grounds: filter by topic_id AND difficulty (STRICT - no fallback)
  if (topicId) {
    let topicPool = questionBank.filter(q => q.topic_id === topicId);

    // STRICT difficulty filtering - never fall back
    if (difficulty) {
      topicPool = topicPool.filter(q => q.difficulty === difficulty);
    }

    // If no questions found, return empty with message - DO NOT fallback
    if (topicPool.length === 0) {
      return res.json({
        questions: [],
        empty: true,
        message: `No ${difficulty || 'any'} questions found for this topic.`
      });
    }

    return res.json({ questions: shuffle(topicPool), empty: false });
  }

  if (!isNaN(towerFloor) && towerFloor >= 1 && towerFloor <= 100) {
    const zoneNum   = Math.ceil(towerFloor / 10);
    const zoneStart = (zoneNum - 1) * 10 + 1;
    const zoneEnd   = zoneNum * 10;
    let towerPool = questionBank.filter(q =>
      Array.isArray(q.game_modes) && q.game_modes.includes('tower') &&
      q.tower_floor >= zoneStart && q.tower_floor <= zoneEnd
    );

    // Apply difficulty filter if provided
    if (difficulty) {
      towerPool = towerPool.filter(q => q.difficulty === difficulty);
    }

    if (towerPool.length >= 3) {
      return res.json({ questions: shuffle(towerPool), empty: false });
    }
    // Fallback for tower when no zone questions exist
    const fallback = subject === 'all' ? questionBank : questionBank.filter(q => q.subject === subject);
    return res.json({ questions: shuffle(fallback.length >= 5 ? fallback : questionBank), empty: false });
  }

  // Regular subject-based questions with difficulty filter
  let pool = subject === 'all'
    ? questionBank
    : questionBank.filter(q => q.subject === subject);

  // STRICT difficulty filtering
  if (difficulty) {
    pool = pool.filter(q => q.difficulty === difficulty);

    // If no questions found, return empty
    if (pool.length === 0) {
      return res.json({
        questions: [],
        empty: true,
        message: `No ${difficulty} questions found for ${subject}.`
      });
    }
  }

  res.json({ questions: shuffle(pool.length >= 5 ? pool : questionBank), empty: false });
});

// ── AnKing Mode Questions ──────────────────────────────────────────────────────

app.get('/api/questions/anking', async (req, res) => {
  try {
    const { subject, deck, limit = 20 } = req.query;

    // Filter from in-memory question bank for AnKing cards
    let ankingCards = questionBank.filter(q =>
      q.source === 'anki_import' ||
      (Array.isArray(q.game_modes) && q.game_modes.includes('anking'))
    );

    if (subject && subject !== 'all') {
      ankingCards = ankingCards.filter(q => q.subject === subject);
    }

    if (deck) {
      ankingCards = ankingCards.filter(q => q.topic === deck);
    }

    // Shuffle and limit
    const shuffled = shuffle(ankingCards);
    const limited = shuffled.slice(0, parseInt(limit));

    res.json(limited);
  } catch(e) {
    console.error('[GET /api/questions/anking] error:', e);
    res.status(500).json([]);
  }
});

// ── AnKing Admin API ───────────────────────────────────────────────────────────

// GET AnKing questions with pagination/search/filter
app.get('/api/admin/anking/questions', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ questions: [], total: 0, subjects: [] });
  try {
    const { page = 1, limit = 20, subject, q } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('questions')
      .select('*', { count: 'exact' })
      .eq('source', 'anki_import')
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (subject) query = query.eq('category', subject);
    if (q) query = query.ilike('question', `%${q}%`);

    const { data, count, error } = await query;
    if (error) throw error;

    // Get unique subjects
    const { data: subjectData } = await supabase
      .from('questions')
      .select('category')
      .eq('source', 'anki_import')
      .not('category', 'is', null);

    const subjects = [...new Set(subjectData?.map(s => s.category).filter(Boolean))].sort();

    res.json({ questions: data || [], total: count || 0, subjects });
  } catch(e) {
    console.error('[GET /api/admin/anking/questions] error:', e);
    res.status(500).json({ questions: [], total: 0, subjects: [] });
  }
});

// PUT update AnKing question
app.put('/api/admin/anking/questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { id } = req.params;
    const { question, correct, explanation, category, difficulty } = req.body;
    const { error } = await supabase
      .from('questions')
      .update({ question, correct, explanation, category, difficulty })
      .eq('id', id);
    if (error) throw error;

    // Update in-memory cache
    const idx = questionBank.findIndex(q => q._supabase_id === id || q.id === id);
    if (idx !== -1) {
      questionBank[idx] = { ...questionBank[idx], question, correct, explanation, category, difficulty };
    }

    res.json({ success: true });
  } catch(e) {
    console.error('[PUT /api/admin/anking/questions/:id] error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE single AnKing question
app.delete('/api/admin/anking/questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { id } = req.params;
    if (id === 'all') {
      // Delete all AnKing questions
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('source', 'anki_import')
        .select('id');
      if (error) throw error;

      // Remove from in-memory cache
      questionBank = questionBank.filter(q => q.source !== 'anki_import');

      res.json({ success: true, deleted: data?.length || 0 });
    } else {
      // Delete single question
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;

      // Remove from in-memory cache
      questionBank = questionBank.filter(q => q._supabase_id !== id && q.id !== id);

      res.json({ success: true });
    }
  } catch(e) {
    console.error('[DELETE /api/admin/anking/questions/:id] error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE all AnKing questions
app.delete('/api/admin/anking/questions/all', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  try {
    const { data, error } = await supabase
      .from('questions')
      .delete()
      .eq('source', 'anki_import')
      .select('id');
    if (error) throw error;

    // Remove from in-memory cache
    questionBank = questionBank.filter(q => q.source !== 'anki_import');

    res.json({ success: true, deleted: data?.length || 0 });
  } catch(e) {
    console.error('[DELETE /api/admin/anking/questions/all] error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET AnKing stats
app.get('/api/admin/anking/stats', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ total: 0, easy: 0, hard: 0, subjects: [], topics: [] });
  try {
    const { count: total } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'anki_import');

    const { count: easy } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'anki_import')
      .eq('difficulty', 'easy');

    const { count: hard } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'anki_import')
      .eq('difficulty', 'hard');

    const { data: subjectData } = await supabase
      .from('questions')
      .select('category')
      .eq('source', 'anki_import')
      .not('category', 'is', null);

    const { data: topicData } = await supabase
      .from('questions')
      .select('topic_id')
      .eq('source', 'anki_import')
      .not('topic_id', 'is', null);

    // Count by subject
    const subjectCounts = {};
    subjectData?.forEach(q => {
      if (q.category) subjectCounts[q.category] = (subjectCounts[q.category] || 0) + 1;
    });
    const subjects = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count);

    const uniqueTopics = [...new Set(topicData?.map(t => t.topic_id).filter(Boolean))];

    res.json({ total, easy, hard, subjects, topics: uniqueTopics.map(t => ({ topic: t })) });
  } catch(e) {
    console.error('[GET /api/admin/anking/stats] error:', e);
    res.status(500).json({ total: 0, easy: 0, hard: 0, subjects: [], topics: [] });
  }
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

// Get user's clan
app.get('/api/clans/user/:userId', async (req, res) => {
  if (!supabase) return res.json(null);
  try {
    const { userId } = req.params;
    const { data: membership } = await supabase
      .from('clan_members')
      .select('*, clan:clan_id(*)')
      .eq('user_id', userId)
      .single();

    if (!membership?.clan) return res.json(null);

    res.json(membership.clan);
  } catch (err) {
    console.error('[clans/user] Error:', err.message);
    res.json(null);
  }
});

// Get clan details with members
app.get('/api/clans/:clanId', async (req, res) => {
  if (!supabase) return res.json(null);
  try {
    const { clanId } = req.params;

    // Get clan info
    const { data: clan } = await supabase
      .from('clans')
      .select('*')
      .eq('id', clanId)
      .single();

    if (!clan) return res.json(null);

    // Get clan members with user details
    const { data: members } = await supabase
      .from('clan_members')
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url,
          level,
          xp,
          wins,
          losses
        )
      `)
      .eq('clan_id', clanId);

    // Enhance members with calculated fields
    const enhancedMembers = (members || []).map(m => ({
      ...m,
      user: {
        ...m.user,
        clan_xp: m.clan_xp || 0,
        trophies: m.trophies || 0,
        status: Math.random() > 0.6 ? 'online' : `${Math.floor(Math.random() * 24)}h ago`, // TODO: Real status
        last_seen: new Date().toISOString()
      }
    }));

    res.json({
      ...clan,
      members: enhancedMembers,
      perks: getClanPerks(clan.level)
    });
  } catch (err) {
    console.error('[clans/:id] Error:', err.message);
    res.status(500).json(null);
  }
});

// Get clan chat messages
app.get('/api/clans/:clanId/chat', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { clanId } = req.params;

    // Check if clan_chat table exists
    const { data, error } = await supabase
      .from('clan_chat')
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('clan_id', clanId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[clans/chat] Error:', error.message);
      return res.json([]);
    }

    // Return messages in chronological order
    res.json((data || []).reverse());
  } catch (err) {
    console.error('[clans/chat] Error:', err.message);
    res.json([]);
  }
});

// Send clan chat message
app.post('/api/clans/:clanId/chat', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId } = req.params;
    const { userId, message } = req.body;

    if (!userId || !message?.trim()) {
      return res.status(400).json({ success: false, error: 'userId and message required' });
    }

    // Insert message
    const { data, error } = await supabase
      .from('clan_chat')
      .insert({
        clan_id: clanId,
        user_id: userId,
        message: message.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('[clans/chat/post] Error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: data });
  } catch (err) {
    console.error('[clans/chat/post] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── JOIN REQUEST ─────────────────────────────────────
app.post('/api/clans/:clanId/request', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId } = req.params;
    const { userId, message } = req.body;

    // Check not already in a clan
    const { data: existing } = await supabase
      .from('clan_members')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (existing) return res.status(400).json({ success: false, error: 'Already in a clan' });

    // Check not already requested
    const { data: requested } = await supabase
      .from('clan_join_requests')
      .select('id, status')
      .eq('clan_id', clanId)
      .eq('user_id', userId)
      .single();
    if (requested) return res.status(400).json({ success: false, error: 'Request already sent' });

    // Get clan to check if Open type
    const { data: clan } = await supabase
      .from('clans')
      .select('type, required_trophies')
      .eq('id', clanId)
      .single();

    if (clan?.type === 'Open') {
      // Auto join for open clans
      await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: userId,
        role: 'Member',
        joined_at: new Date().toISOString(),
        clan_xp: 0,
        trophies: 0
      });
      return res.json({ success: true, joined: true, message: 'Joined clan!' });
    }

    // Create join request for invite-only clans
    const { error } = await supabase
      .from('clan_join_requests')
      .insert({ clan_id: clanId, user_id: userId, message: message || '', status: 'pending' });

    if (error) throw error;
    res.json({ success: true, joined: false, message: 'Join request sent!' });
  } catch(e) {
    console.error('[clan/request] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── GET JOIN REQUESTS (for leader/elder) ─────────────
app.get('/api/clans/:clanId/requests', async (req, res) => {
  if (!supabase) return res.status(503).json([]);
  try {
    const { clanId } = req.params;
    const { data } = await supabase
      .from('clan_join_requests')
      .select('*, user:user_id(id, username, level, xp, avatar_url)')
      .eq('clan_id', clanId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch(e) {
    console.error('[clan/requests/get] Error:', e.message);
    res.json([]);
  }
});

// ── APPROVE/DENY JOIN REQUEST ─────────────────────────
app.post('/api/clans/:clanId/requests/:requestId/:action', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId, requestId, action } = req.params;
    const { leaderId } = req.body;

    // Verify requester is leader/elder
    const { data: leaderMember } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', leaderId)
      .single();
    if (!leaderMember || !['Leader', 'Elder'].includes(leaderMember.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const { data: request } = await supabase
      .from('clan_join_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

    if (action === 'approve') {
      await supabase.from('clan_members').insert({
        clan_id: clanId,
        user_id: request.user_id,
        role: 'Member',
        joined_at: new Date().toISOString(),
        clan_xp: 0,
        trophies: 0
      });
    }

    await supabase
      .from('clan_join_requests')
      .update({ status: action === 'approve' ? 'approved' : 'denied' })
      .eq('id', requestId);

    res.json({ success: true });
  } catch(e) {
    console.error('[clan/requests/action] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── LEAVE/KICK CLAN ─────────────────────────────────────
app.delete('/api/clans/:clanId/members/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId, userId } = req.params;
    const { kickedBy } = req.body;

    // Check if being kicked by someone else
    if (kickedBy && kickedBy !== userId) {
      const { data: kicker } = await supabase
        .from('clan_members')
        .select('role')
        .eq('clan_id', clanId)
        .eq('user_id', kickedBy)
        .single();
      if (!kicker || !['Leader', 'Elder'].includes(kicker.role)) {
        return res.status(403).json({ success: false, error: 'Not authorized to kick members' });
      }
    }

    // Check if user is the leader
    const { data: member } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', userId)
      .single();

    if (member?.role === 'Leader') {
      // Count other members
      const { count } = await supabase
        .from('clan_members')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clanId);

      if (count > 1) {
        return res.status(400).json({ success: false, error: 'Transfer leadership before leaving' });
      }

      // Last member - delete clan
      await supabase.from('clans').delete().eq('id', clanId);
    }

    await supabase
      .from('clan_members')
      .delete()
      .eq('clan_id', clanId)
      .eq('user_id', userId);

    res.json({ success: true });
  } catch(e) {
    console.error('[clan/members/delete] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── PROMOTE/DEMOTE MEMBER ─────────────────────────────
app.put('/api/clans/:clanId/members/:userId/role', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId, userId } = req.params;
    const { newRole, leaderId } = req.body;

    // Verify requester is Leader
    const { data: leader } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', leaderId)
      .single();
    if (!leader || leader.role !== 'Leader') {
      return res.status(403).json({ success: false, error: 'Only the Leader can change roles' });
    }

    const { error } = await supabase
      .from('clan_members')
      .update({ role: newRole })
      .eq('clan_id', clanId)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch(e) {
    console.error('[clan/members/role] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── UPDATE CLAN SETTINGS ─────────────────────────────
app.put('/api/clans/:clanId', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId } = req.params;
    const { leaderId, name, description, type, location, required_trophies, tag, banner_url, crest_url } = req.body;

    const { data: leader } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', leaderId)
      .single();
    if (!leader || leader.role !== 'Leader') {
      return res.status(403).json({ success: false, error: 'Only the Leader can update clan settings' });
    }

    const updateData = {
      name,
      description,
      type,
      location,
      required_trophies,
      tag: tag?.toUpperCase().slice(0, 5)
    };

    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (crest_url !== undefined) updateData.crest_url = crest_url;

    const { error } = await supabase
      .from('clans')
      .update(updateData)
      .eq('id', clanId);

    if (error) throw error;
    res.json({ success: true });
  } catch(e) {
    console.error('[clan/update] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── BROWSE CLANS ─────────────────────────────────────
app.get('/api/clans', async (req, res) => {
  if (!supabase) return res.status(503).json({ clans: [], total: 0 });
  try {
    const { search, type, sort = 'score', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('clans')
      .select('*, member_count:clan_members(count)', { count: 'exact' })
      .order(sort, { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (search) query = query.ilike('name', `%${search}%`);
    if (type) query = query.eq('type', type);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ clans: data || [], total: count || 0 });
  } catch(e) {
    console.error('[clans/browse] Error:', e.message);
    res.json({ clans: [], total: 0 });
  }
});

// ── ONLINE STATUS ─────────────────────────────────────
app.post('/api/users/online-status', async (req, res) => {
  if (!supabase) return res.json({});
  try {
    const { userIds } = req.body;
    if (!userIds || !userIds.length) return res.json({});

    const { data } = await supabase
      .from('users')
      .select('id, is_online, last_seen')
      .in('id', userIds);

    const statusMap = {};
    data?.forEach(u => {
      statusMap[u.id] = {
        online: u.is_online || false,
        lastSeen: u.last_seen
      };
    });

    res.json(statusMap);
  } catch(e) {
    console.error('[online-status] Error:', e.message);
    res.status(500).json({});
  }
});

// ── CLAN QUESTS ─────────────────────────────────────
app.get('/api/clans/:clanId/quests', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { clanId } = req.params;
    const { data, error } = await supabase
      .from('clan_quests')
      .select('*')
      .eq('clan_id', clanId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch(e) {
    console.error('[clan/quests/get] Error:', e.message);
    res.json([]);
  }
});

app.post('/api/clans/:clanId/quests', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Database not configured' });
  try {
    const { clanId } = req.params;
    const { userId, name, description, type, target, reward_gems, reward_coins, reward_xp, expires_hours } = req.body;

    // Verify leader/elder
    const { data: member } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clanId)
      .eq('user_id', userId)
      .single();

    if (!member || !['Leader', 'Elder'].includes(member.role)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const expiresAt = expires_hours
      ? new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days default

    const { data, error } = await supabase
      .from('clan_quests')
      .insert({
        clan_id: clanId,
        name,
        description,
        type: type || 'damage',
        target: target || 1000,
        progress: 0,
        reward_gems: reward_gems || 50,
        reward_coins: reward_coins || 500,
        reward_xp: reward_xp || 1000,
        status: 'active',
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, quest: data });
  } catch(e) {
    console.error('[clan/quests/post] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/clans/:clanId/quests/:questId/progress', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false });
  try {
    const { clanId, questId } = req.params;
    const { amount } = req.body;

    const { data: quest } = await supabase
      .from('clan_quests')
      .select('*')
      .eq('id', questId)
      .eq('clan_id', clanId)
      .single();

    if (!quest) return res.status(404).json({ success: false });

    const newProgress = Math.min(quest.target, (quest.progress || 0) + (amount || 0));
    const completed = newProgress >= quest.target;

    await supabase
      .from('clan_quests')
      .update({
        progress: newProgress,
        status: completed ? 'completed' : 'active'
      })
      .eq('id', questId);

    // If completed, reward all clan members
    if (completed && quest.status !== 'completed') {
      const { data: members } = await supabase
        .from('clan_members')
        .select('user_id')
        .eq('clan_id', clanId);

      for (const member of (members || [])) {
        const { data: userData } = await supabase
          .from('users')
          .select('coins, gems, xp')
          .eq('id', member.user_id)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({
              coins: (userData.coins || 0) + (quest.reward_coins || 0),
              gems: (userData.gems || 0) + (quest.reward_gems || 0),
              xp: (userData.xp || 0) + (quest.reward_xp || 0)
            })
            .eq('id', member.user_id);
        }
      }
    }

    res.json({ success: true, progress: newProgress, completed });
  } catch(e) {
    console.error('[clan/quests/progress] Error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/clans/:clanId/quests/:questId', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false });
  try {
    const { clanId, questId } = req.params;
    await supabase.from('clan_quests').delete().eq('id', questId).eq('clan_id', clanId);
    res.json({ success: true });
  } catch(e) {
    console.error('[clan/quests/delete] Error:', e.message);
    res.status(500).json({ success: false });
  }
});

// ── CLAN RANKINGS ─────────────────────────────────────
const updateClanRankings = async () => {
  if (!supabase) return;
  try {
    const { data: clans } = await supabase
      .from('clans')
      .select('id, score, xp')
      .order('score', { ascending: false });

    if (!clans) return;

    for (let i = 0; i < clans.length; i++) {
      await supabase
        .from('clans')
        .update({ rank: i + 1 })
        .eq('id', clans[i].id);
    }

    console.log(`[Rankings] Updated ${clans.length} clan rankings`);
  } catch(e) {
    console.error('[Rankings] Error:', e.message);
  }
};

// Run rankings update every hour
setInterval(updateClanRankings, 60 * 60 * 1000);

// Also run on startup
setTimeout(updateClanRankings, 5000);

app.get('/api/clans/rankings', async (req, res) => {
  if (!supabase) return res.json({ clans: [], total: 0 });
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data, count } = await supabase
      .from('clans')
      .select('id, name, tag, score, rank, level, xp, banner_url, member_count:clan_members(count)', { count: 'exact' })
      .order('rank', { ascending: true })
      .range(offset, offset + parseInt(limit) - 1);

    res.json({ clans: data || [], total: count || 0 });
  } catch(e) {
    console.error('[rankings] Error:', e.message);
    res.json({ clans: [], total: 0 });
  }
});

app.post('/api/clans/:clanId/score', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false });
  try {
    const { clanId } = req.params;
    const { amount } = req.body;

    const { data: clan } = await supabase
      .from('clans')
      .select('score, xp')
      .eq('id', clanId)
      .single();

    if (!clan) return res.status(404).json({ success: false });

    await supabase
      .from('clans')
      .update({
        score: (clan.score || 0) + (amount || 0),
        xp: (clan.xp || 0) + (amount || 0)
      })
      .eq('id', clanId);

    res.json({ success: true });
  } catch(e) {
    console.error('[clan/score] Error:', e.message);
    res.status(500).json({ success: false });
  }
});

// Weekly trophies reset - run every Monday
const resetWeeklyTrophies = async () => {
  if (!supabase) return;
  try {
    await supabase.from('clans').update({ weekly_trophies: 0 });
    console.log('[Rankings] Weekly trophies reset');
  } catch(e) {
    console.error('[Rankings] Weekly reset error:', e.message);
  }
};

// Check if it's Monday and reset (simplified - in production use a proper cron)
const checkWeeklyReset = () => {
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() === 0) {
    resetWeeklyTrophies();
  }
};
setInterval(checkWeeklyReset, 60 * 60 * 1000); // Check every hour

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

app.get('/api/leaderboard/clans', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { data, error } = await supabase
      .from('clans')
      .select('id, name, tag, score, rank, level, xp, banner_url, member_count:clan_members(count)')
      .order('score', { ascending: false })
      .limit(50);

    if (error) throw error;

    const clans = (data || []).map((clan, i) => ({
      ...clan,
      rank: i + 1,
      memberCount: clan.member_count?.[0]?.count || 0,
    }));

    res.json(clans);
  } catch(e) {
    console.error('[leaderboard/clans] Error:', e.message);
    res.json([]);
  }
});

// ── Friends API ────────────────────────────────────────────────────────────────
/*
SQL to run in Supabase dashboard to create friends table:

CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
*/

// Search users by username
app.get('/api/users/search', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { q, currentUserId } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const { data } = await supabase
      .from('users')
      .select('id, username, level, xp, avatar_url')
      .ilike('username', `%${q}%`)
      .neq('id', currentUserId)
      .limit(10);
    res.json(data || []);
  } catch(e) {
    console.error('[Friends] Search users error:', e);
    res.status(500).json([]);
  }
});

// Get friends list for a user
app.get('/api/friends/:userId', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { userId } = req.params;
    // Get all friendships where user is either user_id or friend_id and status is accepted
    const { data } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (!data || data.length === 0) return res.json([]);

    // Get user details for all friends
    const friendIds = data.map(f => f.user_id === userId ? f.friend_id : f.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username, level, xp, avatar_url')
      .in('id', friendIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const friendsList = data.map(f => {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      return {
        id: f.id,
        user_id: f.user_id,
        friend_id: f.friend_id,
        friend: userMap[friendId] || { id: friendId, username: 'Unknown' },
        requester: userMap[f.user_id] || { id: f.user_id, username: 'Unknown' },
      };
    });

    res.json(friendsList);
  } catch(e) {
    console.error('[Friends] Get friends error:', e);
    res.status(500).json([]);
  }
});

// Get pending friend requests for a user (requests sent TO this user)
app.get('/api/friends/requests/:userId', async (req, res) => {
  if (!supabase) return res.json([]);
  try {
    const { userId } = req.params;
    const { data } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (!data || data.length === 0) return res.json([]);

    // Get requester details
    const requesterIds = data.map(f => f.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, username, level, xp, avatar_url')
      .in('id', requesterIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u; });

    const requests = data.map(f => ({
      id: f.id,
      user_id: f.user_id,
      friend_id: f.friend_id,
      status: f.status,
      created_at: f.created_at,
      requester: userMap[f.user_id] || { id: f.user_id, username: 'Unknown' },
    }));

    res.json(requests);
  } catch(e) {
    console.error('[Friends] Get requests error:', e);
    res.status(500).json([]);
  }
});

// Send friend request
app.post('/api/friends/request', async (req, res) => {
  if (!supabase) return res.json({ success: false, message: 'Database not configured' });
  try {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
      return res.json({ success: false, message: 'Missing user IDs' });
    }

    if (userId === friendId) {
      return res.json({ success: false, message: 'Cannot add yourself as friend' });
    }

    // Check if friendship already exists in either direction
    const { data: existing } = await supabase
      .from('friends')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return res.json({ success: false, message: 'Already friends' });
      }
      return res.json({ success: false, message: 'Friend request already sent' });
    }

    // Create new friend request
    await supabase.from('friends').insert({
      user_id: userId,
      friend_id: friendId,
      status: 'pending'
    });

    res.json({ success: true, message: 'Friend request sent!' });
  } catch(e) {
    console.error('[Friends] Send request error:', e);
    res.status(500).json({ success: false, message: 'Error sending request' });
  }
});

// Accept friend request
app.post('/api/friends/accept', async (req, res) => {
  if (!supabase) return res.json({ success: false });
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.json({ success: false, message: 'Missing request ID' });
    }

    await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    res.json({ success: true });
  } catch(e) {
    console.error('[Friends] Accept request error:', e);
    res.status(500).json({ success: false });
  }
});

// Decline friend request or remove friend
app.delete('/api/friends/:friendshipId', async (req, res) => {
  if (!supabase) return res.json({ success: false });
  try {
    const { friendshipId } = req.params;

    if (!friendshipId) {
      return res.json({ success: false, message: 'Missing friendship ID' });
    }

    await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    res.json({ success: true });
  } catch(e) {
    console.error('[Friends] Remove friend error:', e);
    res.status(500).json({ success: false });
  }
});
// ── Lobby Invite API ───────────────────────────────────────────────────────────

app.post('/api/lobby/invite', async (req, res) => {
  try {
    const { fromUserId, fromUsername, toUserId, lobbyCode, gameMode } = req.body;

    // Store invite notification in announcements or a new invites concept
    // For now emit via socket if available
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(`user_${toUserId}`).emit('lobby_invite', {
        fromUserId,
        fromUsername,
        lobbyCode,
        gameMode,
        timestamp: new Date().toISOString()
      });
    }

    // Also store in database for persistence
    await supabase.from('announcements').insert({
      type: 'lobby_invite',
      user_id: toUserId,
      message: `${fromUsername} invited you to a ${gameMode} game!${lobbyCode ? ` Code: ${lobbyCode}` : ''}`,
      metadata: JSON.stringify({ fromUserId, fromUsername, lobbyCode, gameMode }),
      created_at: new Date().toISOString()
    }).catch(() => {}); // don't fail if table structure differs

    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
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
    'hardModeTimer','hardModeExplanationTime',
    'journeyThreshold',
  ];
  // Boolean fields
  const boolFields = [
    'allowGuests','allowQuickJoin',
    'modesBattleRoyale','modesSpeedRace','modesTriviaPursuit','modesScanMaster','modesTower',
    'dailyChallengeEnabled','weeklyTournamentEnabled','powerUpsEnabled',
    'maintenanceMode','showStreakCounter','showPlayerCount','showCorrectAnswer',
    'showGameLeaderboard','soundEffectsEnabled','backgroundMusicEnabled',
    'navbarBlurEnabled',
    'hardModeHideExplanations',
  ];
  for (const k of numFields)  { if (b[k] !== undefined) gameSettings[k] = Number(b[k]); }
  for (const k of boolFields) { if (b[k] !== undefined) gameSettings[k] = Boolean(b[k]); }

  // Hero background dimming
  if (b.hero_bg_dim_enabled !== undefined) gameSettings.hero_bg_dim_enabled = Boolean(b.hero_bg_dim_enabled);
  if (b.hero_bg_dim_opacity !== undefined) gameSettings.hero_bg_dim_opacity = Number(b.hero_bg_dim_opacity);
  if (b.maintenanceMessage !== undefined) gameSettings.maintenanceMessage = String(b.maintenanceMessage).slice(0, 500);
  // Hard Mode strings
  if (b.hardModeDescription !== undefined) gameSettings.hardModeDescription = String(b.hardModeDescription).slice(0, 200);
  if (b.hardModeLabel !== undefined) gameSettings.hardModeLabel = String(b.hardModeLabel).slice(0, 30);
  // Zone names and descriptions
  for (let i = 1; i <= 10; i++) {
    const nk = `towerZone${i}Name`, dk = `towerZone${i}Desc`;
    if (b[nk] !== undefined) gameSettings[nk] = String(b[nk]).slice(0, 100);
    if (b[dk] !== undefined) gameSettings[dk] = String(b[dk]).slice(0, 500);
  }
  // Play Page configs (stored as JSON)
  if (b.game_modes_config !== undefined) gameSettings.game_modes_config = b.game_modes_config;
  if (b.exam_boards_config !== undefined) gameSettings.exam_boards_config = b.exam_boards_config;
  // First Aid Journey active subjects (array of journey subject ids)
  if (Array.isArray(b.journeyActiveSubjects)) {
    gameSettings.journeyActiveSubjects = b.journeyActiveSubjects.slice(0, 32).map(String);
  }
  // Persist to Supabase so settings survive server restarts
  console.log('[admin/settings] Updated gameSettings, now persisting to DB...');
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
          why_others_wrong: q.why_others_wrong || undefined,
          explanation_image_url: q.explanation_image_url || undefined,
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
    console.log('[DEBUG-CORRECT] Full raw question:', JSON.stringify({
      correct: raw.correct,
      answer: raw.answer,
      choices: raw.choices,
      options: raw.options
    }));
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

    // Normalize all alias fields (options/choices, correct/answer/correct_letter,
    // category/subject, difficulty, explanation, game_modes) in one place
    const n = normalizeImport(raw, { defaultCategory, defaultDifficulty });
    const { subject, options, difficulty, correct, explanation, why_others_wrong } = n;
    const gameModes = n.game_modes;

    // DEBUG (remove in Phase B): trace correct-field resolution
    const rawCorrect = String(raw.correct || raw.answer || raw.correct_letter || '').trim().toUpperCase();
    console.log(`[bulk-import] Q${i + 1} Correct field resolution:`, {
      rawAnswer: raw.answer,
      rawCorrect: raw.correct,
      rawCorrectLetter: raw.correct_letter,
      resolved: rawCorrect,
      isEmpty: !rawCorrect,
      normalizedTo: correct,
      optionsLength: options.length,
    });

    // Generate question_id if not provided
    const questionId = raw.question_id || raw.id || nextQuestionId(subject);

    // Look up topic_id from topic name if provided, otherwise use passed topic_id from context
    // Topic is optional - admin selects folder/topic in UI before importing
    let resolvedTopicId = raw.topic_id || topic_id || null;
    const topicName = raw.topic || raw.folder;
    if (topicName && !resolvedTopicId) {
      try {
        const { data: topicData } = await supabase
          .from('topics')
          .select('id')
          .ilike('name', topicName)
          .maybeSingle();
        if (topicData) {
          resolvedTopicId = topicData.id;
          console.log(`[bulk-import] Q${i + 1} Found topic by name "${topicName}": ${resolvedTopicId}`);
        } else {
          console.log(`[bulk-import] Q${i + 1} Topic "${topicName}" not found in topics table`);
        }
      } catch (err) {
        console.log(`[bulk-import] Q${i + 1} Topic lookup error: ${err.message}`);
      }
    } else if (topic_id && !raw.topic_id && !topicName) {
      console.log(`[bulk-import] Q${i + 1} Using topic_id from import context: ${topic_id}`);
    }

    console.log(`[bulk-import] Q${i + 1} Normalized: category=${subject}${raw.category || raw.subject ? '' : ' (from context)'}, difficulty=${difficulty}, options=${options.length}, correct=${correct.substring(0, 30)}..., questionId=${questionId}, topic_id=${resolvedTopicId || 'none'}`);

    console.log('[DEBUG-INSERT] correct being saved:', correct);

    // Build record for Supabase
    const record = {
      question_id: questionId,
      question: n.question,
      choices: options,
      correct: correct,
      explanation: explanation,
      why_others_wrong: why_others_wrong || null,
      category: subject,
      difficulty: difficulty,
      game_modes: gameModes,
      image_url: n.image_url,
      tower_floor: n.tower_floor,
      buzz_type: n.buzz_type,
      topic_id: resolvedTopicId,
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
            why_others_wrong: record.why_others_wrong,
            category: subject,
            difficulty: difficulty,
            game_modes: gameModes,
            topic_id: resolvedTopicId,
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

const LANDING_IMAGE_SLOTS = ['hero_bg', 'battle_royale', 'speed_race', 'tower', 'more_to_come', 'journey_bg'];

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
    hero_bg_dim_enabled: gameSettings.hero_bg_dim_enabled,
    hero_bg_dim_opacity: gameSettings.hero_bg_dim_opacity,
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

// ── Play Page Background ──────────────────────────────────────────────────────

// Get play page background
app.get('/admin/play-page-bg', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data } = await supabase
      .from('game_settings')
      .select('value')
      .eq('key', 'play_page_background')
      .single();

    res.json({ background_url: data?.value || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload play page background
app.post('/admin/play-page-bg', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { base64, filename, mimeType } = req.body;

  if (!base64 || !filename) {
    return res.status(400).json({ error: 'Missing required fields: base64, filename' });
  }

  try {
    // Remove data URL prefix
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const ext = filename.split('.').pop();
    const uniqueName = `play_page_bg_${Date.now()}.${ext}`;
    const filePath = `play-page/${uniqueName}`;

    // Delete old image if exists
    const { data: existing } = await supabase
      .from('game_settings')
      .select('value')
      .eq('key', 'play_page_background')
      .single();

    if (existing?.value) {
      const urlParts = existing.value.split('/');
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

    const background_url = urlData.publicUrl;

    // Save to database
    const { error: dbError } = await supabase
      .from('game_settings')
      .upsert({
        key: 'play_page_background',
        value: background_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (dbError) throw dbError;

    res.json({ ok: true, background_url });
  } catch (err) {
    console.error('[/admin/play-page-bg POST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete play page background
app.delete('/admin/play-page-bg', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });

  try {
    // Get current image URL to delete from storage
    const { data: existing } = await supabase
      .from('game_settings')
      .select('value')
      .eq('key', 'play_page_background')
      .single();

    if (existing?.value) {
      const urlParts = existing.value.split('/');
      const fileName = urlParts.slice(-2).join('/');
      await supabase.storage.from('home-images').remove([fileName]);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('game_settings')
      .delete()
      .eq('key', 'play_page_background');
    if (dbError) throw dbError;

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload game mode image
app.post('/admin/game-mode-image', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { mode_id, base64, filename, mimeType } = req.body;

  if (!mode_id || !base64 || !filename) {
    return res.status(400).json({ error: 'Missing required fields: mode_id, base64, filename' });
  }

  try {
    // Remove data URL prefix
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const ext = filename.split('.').pop();
    const uniqueName = `game_mode_${mode_id}_${Date.now()}.${ext}`;
    const filePath = `game-modes/${uniqueName}`;

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

    console.log(`[/admin/game-mode-image POST] Successfully saved image for ${mode_id}:`, image_url.substring(0, 60) + '...');
    res.json({ ok: true, mode_id, image_url });
  } catch (err) {
    console.error('[/admin/game-mode-image POST] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/questions', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured. Cannot save questions.' });

  const { subject, difficulty, question, options, correct, explanation, why_others_wrong, image_url, explanation_image_url, game_modes, tower_floor, buzz_type, topic_id } = req.body;
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
    why_others_wrong: why_others_wrong || null,
    explanation_image_url: explanation_image_url || null,
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
      why_others_wrong: record.why_others_wrong || undefined,
      explanation_image_url: record.explanation_image_url || undefined,
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
  const record = toDb(updated);

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

// ── Anki Import API ────────────────────────────────────────────────────────────

// Preview endpoint - shows first 5 cards without importing
app.post('/api/admin/preview-anki', ankiUpload.single('apkg'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const tmpDir = path.join(os.tmpdir(), `anki-preview-${Date.now()}`);

  try {
    console.log('[preview-anki] Extracting .apkg file (preview mode)');
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(tmpDir, true);

    let dbPath = path.join(tmpDir, 'collection.anki21');
    if (!fs.existsSync(dbPath)) dbPath = path.join(tmpDir, 'collection.anki2');
    if (!fs.existsSync(dbPath)) {
      const files = fs.readdirSync(tmpDir);
      return res.status(400).json({ error: 'No collection database found in .apkg file' });
    }

    // Initialize sql.js and load database
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    // Get total count FAST - this is the main metric users care about
    const countResult = db.exec('SELECT COUNT(*) as count FROM notes');
    const totalCount = countResult[0]?.values?.[0]?.[0] || 0;
    console.log(`[preview-anki] Found ${totalCount} total cards`);

    // Get deck/model info
    const colResult = db.exec('SELECT decks, models FROM col');
    const colRow = colResult[0]?.values?.[0];
    const decks = JSON.parse(colRow?.[0] || '{}');
    const models = JSON.parse(colRow?.[1] || '{}');

    // Only get FIRST 3 notes for preview - much faster than 5
    const notesResult = db.exec('SELECT id, mid, flds, tags FROM notes LIMIT 3');
    const notes = notesResult[0]?.values?.map(row => ({
      id: row[0],
      mid: row[1],
      flds: row[2],
      tags: row[3]
    })) || [];

    // Limit deck names to 30 and filter out "Default"
    const deckNames = Object.values(decks)
      .map(d => d.name)
      .filter(n => n !== 'Default')
      .slice(0, 30);

    const modelFieldNames = {};
    Object.values(models).forEach(m => {
      modelFieldNames[m.id] = m.flds.map(f => f.name);
    });

    const stripHtml = (h) => h?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || '';

    const preview = notes.map(note => {
      const fields = note.flds.split('\x1f');
      const fieldNames = modelFieldNames[note.mid] || [];
      return {
        fields: fieldNames,
        values: fields.map(f => stripHtml(f).substring(0, 200)),
        tags: note.tags?.trim().substring(0, 100)
      };
    });

    db.close();

    // Cleanup immediately
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.unlinkSync(req.file.path);
    } catch(_) {}

    console.log('[preview-anki] Preview complete');
    res.json({ totalCards: totalCount, deckNames, preview });

  } catch(e) {
    console.error('[preview-anki] Error:', e);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (req.file?.path) fs.unlinkSync(req.file.path);
    } catch(_) {}
    res.status(500).json({ error: e.message });
  }
});

// Full import endpoint
app.post('/api/admin/import-anki', ankiUpload.single('apkg'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const tmpDir = path.join(os.tmpdir(), `anki-extract-${Date.now()}`);

  try {
    console.log('[import-anki] Extracting .apkg file:', req.file.path);
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(tmpDir, true);

    // .apkg can contain collection.anki2 or collection.anki21
    let dbPath = path.join(tmpDir, 'collection.anki21');
    if (!fs.existsSync(dbPath)) {
      dbPath = path.join(tmpDir, 'collection.anki2');
    }
    if (!fs.existsSync(dbPath)) {
      const files = fs.readdirSync(tmpDir);
      console.log('[import-anki] Files in extracted zip:', files);
      return res.status(400).json({ error: 'No collection database found in .apkg file. Files found: ' + files.join(', ') });
    }

    console.log('[import-anki] Opening database:', dbPath);
    // Initialize sql.js and load database
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    // Get deck names for subject mapping
    const colResult = db.exec('SELECT decks, models FROM col');
    const colRow = colResult[0]?.values?.[0];
    const decks = JSON.parse(colRow?.[0] || '{}');
    const models = JSON.parse(colRow?.[1] || '{}');

    console.log('[import-anki] Deck names:', Object.values(decks).map(d => d.name));

    // Get all notes with their model info
    const notesResult = db.exec('SELECT id, mid, flds, tags FROM notes');
    const notes = notesResult[0]?.values?.map(row => ({
      id: row[0],
      mid: row[1],
      flds: row[2],
      tags: row[3]
    })) || [];
    console.log(`[import-anki] Found ${notes.length} notes`);

    // Get cards to map note->deck
    const cardsResult = db.exec('SELECT nid, did FROM cards');
    const cards = cardsResult[0]?.values?.map(row => ({
      nid: row[0],
      did: row[1]
    })) || [];
    const noteToDeck = {};
    cards.forEach(c => { noteToDeck[c.nid] = c.did; });

    // Get model fields to know field names
    const modelFieldNames = {};
    Object.values(models).forEach(model => {
      modelFieldNames[model.id] = model.flds.map(f => f.name);
    });

    let imported = 0;
    let skipped = 0;
    let duplicate = 0;
    const errors = [];
    const BATCH_SIZE = 50;
    let batch = [];

    const stripHtml = (html) => {
      if (!html) return '';
      return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    };

    const getDeckName = (deckId) => {
      const deck = decks[deckId];
      if (!deck) return 'General';
      // AnkiNG format: "AnKing::SubDeck::Topic"
      const parts = deck.name.split('::');
      return parts[parts.length - 1] || parts[0] || 'General';
    };

    const getSubjectFromDeck = (deckId) => {
      const deck = decks[deckId];
      if (!deck) return 'General';
      const parts = deck.name.split('::');
      // Return second level as subject if available
      return parts[1] || parts[0] || 'General';
    };

    for (const note of notes) {
      try {
        const fields = note.flds.split('\x1f');
        const fieldNames = modelFieldNames[note.mid] || [];

        // Map fields by name if available, otherwise by position
        const fieldMap = {};
        fieldNames.forEach((name, i) => {
          fieldMap[name.toLowerCase()] = fields[i] || '';
        });

        // Try common AnkiNG field names
        const questionRaw = fieldMap['text'] || fieldMap['front'] || fieldMap['question'] || fieldMap['primary'] || fields[0] || '';
        const backRaw = fieldMap['back'] || fieldMap['answer'] || fieldMap['extra'] || fields[1] || '';
        const explanationRaw = fieldMap['explanation'] || fieldMap['extra'] || fieldMap['notes'] || fields[2] || '';

        const question = stripHtml(questionRaw);
        const back = stripHtml(backRaw);
        const explanation = stripHtml(explanationRaw);

        if (!question || question.length < 3) { skipped++; continue; }

        const deckId = noteToDeck[note.id];
        const tags = note.tags?.trim().split(' ').filter(Boolean) || [];
        const deckName = getDeckName(deckId);
        const subject = getSubjectFromDeck(deckId);

        // Determine if this looks like a multiple choice question
        // AnkiNG cards are typically cloze or basic - convert to multiple choice format
        const isMultipleChoice = back.includes('\n') && (back.includes('A)') || back.includes('1.'));

        // Try to parse options from back field if formatted
        let choices = [];
        let correct = '';

        if (isMultipleChoice) {
          // Try to parse "A) option1\nB) option2" format
          const lines = back.split('\n').filter(l => l.trim());
          choices = lines.map(l => l.replace(/^[A-D]\)\s*/, '').trim());
          correct = choices[0] || back.trim();
        } else {
          // For basic cards, create multiple choice from the answer
          const answer = back.trim();
          if (answer && answer.length > 0) {
            // Create dummy options - in production you'd want better logic
            choices = [answer];
            correct = answer;

            // Add some plausible distractors based on common patterns
            if (answer.toLowerCase().includes('true') || answer.toLowerCase().includes('false')) {
              choices = ['True', 'False'];
              correct = answer.toLowerCase().includes('true') ? 'True' : 'False';
            } else {
              // Just use the answer as the only option for now
              // Admin can edit to add more options later
              choices = [answer, 'Option B (edit me)', 'Option C (edit me)', 'Option D (edit me)'];
            }
          } else {
            skipped++;
            continue;
          }
        }

        if (choices.length < 2) {
          choices = [correct || 'Answer', 'Option B', 'Option C', 'Option D'];
        }

        // Generate question_id in format similar to your nextQuestionId function
        const subjectPrefix = subject.substring(0, 3).toUpperCase();
        const questionId = `${subjectPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Build question object matching YOUR questions table structure
        const questionObj = {
          question_id: questionId,
          question: question.substring(0, 2000), // limit length
          choices: choices.slice(0, 10), // max 10 options as per your validation
          correct: correct.substring(0, 500),
          explanation: explanation.substring(0, 2000) || 'No explanation provided',
          category: subject.substring(0, 100),
          difficulty: tags.includes('hard') || tags.includes('Hard') ? 'hard' : 'easy',
          game_modes: ['battle_royale', 'speed_race', 'trivia_pursuit', 'anking'],
          image_url: null,
          tower_floor: null,
          buzz_type: null,
          topic_id: null, // Will be null - admin can assign topics later
          source: 'anki_import' // Mark as imported from Anki
        };

        batch.push(questionObj);

        // Insert in batches of 50
        if (batch.length >= BATCH_SIZE) {
          const { data, error, count } = await supabase
            .from('questions')
            .insert(batch)
            .select('id');

          if (error) {
            console.error('[import-anki] Batch insert error:', error.message);
            // Try one by one to identify duplicates
            for (const q of batch) {
              const { error: singleError } = await supabase.from('questions').insert(q);
              if (singleError) {
                if (singleError.message?.includes('duplicate') || singleError.code === '23505') {
                  duplicate++;
                } else {
                  errors.push(singleError.message);
                  skipped++;
                }
              } else {
                imported++;
              }
            }
          } else {
            imported += batch.length;
          }
          batch = [];
        }

      } catch(e) {
        errors.push(`Note ${note.id}: ${e.message}`);
        skipped++;
      }
    }

    // Insert remaining batch
    if (batch.length > 0) {
      const { error } = await supabase.from('questions').insert(batch);
      if (error) {
        console.error('[import-anki] Final batch error:', error.message);
        for (const q of batch) {
          const { error: singleError } = await supabase.from('questions').insert(q);
          if (singleError) {
            if (singleError.code === '23505') duplicate++;
            else { errors.push(singleError.message); skipped++; }
          } else imported++;
        }
      } else {
        imported += batch.length;
      }
    }

    db.close();

    // Cleanup
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      fs.unlinkSync(req.file.path);
    } catch(e) { console.log('[import-anki] Cleanup error:', e.message); }

    console.log(`[import-anki] Complete: ${imported} imported, ${skipped} skipped, ${duplicate} duplicates`);

    // Reload question bank from Supabase
    if (imported > 0) {
      console.log('[import-anki] Reloading question bank...');
      await loadQuestionsFromSupabase();
    }

    res.json({
      success: true,
      imported,
      skipped,
      duplicate,
      total: notes.length,
      errors: errors.slice(0, 10)
    });

  } catch(e) {
    console.error('[import-anki] Error:', e);
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (req.file?.path) fs.unlinkSync(req.file.path);
    } catch(_) {}
    res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0,3) });
  }
});

// ── Topics API ─────────────────────────────────────────────────────────────────

app.get('/admin/topics', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ topics: [], groups: [] });
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
    // Groups are additive — fall back to [] if topic_groups doesn't exist yet
    let groups = [];
    try {
      let gq = supabase.from('topic_groups').select('*').order('name');
      if (category) gq = gq.eq('category', category);
      const { data: gData, error: gErr } = await gq;
      if (gErr) throw gErr;
      groups = (gData || []).map(g => ({ ...g, difficulty: g.difficulty || 'easy' }));
      if (difficulty) groups = groups.filter(g => g.difficulty === difficulty);
    } catch (e) {
      console.warn('[topics] topic_groups unavailable, returning groups: [] —', e.message);
      groups = [];
    }
    res.json({ topics, groups });
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
  const updates = {};
  if (name !== undefined) {
    if (!name?.trim()) return res.status(400).json({ error: 'name required' });
    updates.name = name.trim();
  }
  // 'in' check so an explicit group_id: null (ungroup) is distinguishable from "not provided"
  if ('group_id' in req.body) updates.group_id = req.body.group_id;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'name or group_id required' });
  try {
    const { data, error } = await supabase
      .from('topics')
      .update(updates)
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

// ── Topic groups (one-level grouping of topics) ───────────────────────────────

app.get('/admin/topic-groups', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ groups: [] });
  const { category, difficulty } = req.query;
  try {
    let query = supabase.from('topic_groups').select('*').order('name');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    // Filter difficulty in JS so NULL/missing values default to 'easy' (same as topics)
    let groups = (data || []).map(g => ({ ...g, difficulty: g.difficulty || 'easy' }));
    if (difficulty) groups = groups.filter(g => g.difficulty === difficulty);
    res.json({ groups });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/admin/topic-groups', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { name, category, difficulty } = req.body;
  if (!name?.trim() || !category) return res.status(400).json({ error: 'name and category required' });
  try {
    const { data, error } = await supabase
      .from('topic_groups')
      .insert({ name: name.trim(), category, difficulty: difficulty || 'easy' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/topic-groups/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  try {
    const { data, error } = await supabase
      .from('topic_groups')
      .update({ name: name.trim() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/topic-groups/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    // topics.group_id has ON DELETE SET NULL, so member topics become ungrouped
    const { error } = await supabase.from('topic_groups').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Training Grounds videos ───────────────────────────────────────────────────

// Extract { video_type, embed_id } from a YouTube/Vimeo URL; null for anything else.
// YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /embed/ID — IDs are 11 chars of [A-Za-z0-9_-]
// Vimeo:   vimeo.com/ID or vimeo.com/video/ID — numeric IDs
function parseVideoUrl(url) {
  if (typeof url !== 'string') return null;
  const s = url.trim();
  let m = s.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (m) return { video_type: 'youtube', embed_id: m[1] };
  m = s.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i);
  if (m) return { video_type: 'vimeo', embed_id: m[1] };
  return null;
}

// Resolve a video's attachment: topic_id → denormalize category/difficulty from the
// topic so the public category-filtered query also returns topic-attached videos.
async function resolveVideoAttachment({ topic_id, category, difficulty }) {
  if (topic_id) {
    const { data: topic, error } = await supabase.from('topics').select('*').eq('id', topic_id).single();
    if (error || !topic) throw new Error('Invalid topic_id — topic not found');
    return { topic_id, category: topic.category, difficulty: topic.difficulty || 'easy' };
  }
  if (!category || !difficulty) throw new Error('topic_id or category+difficulty required');
  return { topic_id: null, category, difficulty };
}

app.get('/admin/videos', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ videos: [] });
  const { category, difficulty, topic_id } = req.query;
  try {
    let query = supabase.from('videos').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (category)   query = query.eq('category', category);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (topic_id)   query = query.eq('topic_id', topic_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ videos: data || [] });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/admin/videos] unavailable, returning videos: [] —', err.message);
    res.json({ videos: [] });
  }
});

app.post('/admin/videos', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { title, url, topic_id, category, difficulty, sort_order } = req.body;
  if (!title?.trim() || !url?.trim()) return res.status(400).json({ error: 'title and url required' });
  const parsed = parseVideoUrl(url);
  if (!parsed) return res.status(400).json({ error: 'Only YouTube and Vimeo links are supported' });
  try {
    const attachment = await resolveVideoAttachment({ topic_id, category, difficulty });
    const { data, error } = await supabase
      .from('videos')
      .insert({
        title: title.trim(),
        url: url.trim(),
        video_type: parsed.video_type,
        embed_id: parsed.embed_id,
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
        ...attachment,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    const code = /required|not found/.test(err.message) ? 400 : 500;
    res.status(code).json({ error: err.message });
  }
});

app.put('/admin/videos/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { title, url, sort_order } = req.body;
  const updates = {};
  try {
    if (title !== undefined) {
      if (!title?.trim()) return res.status(400).json({ error: 'title required' });
      updates.title = title.trim();
    }
    if (url !== undefined) {
      const parsed = parseVideoUrl(url);
      if (!parsed) return res.status(400).json({ error: 'Only YouTube and Vimeo links are supported' });
      updates.url        = url.trim();
      updates.video_type = parsed.video_type;
      updates.embed_id   = parsed.embed_id;
    }
    if (Number.isFinite(sort_order)) updates.sort_order = sort_order;
    // 'in' check so re-attachment is explicit; topic_id null requires category+difficulty
    if ('topic_id' in req.body || 'category' in req.body || 'difficulty' in req.body) {
      Object.assign(updates, await resolveVideoAttachment({
        topic_id:   req.body.topic_id,
        category:   req.body.category,
        difficulty: req.body.difficulty,
      }));
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing to update' });
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    const code = /required|not found/.test(err.message) ? 400 : 500;
    res.status(code).json({ error: err.message });
  }
});

app.delete('/admin/videos/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { error } = await supabase.from('videos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── First Aid Journey: boss questions (admin) ─────────────────────────────────

// Validation shared by POST (full) and PUT (merged row): question present,
// >= 2 options, correct is a letter within the options range.
function bossQuestionError({ question, options, correct }) {
  if (!question?.trim()) return 'question required';
  if (!Array.isArray(options) || options.length < 2) return 'at least 2 options required';
  const letter = String(correct || '').trim().toUpperCase();
  const maxLetter = String.fromCharCode(64 + options.length); // 'A' + n - 1
  if (!/^[A-Z]$/.test(letter) || letter > maxLetter) return `correct must be a letter A–${maxLetter}`;
  return null;
}

app.get('/admin/boss-questions', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ questions: [] });
  const { subject, boss_key } = req.query;
  try {
    let query = supabase.from('boss_questions').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (subject)  query = query.eq('subject', subject);
    if (boss_key) query = query.eq('boss_key', boss_key);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ questions: data || [] });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/admin/boss-questions] unavailable, returning questions: [] —', err.message);
    res.json({ questions: [] });
  }
});

app.post('/admin/boss-questions', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { subject, boss_key, question, options, correct, explanation, why_others_wrong, image_url, explanation_image_url, sort_order } = req.body;
  if (!subject || !boss_key) return res.status(400).json({ error: 'subject and boss_key required' });
  const invalid = bossQuestionError({ question, options, correct });
  if (invalid) return res.status(400).json({ error: invalid });
  try {
    const { data, error } = await supabase
      .from('boss_questions')
      .insert({
        subject,
        boss_key,
        question: question.trim(),
        options,
        correct: String(correct).trim().toUpperCase(),
        explanation: explanation || null,
        why_others_wrong: why_others_wrong || null,
        image_url: image_url || null,
        explanation_image_url: explanation_image_url || null,
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/boss-questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data: existing, error: getErr } = await supabase
      .from('boss_questions').select('*').eq('id', req.params.id).single();
    if (getErr || !existing) return res.status(404).json({ error: 'Boss question not found' });

    const updates = {};
    for (const k of ['subject', 'boss_key', 'question', 'options', 'correct', 'explanation', 'why_others_wrong', 'image_url', 'explanation_image_url']) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Number.isFinite(req.body.sort_order)) updates.sort_order = req.body.sort_order;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing to update' });

    // Validate the merged row so partial updates can't corrupt a question
    const merged = { ...existing, ...updates };
    const invalid = bossQuestionError(merged);
    if (invalid) return res.status(400).json({ error: invalid });
    if (updates.question) updates.question = updates.question.trim();
    if (updates.correct)  updates.correct  = String(updates.correct).trim().toUpperCase();

    const { data, error } = await supabase
      .from('boss_questions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/boss-questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { error } = await supabase.from('boss_questions').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── First Aid Journey: chapters (admin) ───────────────────────────────────────

app.get('/admin/journey-chapters', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ chapters: [] });
  const { subject } = req.query;
  try {
    let query = supabase.from('journey_chapters').select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (subject) query = query.eq('subject', subject);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ chapters: data || [] });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/admin/journey-chapters] unavailable, returning chapters: [] —', err.message);
    res.json({ chapters: [] });
  }
});

app.post('/admin/journey-chapters', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { subject, name, sort_order } = req.body;
  if (!subject || !name?.trim()) return res.status(400).json({ error: 'subject and name required' });
  try {
    const { data, error } = await supabase
      .from('journey_chapters')
      .insert({
        subject,
        name: name.trim(),
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/journey-chapters/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const updates = {};
  if ('name' in req.body) {
    if (!req.body.name?.trim()) return res.status(400).json({ error: 'name required' });
    updates.name = req.body.name.trim();
  }
  if (Number.isFinite(req.body.sort_order)) updates.sort_order = req.body.sort_order;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing to update' });
  try {
    const { data, error } = await supabase
      .from('journey_chapters')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/journey-chapters/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    // boss_questions are linked by text key, not FK — clean them up here.
    // Levels and their questions cascade via FKs.
    await supabase.from('boss_questions').delete().eq('boss_key', `chapter:${req.params.id}`);
    const { error } = await supabase.from('journey_chapters').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tree counts for the admin in one shot: levels-per-chapter, questions-per-level,
// questions-per-boss-key. Grouped client-side from 3 id-only scans (one per table) —
// NOT a per-row N+1. Degrades to empty maps if the journey tables aren't migrated.
app.get('/admin/journey-counts', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ levels: {}, chapters: {}, bosses: {} });
  const { subject } = req.query;
  if (!subject) return res.status(400).json({ error: 'subject required' });
  try {
    // Chapters in this subject
    const { data: chs, error: chErr } = await supabase
      .from('journey_chapters').select('id').eq('subject', subject);
    if (chErr) throw chErr;
    const chapterIds = (chs || []).map(c => c.id);

    // Levels in those chapters
    let levelRows = [];
    if (chapterIds.length > 0) {
      const { data: lv, error: lvErr } = await supabase
        .from('journey_levels').select('id, chapter_id').in('chapter_id', chapterIds);
      if (lvErr) throw lvErr;
      levelRows = lv || [];
    }

    // chapter_id -> level count (every chapter present, even with 0 levels)
    const chapters = {};
    for (const id of chapterIds) chapters[id] = 0;
    for (const l of levelRows) chapters[l.chapter_id] = (chapters[l.chapter_id] || 0) + 1;

    // level_id -> question count
    const levels = {};
    const levelIds = levelRows.map(l => l.id);
    if (levelIds.length > 0) {
      const { data: qs, error: qErr } = await supabase
        .from('journey_questions').select('level_id').in('level_id', levelIds);
      if (qErr) throw qErr;
      for (const q of (qs || [])) levels[q.level_id] = (levels[q.level_id] || 0) + 1;
    }

    // boss_key -> question count (chapter bosses + ultimate)
    const bosses = {};
    const { data: bq, error: bErr } = await supabase
      .from('boss_questions').select('boss_key').eq('subject', subject);
    if (bErr) throw bErr;
    for (const b of (bq || [])) bosses[b.boss_key] = (bosses[b.boss_key] || 0) + 1;

    res.json({ levels, chapters, bosses });
  } catch (err) {
    console.warn('[/admin/journey-counts] unavailable, returning empty maps —', err.message);
    res.json({ levels: {}, chapters: {}, bosses: {} });
  }
});

// ── First Aid Journey: levels (admin) ─────────────────────────────────────────

app.get('/admin/journey-levels', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ levels: [] });
  const { chapter_id } = req.query;
  try {
    let query = supabase.from('journey_levels').select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (chapter_id) query = query.eq('chapter_id', chapter_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ levels: data || [] });
  } catch (err) {
    console.warn('[/admin/journey-levels] unavailable, returning levels: [] —', err.message);
    res.json({ levels: [] });
  }
});

app.post('/admin/journey-levels', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { chapter_id, name, sort_order } = req.body;
  if (!chapter_id || !name?.trim()) return res.status(400).json({ error: 'chapter_id and name required' });
  try {
    const { data, error } = await supabase
      .from('journey_levels')
      .insert({
        chapter_id,
        name: name.trim(),
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/journey-levels/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const updates = {};
  if ('name' in req.body) {
    if (!req.body.name?.trim()) return res.status(400).json({ error: 'name required' });
    updates.name = req.body.name.trim();
  }
  if (Number.isFinite(req.body.sort_order)) updates.sort_order = req.body.sort_order;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing to update' });
  try {
    const { data, error } = await supabase
      .from('journey_levels')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/journey-levels/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { error } = await supabase.from('journey_levels').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── First Aid Journey: level questions (admin) ────────────────────────────────

app.get('/admin/journey-questions', adminAuth, async (req, res) => {
  if (!supabase) return res.json({ questions: [] });
  const { level_id } = req.query;
  try {
    let query = supabase.from('journey_questions').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (level_id) query = query.eq('level_id', level_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ questions: data || [] });
  } catch (err) {
    console.warn('[/admin/journey-questions] unavailable, returning questions: [] —', err.message);
    res.json({ questions: [] });
  }
});

app.post('/admin/journey-questions', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { level_id, question, options, correct, explanation, why_others_wrong, image_url, explanation_image_url, sort_order } = req.body;
  if (!level_id) return res.status(400).json({ error: 'level_id required' });
  const invalid = bossQuestionError({ question, options, correct });
  if (invalid) return res.status(400).json({ error: invalid });
  try {
    const { data, error } = await supabase
      .from('journey_questions')
      .insert({
        level_id,
        question: question.trim(),
        options,
        correct: String(correct).trim().toUpperCase(),
        explanation: explanation || null,
        why_others_wrong: why_others_wrong || null,
        image_url: image_url || null,
        explanation_image_url: explanation_image_url || null,
        sort_order: Number.isFinite(sort_order) ? sort_order : 0,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/admin/journey-questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { data: existing, error: getErr } = await supabase
      .from('journey_questions').select('*').eq('id', req.params.id).single();
    if (getErr || !existing) return res.status(404).json({ error: 'Journey question not found' });

    const updates = {};
    for (const k of ['level_id', 'question', 'options', 'correct', 'explanation', 'why_others_wrong', 'image_url', 'explanation_image_url']) {
      if (k in req.body) updates[k] = req.body[k];
    }
    if (Number.isFinite(req.body.sort_order)) updates.sort_order = req.body.sort_order;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'nothing to update' });

    // Validate the merged row so partial updates can't corrupt a question
    const merged = { ...existing, ...updates };
    const invalid = bossQuestionError(merged);
    if (invalid) return res.status(400).json({ error: invalid });
    if (updates.question) updates.question = updates.question.trim();
    if (updates.correct)  updates.correct  = String(updates.correct).trim().toUpperCase();

    const { data, error } = await supabase
      .from('journey_questions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/admin/journey-questions/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  try {
    const { error } = await supabase.from('journey_questions').delete().eq('id', req.params.id);
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
// Bulk delete questions
app.post('/admin/questions/bulk-delete', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }
    
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', ids);
    
    if (error) throw error;
    res.json({ success: true, deleted: ids.length });
  } catch(e) {
    console.error('[bulk-delete] Error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Bulk move questions
app.post('/admin/questions/bulk-move', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  
  try {
    const { ids, topicId, subject } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }
    
    const updates = { updated_at: new Date().toISOString() };
    if (topicId !== undefined) updates.topic_id = topicId;
    if (subject !== undefined) {
      updates.subject = subject;
      updates.category = subject;
    }
    
    const { error } = await supabase
      .from('questions')
      .update(updates)
      .in('id', ids);
    
    if (error) throw error;
    res.json({ success: true, moved: ids.length });
  } catch(e) {
    console.error('[bulk-move] Error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Bulk update questions (difficulty, etc)
app.post('/admin/questions/bulk-update', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No IDs provided' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'Updates object required' });
    }
    
    updates.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('questions')
      .update(updates)
      .in('id', ids);
    
    if (error) throw error;
    res.json({ success: true, updated: ids.length });
  } catch(e) {
    console.error('[bulk-update] Error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
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
  { id: 'haematology_oncology', name: 'Haematology & Oncology',  icon: '🩸', active: false },
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

// Seed subjects on startup
const seedSubjects = async () => {
  if (!supabase) return;
  try {
    const { data: existing } = await supabase.from('subjects').select('id').limit(1);
    // Only seed if table is accessible and empty
    if (existing !== null && existing.length === 0) {
      console.log('[Subjects] Table empty, seeding subjects...');
      for (const subject of SUBJECT_DEFAULTS) {
        await supabase
          .from('subjects')
          .upsert(subject, { onConflict: 'id' });
      }
      console.log('[Subjects] Seeded', SUBJECT_DEFAULTS.length, 'subjects');
    }
  } catch(e) {
    console.error('[Subjects] Seed error:', e.message);
  }
};
seedSubjects();

app.get('/api/subjects', async (req, res) => {
  if (!supabase) return res.json({ subjects: SUBJECT_DEFAULTS });
  try {
    let { data, error } = await supabase
      .from('subjects')
      .select('id, name, icon, active')
      .order('active', { ascending: false })
      .order('name',   { ascending: true  });

    if (error) {
      console.error('[Subjects GET] Query error:', error);
      console.error('[Subjects GET] Error code:', error.code);
      console.error('[Subjects GET] Error message:', error.message);
      console.error('[Subjects GET] Error details:', error.details);

      // Only check for actual table not found error (PostgreSQL error code 42P01)
      if (error.code === '42P01') {
        console.log('[Subjects GET] Table truly does not exist. Please run server/supabase-subjects-table.sql');
        return res.json({ subjects: SUBJECT_DEFAULTS, warning: 'Subjects table not found - run SQL migration' });
      }

      // For other errors (RLS, permissions, etc), log but return defaults
      console.error('[Subjects GET] Database error (not table missing). Returning defaults.');
      return res.json({ subjects: SUBJECT_DEFAULTS, warning: `Database error: ${error.message}` });
    }

    let list = data || [];
    // Seed on first run
    if (list.length === 0) {
      console.log('[Subjects GET] Table empty, seeding with defaults...');
      const { data: inserted, error: seedError } = await supabase.from('subjects').insert(SUBJECT_DEFAULTS).select('id, name, icon, active');
      if (seedError) {
        console.error('[Subjects GET] Seed error:', seedError);
        return res.json({ subjects: SUBJECT_DEFAULTS, warning: 'Could not seed subjects table' });
      }
      list = inserted || SUBJECT_DEFAULTS;
      console.log('[Subjects GET] Seeded', list.length, 'subjects');
    } else {
      // Insert any subjects added to defaults since last run
      const dbIds   = new Set(list.map(s => s.id));
      const missing = SUBJECT_DEFAULTS.filter(s => !dbIds.has(s.id));
      if (missing.length) {
        console.log('[Subjects GET] Adding', missing.length, 'missing subjects...');
        const { data: newRows } = await supabase.from('subjects').insert(missing).select('id, name, icon, active');
        if (newRows) list = [...list, ...newRows];
      }
    }
    res.json({ subjects: list });
  } catch (err) {
    console.error('[Subjects GET] Unexpected error:', err);
    res.json({ subjects: SUBJECT_DEFAULTS, warning: err.message });
  }
});

app.put('/admin/subjects/:id', adminAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured.' });
  const id     = req.params.id;
  const active = !!req.body.active;

  console.log('[Subjects PUT] Request:', { id, active });

  try {
    // Use upsert to handle both insert and update in one operation
    const def = SUBJECT_DEFAULTS.find(s => s.id === id);
    if (!def) {
      console.error('[Subjects PUT] Subject not found in defaults:', id);
      return res.status(404).json({ error: 'Subject not found in defaults' });
    }

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('subjects')
      .upsert({ ...def, active }, { onConflict: 'id' })
      .select('id, name, icon, active')
      .single();

    if (error) {
      console.error('[Subjects PUT] Upsert error:', error);
      console.error('[Subjects PUT] Error code:', error.code);
      console.error('[Subjects PUT] Error message:', error.message);
      console.error('[Subjects PUT] Error details:', error.details);

      // Only check for actual table not found error (PostgreSQL error code 42P01)
      if (error.code === '42P01') {
        return res.status(500).json({
          error: 'Subjects table does not exist. Please run server/supabase-subjects-table.sql in your Supabase database.'
        });
      }

      // For other errors, return the actual error message
      return res.status(500).json({
        error: error.message || 'Database error',
        code: error.code,
        details: error.details
      });
    }

    console.log('[Subjects PUT] Success:', { id, active, returned: data });
    res.json(data);
  } catch (err) {
    console.error('[Subjects PUT] Unexpected error:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// ── Topics API (Public) ──────────────────────────────────────────────────────

app.get('/api/topics', async (req, res) => {
  if (!supabase) return res.json({ topics: [], groups: [] });
  const { category } = req.query;
  try {
    let query = supabase.from('topics').select('*').order('name');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;

    // Add question count for each topic
    const topics = (data || []).map(t => ({
      ...t,
      difficulty: t.difficulty || 'easy',
      question_count: questionBank.filter(q => q.topic_id === t.id).length,
    }));

    // Groups are additive — fall back to [] if topic_groups doesn't exist yet
    let groups = [];
    try {
      let gq = supabase.from('topic_groups').select('*').order('name');
      if (category) gq = gq.eq('category', category);
      const { data: gData, error: gErr } = await gq;
      if (gErr) throw gErr;
      groups = (gData || []).map(g => ({ ...g, difficulty: g.difficulty || 'easy' }));
    } catch (e) {
      console.warn('[/api/topics] topic_groups unavailable, returning groups: [] —', e.message);
      groups = [];
    }

    res.json({ topics, groups });
  } catch (err) {
    console.error('[/api/topics] error:', err.message);
    res.status(500).json({ error: err.message, topics: [] });
  }
});

// Public: Training Grounds videos. Returns both category-attached and
// topic-attached videos (topic rows carry denormalized category/difficulty),
// each with topic_id so the client can group per topic.
app.get('/api/videos', async (req, res) => {
  if (!supabase) return res.json({ videos: [] });
  const { category, difficulty } = req.query;
  try {
    let query = supabase.from('videos').select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (category)   query = query.eq('category', category);
    if (difficulty) query = query.eq('difficulty', difficulty);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ videos: data || [] });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/api/videos] unavailable, returning videos: [] —', err.message);
    res.json({ videos: [] });
  }
});

// ── First Aid Journey (public, Bearer-authenticated) ──────────────────────────

// Build the ordered journey path for one user: chapters and levels are
// first-class journey entities (journey_chapters / journey_levels, ordered by
// sort_order then name), each chapter ending in a boss, then the ultimate boss.
//
// Keys: levels report progress under their journey_levels.id; bosses report
// under level_key 'boss:{chapter_id}' / 'boss:ultimate' and fetch their
// questions with boss_key 'chapter:{chapter_id}' / 'ultimate'.
//
// Unlock chain (computed here, never stored):
//   chapter 1 level 1 unlocked; level N needs level N-1 completed;
//   chapter boss needs all its chapter's levels; next chapter's first level
//   needs the previous chapter's boss; ultimate needs all chapter bosses.
// AUTO-SKIP: a boss with zero authored questions counts as satisfied once its
// prerequisites are met, so unauthored content never dead-ends players.
async function buildJourneyPath(userId, subject) {
  const [chaptersRes, progressRes, bossRes] = await Promise.all([
    supabase.from('journey_chapters').select('*').eq('subject', subject)
      .order('sort_order', { ascending: true }).order('name', { ascending: true }),
    supabase.from('journey_progress').select('*')
      .eq('user_id', userId).eq('subject', subject),
    supabase.from('boss_questions').select('boss_key').eq('subject', subject),
  ]);
  // Journey tables may not be migrated yet — degrade to an empty path
  if (chaptersRes.error) {
    console.warn('[journey] journey_chapters unavailable —', chaptersRes.error.message);
  }
  const chapterRows = chaptersRes.error ? [] : (chaptersRes.data || []);
  const progress    = progressRes.error ? [] : (progressRes.data || []);
  const bossCounts  = {};
  if (!bossRes.error) {
    for (const b of (bossRes.data || [])) bossCounts[b.boss_key] = (bossCounts[b.boss_key] || 0) + 1;
  }

  // Levels for all chapters, then per-level question counts
  let levelRows = [];
  const levelQCounts = {};
  if (chapterRows.length > 0) {
    const { data: lvData, error: lvErr } = await supabase.from('journey_levels').select('*')
      .in('chapter_id', chapterRows.map(c => c.id))
      .order('sort_order', { ascending: true }).order('name', { ascending: true });
    if (lvErr) {
      console.warn('[journey] journey_levels unavailable —', lvErr.message);
    } else {
      levelRows = lvData || [];
    }
    if (levelRows.length > 0) {
      const { data: qData, error: qErr } = await supabase.from('journey_questions')
        .select('level_id').in('level_id', levelRows.map(l => l.id));
      if (!qErr) {
        for (const q of (qData || [])) levelQCounts[q.level_id] = (levelQCounts[q.level_id] || 0) + 1;
      }
    }
  }

  const progByKey = new Map(progress.map(p => [p.level_key, p]));
  const isDone = (key) => !!progByKey.get(key)?.completed_at;
  const best   = (key) => progByKey.get(key)?.best_score_pct || 0;

  let prevSatisfied = true; // chapter 1 level 1 starts unlocked
  const chapters = [];
  let allBossesSatisfied = true;

  for (const ch of chapterRows) {
    const members = levelRows.filter(l => l.chapter_id === ch.id);
    if (members.length === 0) continue; // empty chapters don't appear on the path

    const levels = members.map(l => {
      const completed = isDone(l.id);
      const unlocked  = prevSatisfied || completed;
      prevSatisfied   = completed;
      return {
        level_key: l.id,
        name: l.name,
        question_count: levelQCounts[l.id] || 0,
        completed,
        best_score_pct: best(l.id),
        unlocked,
      };
    });

    const allLevelsDone = levels.every(l => l.completed);
    const bossKey       = `chapter:${ch.id}`;
    const levelKey      = `boss:${ch.id}`;
    const qCount        = bossCounts[bossKey] || 0;
    const completed     = isDone(levelKey);
    const autoSkipped   = qCount === 0 && allLevelsDone;
    const satisfied     = autoSkipped || completed;

    chapters.push({
      chapter: { id: ch.id, name: ch.name },
      levels,
      boss: {
        boss_key: bossKey,
        level_key: levelKey,
        question_count: qCount,
        completed,
        best_score_pct: best(levelKey),
        unlocked: allLevelsDone,
        auto_skipped: autoSkipped,
      },
    });

    prevSatisfied = satisfied;       // gates the next chapter's first level
    if (!satisfied) allBossesSatisfied = false;
  }

  const ultQCount      = bossCounts['ultimate'] || 0;
  const ultCompleted   = isDone('boss:ultimate');
  const ultUnlocked    = chapters.length > 0 && allBossesSatisfied;
  const ultAutoSkipped = ultQCount === 0 && ultUnlocked;

  const ultimate = {
    boss_key: 'ultimate',
    level_key: 'boss:ultimate',
    question_count: ultQCount,
    completed: ultCompleted,
    best_score_pct: best('boss:ultimate'),
    unlocked: ultUnlocked,
    auto_skipped: ultAutoSkipped,
  };

  return {
    subject,
    threshold: Number(gameSettings.journeyThreshold) || 80,
    chapters,
    ultimate,
    mastery: ultCompleted || ultAutoSkipped,
  };
}

app.get('/api/journey/:subject', requireAuth, async (req, res) => {
  if (!supabase) return res.json({ subject: req.params.subject, threshold: 80, chapters: [], ultimate: null, mastery: false });
  try {
    const path = await buildJourneyPath(req.userId, req.params.subject);
    res.json(path);
  } catch (err) {
    console.error('[/api/journey] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/journey/complete', requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase not configured.' });
  const { subject, level_key, score_pct } = req.body;
  if (!subject || !level_key || !Number.isFinite(score_pct)) {
    return res.status(400).json({ error: 'subject, level_key and numeric score_pct required' });
  }
  const pct       = Math.max(0, Math.min(100, Math.round(score_pct)));
  const threshold = Number(gameSettings.journeyThreshold) || 80;
  try {
    const { data: existing } = await supabase.from('journey_progress').select('*')
      .eq('user_id', req.userId).eq('subject', subject).eq('level_key', level_key)
      .maybeSingle();
    // Idempotent: best score only ever rises; completed_at sticks once earned
    const { error } = await supabase.from('journey_progress').upsert({
      user_id: req.userId,
      subject,
      level_key,
      best_score_pct: Math.max(existing?.best_score_pct || 0, pct),
      completed_at: existing?.completed_at || (pct >= threshold ? new Date().toISOString() : null),
    }, { onConflict: 'user_id,subject,level_key' });
    if (error) throw error;
    const path = await buildJourneyPath(req.userId, subject);
    res.json({ passed: pct >= threshold, score_pct: pct, ...path });
  } catch (err) {
    console.error('[/api/journey/complete] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Public level questions in the exact solo wire shape (client-judged)
app.get('/api/journey-questions', async (req, res) => {
  if (!supabase) return res.json({ questions: [] });
  const { level_id } = req.query;
  if (!level_id) return res.status(400).json({ error: 'level_id required', questions: [] });
  try {
    const { data, error } = await supabase.from('journey_questions').select('*')
      .eq('level_id', level_id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    const questions = (data || []).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || '',
      why_others_wrong: q.why_others_wrong || null,
      image_url: q.image_url || null,
      explanation_image_url: q.explanation_image_url || null,
    }));
    if (questions.length === 0) {
      return res.json({ questions: [], empty: true, message: 'No questions authored for this level yet.' });
    }
    res.json({ questions, empty: false });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/api/journey-questions] unavailable, returning questions: [] —', err.message);
    res.json({ questions: [] });
  }
});

// Public boss questions in the exact solo wire shape (client-judged, like /api/questions)
app.get('/api/boss-questions', async (req, res) => {
  if (!supabase) return res.json({ questions: [] });
  const { subject, boss_key } = req.query;
  if (!subject || !boss_key) return res.status(400).json({ error: 'subject and boss_key required', questions: [] });
  try {
    const { data, error } = await supabase.from('boss_questions').select('*')
      .eq('subject', subject)
      .eq('boss_key', boss_key)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    const questions = (data || []).map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correct: q.correct,
      explanation: q.explanation || '',
      why_others_wrong: q.why_others_wrong || null,
      image_url: q.image_url || null,
      explanation_image_url: q.explanation_image_url || null,
    }));
    if (questions.length === 0) {
      return res.json({ questions: [], empty: true, message: 'No boss questions authored yet.' });
    }
    res.json({ questions, empty: false });
  } catch (err) {
    // Table may not exist yet (manual migration) — degrade to empty list
    console.warn('[/api/boss-questions] unavailable, returning questions: [] —', err.message);
    res.json({ questions: [] });
  }
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
app.get('/api/game-settings', async (req, res) => {
  console.log('[/api/game-settings] Request received');
  try {
    // Try to fetch fresh from Supabase first
    if (supabase) {
      const { data, error } = await supabase.from('game_settings').select('*');
      if (error) {
        console.error('[/api/game-settings] Supabase error:', error.message);
      } else if (data && data.length > 0) {
        const settings = {};
        data.forEach(row => {
          if (row.key && row.value !== undefined) {
            try {
              settings[row.key] = JSON.parse(row.value);
            } catch {
              settings[row.key] = row.value;
            }
          }
        });

        // Normalize keys: handle snake_case -> camelCase migration
        // Prefer camelCase; if both exist, camelCase wins
        if (settings.hard_mode_timer !== undefined && settings.hardModeTimer === undefined) {
          settings.hardModeTimer = settings.hard_mode_timer;
        }
        if (settings.hard_mode_explanation_time !== undefined && settings.hardModeExplanationTime === undefined) {
          settings.hardModeExplanationTime = settings.hard_mode_explanation_time;
        }

        console.log('[/api/game-settings] Returning', Object.keys(settings).length, 'settings from Supabase');
        console.log('[/api/game-settings] Hard mode settings:', {
          hardModeTimer: settings.hardModeTimer,
          hardModeExplanationTime: settings.hardModeExplanationTime
        });
        return res.json(settings);
      }
    }

    // Fallback to in-memory gameSettings
    console.log('[/api/game-settings] Returning', Object.keys(gameSettings).length, 'settings from memory');
    res.json(gameSettings);
  } catch (err) {
    console.error('[/api/game-settings] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
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

// ── Notifications ──────────────────────────────────────────────────────────────
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Use announcements table for notifications
    if (!supabase) return res.json([]);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    const notifications = (data || []).map(a => ({
      id: a.id,
      message: a.message || a.content || a.title,
      icon: '📢',
      read: false,
      time: new Date(a.created_at).toLocaleDateString()
    }));

    res.json(notifications);
  } catch(e) {
    console.error('[Notifications] GET error:', e.message);
    res.json([]);
  }
});

app.post('/api/notifications/:userId/read-all', async (req, res) => {
  // Placeholder for marking all as read
  res.json({ success: true });
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

      // Try to get a mix of difficulties (easy and hard only)
      const easyQuests = (activeQuests || []).filter(q => q.difficulty === 'easy' || !q.difficulty);
      const hardQuests = (activeQuests || []).filter(q => q.difficulty === 'hard');

      // Shuffle arrays
      const shuffle = arr => arr.sort(() => Math.random() - 0.5);
      shuffle(easyQuests);
      shuffle(hardQuests);

      // Select quests: prefer mix of easy and hard (or fill as available)
      const selectedIds = [...pinnedIds];
      const remaining = 3 - selectedIds.length;

      if (remaining > 0) {
        const pool = [];
        if (easyQuests.length > 0) pool.push(easyQuests[0]);
        if (hardQuests.length > 0) pool.push(hardQuests[0]);
        // Add more easy if available for variety
        if (easyQuests.length > 1) pool.push(easyQuests[1]);

        // Fill with shuffled pool
        shuffle(pool);
        for (let i = 0; i < remaining && pool.length > 0; i++) {
          const q = pool.shift();
          if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
        }

        // If still not enough, grab any active quest
        if (selectedIds.length < 3) {
          const allShuffled = shuffle([...easyQuests, ...hardQuests]);
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

// Get daily quests with user progress
app.get('/api/daily-quests/:userId', async (req, res) => {
  if (!supabase) return res.json([]);

  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get today's quest IDs
    const { data: dailyData } = await supabase
      .from('daily_quests')
      .select('quest_ids')
      .eq('date', today)
      .single();

    let questIds = dailyData?.quest_ids;

    // If no quests for today, fall back to all active quests
    if (!questIds || questIds.length === 0) {
      const { data: activeQuests } = await supabase
        .from('quests')
        .select('id')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      questIds = (activeQuests || []).map(q => q.id);
    }

    if (!questIds || questIds.length === 0) {
      return res.json([]);
    }

    // Fetch full quest details
    const { data: quests } = await supabase
      .from('quests')
      .select('*')
      .in('id', questIds);

    if (!quests || quests.length === 0) {
      return res.json([]);
    }

    // Get player progress for each quest
    const questsWithProgress = await Promise.all(quests.map(async (quest) => {
      if (userId === 'guest') {
        return {
          ...quest,
          progress: 0,
          completed: false
        };
      }

      const { data: progress } = await supabase
        .from('player_quest_progress')
        .select('progress, completed')
        .eq('user_id', userId)
        .eq('quest_id', quest.id)
        .eq('date', today)
        .single();

      return {
        ...quest,
        progress: progress?.progress || 0,
        completed: progress?.completed || false
      };
    }));

    res.json(questsWithProgress);
  } catch (err) {
    console.error('[daily-quests/:userId] Error:', err.message);
    res.json([]);
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
    const easyQuests = shuffle((activeQuests || []).filter(q => q.difficulty === 'easy' || !q.difficulty));
    const hardQuests = shuffle((activeQuests || []).filter(q => q.difficulty === 'hard'));

    const selectedIds = [...pinnedIds];
    const remaining = 3 - selectedIds.length;

    if (remaining > 0) {
      const pool = [];
      if (easyQuests.length > 0) pool.push(easyQuests[0]);
      if (hardQuests.length > 0) pool.push(hardQuests[0]);
      // Add more easy if available for variety
      if (easyQuests.length > 1) pool.push(easyQuests[1]);
      shuffle(pool);

      for (const q of pool) {
        if (selectedIds.length >= 3) break;
        if (!selectedIds.includes(q.id)) selectedIds.push(q.id);
      }

      if (selectedIds.length < 3) {
        const allShuffled = shuffle([...easyQuests, ...hardQuests]);
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

// ── Reward Chest Endpoints ─────────────────────────────────────────────────

app.get('/api/rewards/chest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const cooldownHours = 24;

    // Check last claim time from game_settings or user metadata
    let lastClaim = null;
    if (supabase) {
      const { data } = await supabase
        .from('game_settings')
        .select('value')
        .eq('key', `last_chest_claim_${userId}`)
        .maybeSingle();
      lastClaim = data?.value ? new Date(data.value) : null;
    }

    const now = new Date();
    const hoursSince = lastClaim ? (now - lastClaim) / (1000 * 60 * 60) : 999;
    const available = hoursSince >= cooldownHours;
    const hoursLeft = available ? 0 : Math.ceil(cooldownHours - hoursSince);

    res.json({ available, timeLeft: `${hoursLeft}h`, lastClaim });
  } catch (err) {
    res.json({ available: true, timeLeft: '0h' });
  }
});

app.post('/api/rewards/claim/:userId', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });

  try {
    const { userId } = req.params;

    // Check cooldown
    const { data: lastClaimData } = await supabase
      .from('game_settings')
      .select('value')
      .eq('key', `last_chest_claim_${userId}`)
      .maybeSingle();

    const lastClaim = lastClaimData?.value ? new Date(lastClaimData.value) : null;
    const hoursSince = lastClaim ? (new Date() - lastClaim) / (1000 * 60 * 60) : 999;

    if (hoursSince < 24) {
      return res.json({ success: false, message: 'Chest already claimed today' });
    }

    // Give rewards - random coins and gems
    const coinsReward = Math.floor(Math.random() * 100) + 50; // 50-149 coins
    const gemsReward = Math.floor(Math.random() * 5) + 1; // 1-5 gems

    // Update user coins and gems
    const { data: userData } = await supabase
      .from('users')
      .select('coins, gems')
      .eq('id', userId)
      .maybeSingle();

    if (userData) {
      await supabase
        .from('users')
        .update({
          coins: (userData.coins || 0) + coinsReward,
          gems: (userData.gems || 0) + gemsReward
        })
        .eq('id', userId);
    }

    // Record claim time
    await supabase
      .from('game_settings')
      .upsert(
        { key: `last_chest_claim_${userId}`, value: new Date().toISOString() },
        { onConflict: 'key' }
      );

    res.json({ success: true, coins: coinsReward, gems: gemsReward });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

  try {
    await loadSettingsFromDB();
  } catch (err) {
    console.error('[Startup] Failed to load settings:', err.message);
  }

  try {
    await loadQuestionsFromDB();
  } catch (err) {
    console.error('[Startup] Failed to load questions:', err.message);
  }

  // Refresh questions cache every 5 minutes
  setInterval(() => {
    loadQuestionsFromDB().catch(err => console.error('[Questions] Auto-refresh failed:', err.message));
  }, QUESTIONS_CACHE_TTL);
});
