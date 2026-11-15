'use strict';

/**
 * Scan Master — read the image, name what it shows.
 *
 * Every question is one picture from the admin-curated image bank
 * (`scan_master_images`: an image, its system, the correct answer, the wrong
 * options and a short explanation). Everyone sees the same picture with the
 * same four options; the first lock-in is final. Nobody learns whether they
 * were right until the reveal, so a fast player cannot tip off a slow one.
 *
 * Points for a correct answer: 100, plus up to 100 for speed (scaled by the
 * time left), plus a streak bonus of 20 per correct answer in a row after the
 * first, capped at +100. Wrong or no answer: 0, and the streak resets.
 *
 * Wire protocol
 *   → set_scan_options {options}        host, in the lobby
 *   → scan_answer {choice} ack {ok}     once per question
 *   → scan_sync                         "send me where we are"
 *   ← scan_question   the picture, the options, the clock
 *   ← scan_progress   who has locked in (not what)
 *   ← scan_reveal     the answer, everyone's pick, the points, standings
 *   ← game_over       the shared event, with gameMode 'scan_master'
 */

// Systems a picture can belong to. Ids are what the table stores.
const SYSTEMS = [
  { id: 'cardio',      name: 'Cardiovascular',   icon: '❤️' },
  { id: 'pulm',        name: 'Pulmonary',        icon: '🫁' },
  { id: 'renal',       name: 'Renal',            icon: '💧' },
  { id: 'gi',          name: 'Gastrointestinal', icon: '🫃' },
  { id: 'neuro',       name: 'Neurology',        icon: '🧠' },
  { id: 'msk',         name: 'Musculoskeletal',  icon: '🦴' },
  { id: 'derm',        name: 'Dermatology',      icon: '🩹' },
  { id: 'heme_onc',    name: 'Heme / Onc',       icon: '🩸' },
  { id: 'immuno',      name: 'Immunology',       icon: '🛡️' },
  { id: 'endo',        name: 'Endocrine',        icon: '🦋' },
  { id: 'repro',       name: 'Reproductive',     icon: '👶' },
  { id: 'micro',       name: 'Microbiology',     icon: '🦠' },
  { id: 'multisystem', name: 'Multisystem',      icon: '🩺' },
];
const SYSTEM_IDS = new Set(SYSTEMS.map(s => s.id));

const MODALITIES = [
  'ECG', 'X-ray', 'CT', 'MRI', 'Ultrasound', 'Histology', 'Gross pathology',
  'Blood smear', 'Skin / clinical photo', 'Fundoscopy', 'Microbiology', 'Angiogram', 'Diagram', 'Other',
];

const COUNT_CHOICES = [5, 10, 15, 20, 30];
const DEFAULTS = Object.freeze({ systems: [], count: 10 });
const MAX_PLAYERS = 20;
const INTRO_MS = 1800;          // the "scanning" sweep before the options unlock
const REVEAL_MS = 5200;         // the answer and everyone's pick
const GRACE_MS = 350;
const BASE_POINTS = 100;
const SPEED_POINTS = 100;
const STREAK_STEP = 20;
const STREAK_CAP = 100;
const BOT_ACCURACY = { easy: 0.4, hard: 0.75, expert: 0.9 };

function sanitizeOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    systems: Array.isArray(o.systems) ? [...new Set(o.systems.filter(s => SYSTEM_IDS.has(s)))] : [],
    count: COUNT_CHOICES.includes(Number(o.count)) ? Number(o.count) : DEFAULTS.count,
  };
}

/** A row as the game uses it, or null if it cannot be played. */
function cleanRow(r) {
  if (!r || !r.image_url || !r.answer || !SYSTEM_IDS.has(r.system)) return null;
  let distractors = r.distractors;
  if (typeof distractors === 'string') { try { distractors = JSON.parse(distractors); } catch { distractors = []; } }
  return {
    id: r.id,
    system: r.system,
    modality: r.modality || null,
    image_url: r.image_url,
    prompt: r.prompt || null,
    answer: String(r.answer).trim(),
    distractors: (Array.isArray(distractors) ? distractors : []).map(d => String(d || '').trim()).filter(Boolean),
    explanation: r.explanation || '',
  };
}

/**
 * Four options: the answer plus the item's own wrong options, topped up from
 * other answers in the same system (then any system) when it has fewer than
 * three. Never two options that differ only in case.
 */
function buildOptions(item, all, shuffle) {
  const seen = new Set([item.answer.toLowerCase()]);
  const wrong = [];
  const add = (t) => {
    const k = t.toLowerCase();
    if (!t || seen.has(k) || wrong.length >= 3) return;
    seen.add(k); wrong.push(t);
  };
  item.distractors.forEach(add);
  if (wrong.length < 3) shuffle(all.filter(o => o.system === item.system && o.id !== item.id)).forEach(o => add(o.answer));
  if (wrong.length < 3) shuffle(all.filter(o => o.id !== item.id)).forEach(o => add(o.answer));
  const options = shuffle([item.answer, ...wrong]);
  return { options, correct: options.indexOf(item.answer) };
}

/** Score for one correct answer. Exported so the solo client can match it. */
function pointsFor(msLeft, msTotal, streakBefore) {
  const speed = Math.round(SPEED_POINTS * Math.max(0, Math.min(1, msLeft / msTotal)));
  const streak = Math.min(STREAK_CAP, STREAK_STEP * streakBefore);
  return { base: BASE_POINTS, speed, streakBonus: streak, total: BASE_POINTS + speed + streak };
}

module.exports = function createScanMaster({ io, lobbies, shuffle, awardXP, lobbyPayload, getSupabase, getSeconds }) {
  const seconds = () => Math.max(8, Math.min(60, Number(getSeconds?.()) || 20));
  const humans = (lobby) => [...lobby.players.values()].filter(p => !p.isBot);

  // ── The bank ──────────────────────────────────────────────────────────────

  /** Every playable picture. Paged: PostgREST silently caps a read at 1000. */
  async function loadBank() {
    const supabase = getSupabase();
    if (!supabase) return { rows: [], missing: false };
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase
        .from('scan_master_images').select('*').eq('active', true)
        .range(from, from + 999);
      if (error) {
        const missing = /scan_master_images/.test(error.message || '') && /(does not exist|not find|schema cache)/i.test(error.message || '');
        if (!missing) console.warn('[scan master] bank unavailable —', error.message);
        return { rows: [], missing };
      }
      for (const r of data || []) { const c = cleanRow(r); if (c) rows.push(c); }
      if (!data || data.length < 1000) return { rows, missing: false };
    }
  }

  /** How many pictures each system has, for the setup screens. */
  async function catalog() {
    const { rows, missing } = await loadBank();
    const counts = {};
    for (const r of rows) counts[r.system] = (counts[r.system] || 0) + 1;
    return {
      ready: !missing,
      total: rows.length,
      systems: SYSTEMS.map(s => ({ ...s, count: counts[s.id] || 0 })),
      counts: COUNT_CHOICES,
      seconds: seconds(),
    };
  }

  /** A run of questions, each with its four options and the correct index. */
  async function buildRun(opts) {
    const { rows } = await loadBank();
    const pool = opts.systems.length ? rows.filter(r => opts.systems.includes(r.system)) : rows;
    return shuffle(pool).slice(0, opts.count).map(item => {
      const { options, correct } = buildOptions(item, rows, shuffle);
      return { ...item, options, correct };
    });
  }

  // ── A match ───────────────────────────────────────────────────────────────

  function questionPublic(s) {
    const q = s.queue[s.idx];
    return {
      index: s.idx + 1,
      total: s.queue.length,
      system: SYSTEMS.find(x => x.id === q.system) || { id: q.system, name: q.system, icon: '🩺' },
      modality: q.modality,
      prompt: q.prompt || 'What does this image show?',
      image: q.image_url,
      options: q.options,
      seconds: s.seconds,
    };
  }

  function standings(lobby) {
    const s = lobby.scan;
    return [...lobby.players.values()].map(p => {
      const t = s.totals.get(p.id) || { score: 0, correct: 0, streak: 0, best: 0 };
      return { id: p.id, username: p.username, isBot: Boolean(p.isBot), score: t.score, correct: t.correct, streak: t.streak };
    }).sort((a, b) => b.score - a.score || b.correct - a.correct);
  }

  async function start(lobby) {
    if (lobby.scanStarting) return;
    lobby.scanStarting = true;
    try {
      const opts = sanitizeOptions(lobby.scanOptions);
      const queue = await buildRun(opts);
      if (!queue.length) {
        io.to(lobby.id).emit('error', {
          message: opts.systems.length
            ? 'No Scan Master images in those systems yet — pick others, or add some in Admin → Scan Master.'
            : 'No Scan Master images yet. Add some in Admin → Scan Master.',
        });
        return;
      }
      lobby.status = 'scan_master';
      lobby.scan = {
        opts, queue, idx: -1, phase: 'intro', seconds: seconds(),
        picks: new Map(), totals: new Map(), timer: null, botTimers: [],
        opensAt: 0, endsAt: 0, reveal: null, history: [],
      };
      for (const p of lobby.players.values()) {
        p.score = 0;
        lobby.scan.totals.set(p.id, { score: 0, correct: 0, answered: 0, streak: 0, best: 0, fastestMs: null });
      }
      io.to(lobby.id).emit('game_start', { gameMode: 'scan_master', total: queue.length });
      setTimeout(() => next(lobby), 900);
    } finally {
      lobby.scanStarting = false;
    }
  }

  function clearBots(s) {
    for (const t of s.botTimers) clearTimeout(t);
    s.botTimers = [];
  }

  function next(lobby) {
    const s = lobby.scan;
    if (!s || lobby.status !== 'scan_master') return;
    s.idx += 1;
    if (s.idx >= s.queue.length) return finish(lobby, 'complete');
    s.phase = 'intro';
    s.picks = new Map();
    s.reveal = null;
    s.opensAt = Date.now() + INTRO_MS;
    s.endsAt = s.opensAt + s.seconds * 1000;
    io.to(lobby.id).emit('scan_question', { ...questionPublic(s), phase: 'intro', msToOpen: INTRO_MS, msLeft: s.seconds * 1000 });
    clearTimeout(s.timer);
    s.timer = setTimeout(() => open(lobby), INTRO_MS);
  }

  function open(lobby) {
    const s = lobby.scan;
    if (!s || lobby.status !== 'scan_master' || s.phase !== 'intro') return;
    s.phase = 'answering';
    s.endsAt = Date.now() + s.seconds * 1000;
    io.to(lobby.id).emit('scan_open', { index: s.idx + 1, msLeft: s.seconds * 1000 });
    s.timer = setTimeout(() => reveal(lobby), s.seconds * 1000 + GRACE_MS);

    // Bots: one answer each, at a believable moment.
    const q = s.queue[s.idx];
    for (const bot of lobby.players.values()) {
      if (!bot.isBot) continue;
      const acc = BOT_ACCURACY[bot.difficulty] ?? 0.6;
      // Quicker the better the bot, and never most of the clock: a round
      // ends when everyone has answered, so a dawdling bot slows everyone.
      const spread = { expert: 0.2, hard: 0.3 }[bot.difficulty] ?? 0.45;
      const delay = 1200 + Math.random() * (s.seconds * 1000 * spread);
      s.botTimers.push(setTimeout(() => {
        if (lobby.scan !== s || s.phase !== 'answering' || !lobby.players.has(bot.id)) return;
        let choice = q.correct;
        if (Math.random() > acc) {
          const wrong = q.options.map((_, i) => i).filter(i => i !== q.correct);
          choice = wrong[Math.floor(Math.random() * wrong.length)];
        }
        lockIn(lobby, bot.id, choice);
      }, delay));
    }
  }

  function lockIn(lobby, playerId, choice) {
    const s = lobby.scan;
    if (s.picks.has(playerId)) return false;
    s.picks.set(playerId, { choice, msLeft: Math.max(0, s.endsAt - Date.now()) });
    io.to(lobby.id).emit('scan_progress', { locked: [...s.picks.keys()] });
    if ([...lobby.players.keys()].every(id => s.picks.has(id))) {
      clearTimeout(s.timer);
      s.timer = setTimeout(() => reveal(lobby), 600);
    }
    return true;
  }

  function answer(socket, payload, ack) {
    const reply = typeof ack === 'function' ? ack : () => {};
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.scan;
    if (!lobby || !s || lobby.status !== 'scan_master' || !lobby.players.has(socket.id)) return reply({ ok: false });
    if (s.phase !== 'answering' || Date.now() > s.endsAt + GRACE_MS) return reply({ ok: false, reason: 'closed' });
    const choice = Number(payload?.choice);
    const q = s.queue[s.idx];
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) return reply({ ok: false });
    reply({ ok: lockIn(lobby, socket.id, choice) });
  }

  function reveal(lobby) {
    const s = lobby.scan;
    if (!s || lobby.status !== 'scan_master' || s.phase !== 'answering') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'reveal';
    const q = s.queue[s.idx];
    const msTotal = s.seconds * 1000;

    const gains = {};
    for (const p of lobby.players.values()) {
      const t = s.totals.get(p.id) || { score: 0, correct: 0, answered: 0, streak: 0, best: 0, fastestMs: null };
      const pick = s.picks.get(p.id);
      const correct = Boolean(pick && pick.choice === q.correct);
      let pts = { base: 0, speed: 0, streakBonus: 0, total: 0 };
      if (pick) t.answered += 1;
      if (correct) {
        pts = pointsFor(pick.msLeft, msTotal, t.streak);
        t.streak += 1;
        t.best = Math.max(t.best, t.streak);
        t.correct += 1;
        const took = msTotal - pick.msLeft;
        t.fastestMs = t.fastestMs == null ? took : Math.min(t.fastestMs, took);
      } else {
        t.streak = 0;
      }
      t.score += pts.total;
      p.score = t.score;
      s.totals.set(p.id, t);
      gains[p.id] = {
        choice: pick ? pick.choice : null, correct, ...pts, streak: t.streak,
        seconds: pick ? Math.round((msTotal - pick.msLeft) / 100) / 10 : null,
      };
    }

    s.history.push({
      index: s.idx + 1, image: q.image_url, system: q.system, modality: q.modality,
      answer: q.answer, explanation: q.explanation,
      right: Object.values(gains).filter(g => g.correct).length,
    });
    s.reveal = {
      index: s.idx + 1, total: s.queue.length, correct: q.correct, answer: q.answer,
      explanation: q.explanation, gains, standings: standings(lobby),
      isLast: s.idx >= s.queue.length - 1, msLeft: REVEAL_MS,
    };
    s.revealAt = Date.now();
    io.to(lobby.id).emit('scan_reveal', s.reveal);
    s.timer = setTimeout(() => next(lobby), REVEAL_MS);
  }

  function finish(lobby, reason) {
    const s = lobby.scan;
    if (!s || lobby.status === 'game_over') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'done';
    lobby.status = 'game_over';

    const rows = standings(lobby);
    const sorted = rows.map(r => lobby.players.get(r.id)).filter(Boolean);
    lobby.correctCounts = new Map(rows.map(r => [r.id, r.correct]));
    lobby.answeredCounts = new Map(rows.map(r => [r.id, s.totals.get(r.id)?.answered || 0]));
    lobby.questionIdx = Math.max(0, s.history.length - 1);

    const players = rows.map((r, i) => {
      const t = s.totals.get(r.id) || {};
      return {
        id: r.id, username: r.username, isBot: r.isBot, place: i + 1,
        score: r.score, correct: r.correct, answered: t.answered || 0,
        bestStreak: t.best || 0, fastest: t.fastestMs == null ? null : Math.round(t.fastestMs / 100) / 10,
        lives: 0, alive: true,
      };
    });
    io.to(lobby.id).emit('game_over', {
      gameMode: 'scan_master', reason,
      winner: players[0]?.username || null,
      players, total: s.queue.length, history: s.history,
    });
    awardXP(lobby, sorted).catch(err => console.error('[awardXP scan master]', err.message));
  }

  // ── Leaving, resetting, catching up ───────────────────────────────────────

  function onLeave(lobby, socketId) {
    const s = lobby.scan;
    if (!s) return;
    s.picks.delete(socketId);
    if (!humans(lobby).length) {
      clearTimeout(s.timer);
      clearBots(s);
      lobbies.delete(lobby.id);
      return;
    }
    if (s.phase === 'answering') {
      io.to(lobby.id).emit('scan_progress', { locked: [...s.picks.keys()] });
      if ([...lobby.players.keys()].every(id => s.picks.has(id))) {
        clearTimeout(s.timer);
        s.timer = setTimeout(() => reveal(lobby), 400);
      }
    }
  }

  function reset(lobby) {
    const s = lobby.scan;
    if (!s) return;
    clearTimeout(s.timer);
    clearBots(s);
    lobby.scan = null;
  }

  function sync(socket) {
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.scan;
    if (!lobby || !s || !lobby.players.has(socket.id) || s.idx < 0) return;
    if (s.phase === 'reveal' && s.reveal) {
      return socket.emit('scan_reveal', { ...s.reveal, msLeft: Math.max(0, REVEAL_MS - (Date.now() - s.revealAt)) });
    }
    if (s.phase === 'intro' || s.phase === 'answering') {
      socket.emit('scan_question', {
        ...questionPublic(s), phase: s.phase,
        msToOpen: Math.max(0, s.opensAt - Date.now()),
        msLeft: Math.max(0, s.endsAt - Date.now()),
        mine: s.picks.get(socket.id)?.choice ?? null,
      });
      socket.emit('scan_progress', { locked: [...s.picks.keys()] });
    }
  }

  function attach(socket) {
    socket.on('set_scan_options', ({ options } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const lobby = lobbies.get(socket.lobbyId);
      if (!lobby || lobby.gameMode !== 'scan_master') return reply({ ok: false });
      if (lobby.hostId !== socket.id) return reply({ ok: false, error: 'Only the host can change the settings.' });
      if (lobby.status !== 'waiting') return reply({ ok: false, error: 'The match has already started.' });
      lobby.scanOptions = sanitizeOptions(options);
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
      reply({ ok: true, options: lobby.scanOptions });
    });
    socket.on('scan_answer', (payload, ack) => answer(socket, payload, ack));
    socket.on('scan_sync', () => sync(socket));
  }

  return {
    MAX_PLAYERS, SYSTEMS, MODALITIES, COUNT_CHOICES,
    sanitizeOptions, start, attach, onLeave, reset, catalog, buildRun, cleanRow,
    seconds,
  };
};

module.exports.pointsFor = pointsFor;
module.exports.SYSTEMS = SYSTEMS;
module.exports.MODALITIES = MODALITIES;
