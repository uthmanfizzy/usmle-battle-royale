'use strict';

/**
 * Clue Ladder — name the disease in as few clues as you can.
 *
 * Each round is one case from the bank (server/clueladder/bank). Everyone
 * starts on the same vague first clue. A player guesses a diagnosis; a wrong
 * guess (or a pass) costs one attempt and unlocks THEIR next clue, which is
 * more specific than the last. Six clues, so six attempts. Players climb at
 * their own pace — a fast player's progress shows as a count, never as what
 * they guessed, so nobody can copy.
 *
 * Attempts are the score, like golf: solved on attempt k counts k, not solved
 * counts 7. Fewest total attempts wins; ties go to more cases solved, then to
 * less total time. Points (for XP and the podium) are 100 × (7 − attempts).
 *
 * Guesses must name a diagnosis from the system's list (the client offers it
 * as autocomplete). A guess that is not on the list, or one already tried,
 * costs nothing and is simply refused.
 *
 * Wire protocol
 *   → set_cl_options {options}     host, in the lobby
 *   → cl_guess {text} ack          a diagnosis
 *   → cl_pass ack                  skip to the next clue (costs an attempt)
 *   → cl_sync                      "send me where we are"
 *   ← cl_round    the case number, its group, the answer list, the clock
 *   ← cl_me       your own clues, guesses and attempts
 *   ← cl_progress everyone's attempts and whether they are done (not what)
 *   ← cl_reveal   the answer, every clue, everyone's guesses, standings
 *   ← game_over   the shared event, with gameMode 'clue_ladder'
 */

const bank = require('./bank');

const COUNT_CHOICES = [5, 10, 15, 20];
const SECOND_CHOICES = [60, 90, 120, 180];
// Skip diseases a human in the room has had within this many days (0 = off,
// 1 = today only). Each player's browser sends its own record (cl_seen);
// the server also remembers per signed-in account, in memory.
const SKIP_CHOICES = [0, 1, 3, 7];
const DEFAULTS = Object.freeze({ systems: [], count: 10, seconds: 90, hyOnly: true, skipDays: 1 });
const MAX_PLAYERS = 20;
const MAX_ATTEMPTS = bank.CLUE_COUNT;      // one guess per clue
const FAIL_ATTEMPTS = MAX_ATTEMPTS + 1;    // what an unsolved case counts
const INTRO_MS = 2600;
// Long enough to read the answer's brief, not just the scores.
const REVEAL_MS = 20000;
const SEEN_KEEP_DAYS = 14;
const SEEN_MAX = 2000;

/** 'YYYY-MM-DD' → a day number (days since the epoch), or null. */
function dayNum(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  return Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
}
const utcToday = () => Math.floor(Date.now() / 86400000);
const GRACE_MS = 400;

// Bots: which attempt they solve on, and how often they never get it.
const BOT_PROFILE = {
  easy:   { from: 3, to: 6, fail: 0.25, gapMs: [6000, 10000] },
  hard:   { from: 2, to: 4, fail: 0.1,  gapMs: [4500, 8000] },
  expert: { from: 1, to: 3, fail: 0.03, gapMs: [3500, 6500] },
};

const SYSTEM_IDS = new Set(bank.SYSTEMS.map(s => s.id));

function sanitizeOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  return {
    systems: Array.isArray(o.systems) ? [...new Set(o.systems.filter(s => SYSTEM_IDS.has(s)))] : [],
    count: COUNT_CHOICES.includes(Number(o.count)) ? Number(o.count) : DEFAULTS.count,
    seconds: SECOND_CHOICES.includes(Number(o.seconds)) ? Number(o.seconds) : DEFAULTS.seconds,
    // HY only skips the low-yield diagnoses (bank/lowyield.js) as cases.
    hyOnly: typeof o.hyOnly === 'boolean' ? o.hyOnly : DEFAULTS.hyOnly,
    skipDays: SKIP_CHOICES.includes(Number(o.skipDays)) ? Number(o.skipDays) : DEFAULTS.skipDays,
  };
}

const pointsFor = (attempts) => Math.max(0, 100 * (FAIL_ATTEMPTS - attempts));
const nameOf = (key) => bank.answers.get(key)?.name || key;

module.exports = function createClueLadder({ io, lobbies, shuffle, awardXP, lobbyPayload }) {
  const humans = (lobby) => [...lobby.players.values()].filter(p => !p.isBot);

  function catalog() {
    return {
      systems: bank.SYSTEMS,
      counts: COUNT_CHOICES,
      seconds: SECOND_CHOICES,
      skipDays: SKIP_CHOICES,
      clues: bank.CLUE_COUNT,
      total: bank.cases.length,
      hyTotal: bank.cases.filter(c => c.hy).length,
    };
  }

  // ── Diseases already had ──────────────────────────────────────────────────
  // socket.clSeen: Map(answerKey -> day number), from the player's browser,
  // with socket.clToday their own calendar day. byUser: the same per account.
  const byUser = new Map();   // userId -> Map(answerKey -> day number)

  function trimSeen(m, today) {
    for (const [k, d] of m) if (today - d > SEEN_KEEP_DAYS) m.delete(k);
    while (m.size > SEEN_MAX) m.delete(m.keys().next().value);
  }

  /** Every disease any human in the room has had within `days` days. */
  function seenBy(lobby, days) {
    const out = new Set();
    if (!days) return out;
    for (const p of humans(lobby)) {
      const sock = io.sockets.sockets.get(p.id);
      const today = sock?.clToday ?? utcToday();
      for (const m of [sock?.clSeen, sock?.userId ? byUser.get(sock.userId) : null]) {
        if (!m) continue;
        for (const [k, d] of m) if (today - d < days) out.add(k);
      }
    }
    return out;
  }

  /** This case's disease now counts as had, for every human in the room. */
  function markSeen(lobby, key) {
    for (const p of humans(lobby)) {
      const sock = io.sockets.sockets.get(p.id);
      if (!sock) continue;
      const today = sock.clToday ?? utcToday();
      if (!(sock.clSeen instanceof Map)) sock.clSeen = new Map();
      sock.clSeen.delete(key);
      sock.clSeen.set(key, today);
      if (sock.userId) {
        let m = byUser.get(sock.userId);
        if (!m) { m = new Map(); byUser.set(sock.userId, m); }
        m.delete(key);
        m.set(key, today);
        trimSeen(m, today);
      }
    }
  }

  /**
   * The cases for a match: the pool the host chose, one case per disease,
   * diseases nobody has had lately first. If there are not enough fresh ones
   * the run is topped up with seen ones (and the room is told), rather than
   * coming up short.
   */
  function buildRun(opts, lobby) {
    const pool = bank.cases.filter(c => (!opts.systems.length || opts.systems.includes(c.system)) && (!opts.hyOnly || c.hy));
    const seen = seenBy(lobby, opts.skipDays);
    const pick = (list, taken) => {
      const out = [];
      for (const c of shuffle([...list])) if (!taken.has(c.answer)) { taken.add(c.answer); out.push(c); }
      return out;
    };
    const taken = new Set();
    const fresh = pick(pool.filter(c => !seen.has(c.answer)), taken);
    const stale = pick(pool.filter(c => seen.has(c.answer)), taken);
    const queue = [...fresh, ...stale].slice(0, opts.count);
    const span = opts.skipDays === 1 ? 'today' : `in the last ${opts.skipDays} days`;
    let notice = null;
    if (opts.skipDays && seen.size) {
      const skipped = new Set(pool.filter(c => seen.has(c.answer)).map(c => c.answer)).size;
      if (fresh.length >= queue.length) {
        notice = `Skipping ${skipped} disease${skipped === 1 ? '' : 's'} you have had ${span}. ${fresh.length - queue.length} new ones left after this match.`;
      } else if (fresh.length) {
        notice = `Only ${fresh.length} new disease${fresh.length === 1 ? '' : 's'} left in this selection, so ${queue.length - fresh.length} you have had ${span} are coming round again.`;
      } else {
        notice = `You have had every disease in this selection ${span}, so they are coming round again.`;
      }
    }
    return { queue, notice };
  }

  // ── State helpers ─────────────────────────────────────────────────────────

  const freshRun = () => ({ attempts: 0, guesses: [], solved: false, out: false, doneAt: null });

  function mine(s, playerId) {
    const r = s.runs.get(playerId) || freshRun();
    const c = s.queue[s.idx];
    // One clue per attempt still to make; once done (solved or out) the
    // whole ladder is theirs to read while the others finish.
    const shown = r.solved || r.out ? MAX_ATTEMPTS : Math.min(MAX_ATTEMPTS, r.attempts + 1);
    return {
      index: s.idx + 1,
      clues: c.clues.slice(0, shown),
      attempts: r.attempts,
      guesses: r.guesses.map(g => ({ name: g.name, correct: g.correct, pass: g.pass })),
      solved: r.solved,
      out: r.out,
      maxAttempts: MAX_ATTEMPTS,
    };
  }

  function progress(lobby) {
    const s = lobby.cl;
    return [...lobby.players.values()].map(p => {
      const r = s.runs.get(p.id) || freshRun();
      return { id: p.id, attempts: r.attempts, solved: r.solved, out: r.out };
    });
  }

  function standings(lobby) {
    const s = lobby.cl;
    return [...lobby.players.values()].map(p => {
      const t = s.totals.get(p.id) || { attempts: 0, solved: 0, points: 0, ms: 0, played: 0 };
      return { id: p.id, username: p.username, isBot: Boolean(p.isBot), ...t };
    }).sort((a, b) => a.attempts - b.attempts || b.solved - a.solved || a.ms - b.ms);
  }

  const everyoneDone = (lobby) => [...lobby.players.keys()].every(id => {
    const r = lobby.cl.runs.get(id);
    return r && (r.solved || r.out);
  });

  // ── A match ───────────────────────────────────────────────────────────────

  function start(lobby) {
    const opts = sanitizeOptions(lobby.clOptions);
    const { queue, notice } = buildRun(opts, lobby);
    if (!queue.length) {
      io.to(lobby.id).emit('error', { message: 'No Clue Ladder cases for that choice yet.' });
      return;
    }
    lobby.status = 'clue_ladder';
    lobby.cl = {
      opts, queue, notice, idx: -1, phase: 'intro', seconds: opts.seconds,
      answers: bank.answerList(opts.systems).map(a => ({ name: a.name, aliases: a.aliases })),
      runs: new Map(), totals: new Map(), timer: null, botTimers: [],
      opensAt: 0, endsAt: 0, reveal: null, revealAt: 0, history: [],
    };
    for (const p of lobby.players.values()) {
      p.score = 0;
      lobby.cl.totals.set(p.id, { attempts: 0, solved: 0, points: 0, ms: 0, played: 0 });
    }
    io.to(lobby.id).emit('game_start', { gameMode: 'clue_ladder', total: queue.length });
    setTimeout(() => next(lobby), 900);
  }

  function roundPublic(s) {
    const c = s.queue[s.idx];
    const sys = bank.SYSTEMS.find(x => x.id === c.system);
    return {
      index: s.idx + 1,
      total: s.queue.length,
      group: c.group,
      system: sys ? { id: sys.id, name: sys.name, icon: sys.icon } : null,
      seconds: s.seconds,
      maxAttempts: MAX_ATTEMPTS,
      answers: s.answers,
      notice: s.idx === 0 ? s.notice : null,
    };
  }

  function clearBots(s) {
    for (const t of s.botTimers) clearTimeout(t);
    s.botTimers = [];
  }

  function next(lobby) {
    const s = lobby.cl;
    if (!s || lobby.status !== 'clue_ladder') return;
    s.idx += 1;
    if (s.idx >= s.queue.length) return finish(lobby, 'complete');
    s.phase = 'intro';
    s.reveal = null;
    s.runs = new Map([...lobby.players.keys()].map(id => [id, freshRun()]));
    s.opensAt = Date.now() + INTRO_MS;
    s.endsAt = s.opensAt + s.seconds * 1000;
    io.to(lobby.id).emit('cl_round', { ...roundPublic(s), phase: 'intro', msToOpen: INTRO_MS, msLeft: s.seconds * 1000 });
    clearTimeout(s.timer);
    s.timer = setTimeout(() => open(lobby), INTRO_MS);
  }

  function sendMine(lobby, playerId) {
    const sock = io.sockets.sockets.get(playerId);
    if (sock) sock.emit('cl_me', mine(lobby.cl, playerId));
  }

  function open(lobby) {
    const s = lobby.cl;
    if (!s || lobby.status !== 'clue_ladder' || s.phase !== 'intro') return;
    s.phase = 'playing';
    s.endsAt = Date.now() + s.seconds * 1000;
    io.to(lobby.id).emit('cl_open', { index: s.idx + 1, msLeft: s.seconds * 1000 });
    for (const p of lobby.players.values()) if (!p.isBot) sendMine(lobby, p.id);
    io.to(lobby.id).emit('cl_progress', { players: progress(lobby) });
    s.timer = setTimeout(() => reveal(lobby), s.seconds * 1000 + GRACE_MS);
    for (const bot of lobby.players.values()) if (bot.isBot) scheduleBot(lobby, bot);
  }

  // One bot's climb for this case: wrong guesses from the same group (then
  // anywhere) until its target attempt, then the answer — or never.
  function scheduleBot(lobby, bot) {
    const s = lobby.cl;
    const prof = BOT_PROFILE[bot.difficulty] || BOT_PROFILE.hard;
    const c = s.queue[s.idx];
    const fails = Math.random() < prof.fail;
    const target = fails ? FAIL_ATTEMPTS : prof.from + Math.floor(Math.random() * (prof.to - prof.from + 1));
    const sameGroup = shuffle(bank.cases.filter(x => x.system === c.system && x.group === c.group && x.answer !== c.answer).map(x => x.answer));
    const anyOther = shuffle([...bank.answers.values()].filter(a => a.key !== c.answer && a.system === c.system).map(a => a.key));
    const wrongs = [...new Set([...sameGroup, ...anyOther])];
    let at = 0;
    for (let k = 1; k <= Math.min(target, MAX_ATTEMPTS); k++) {
      at += prof.gapMs[0] + Math.random() * (prof.gapMs[1] - prof.gapMs[0]);
      const key = k === target ? c.answer : wrongs[k - 1];
      s.botTimers.push(setTimeout(() => {
        if (lobby.cl !== s || s.phase !== 'playing' || !lobby.players.has(bot.id)) return;
        applyGuess(lobby, bot.id, key);
      }, at));
    }
  }

  /** key = an answer key, or null for a pass. Returns the outcome string. */
  function applyGuess(lobby, playerId, key) {
    const s = lobby.cl;
    const r = s.runs.get(playerId);
    if (!r || r.solved || r.out) return 'done';
    const c = s.queue[s.idx];
    if (key && r.guesses.some(g => g.key === key)) return 'repeat';
    const correct = key === c.answer;
    r.attempts += 1;
    r.guesses.push({ key, name: key ? nameOf(key) : null, correct, pass: !key });
    if (correct) { r.solved = true; r.doneAt = Date.now(); }
    else if (r.attempts >= MAX_ATTEMPTS) { r.out = true; r.doneAt = Date.now(); }
    io.to(lobby.id).emit('cl_progress', { players: progress(lobby) });
    if (everyoneDone(lobby)) {
      clearTimeout(s.timer);
      s.timer = setTimeout(() => reveal(lobby), 900);
    }
    return correct ? 'correct' : 'wrong';
  }

  function guard(socket, ack) {
    const reply = typeof ack === 'function' ? ack : () => {};
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.cl;
    if (!lobby || !s || lobby.status !== 'clue_ladder' || !lobby.players.has(socket.id)) { reply({ ok: false }); return null; }
    if (s.phase !== 'playing' || Date.now() > s.endsAt + GRACE_MS) { reply({ ok: false, reason: 'closed' }); return null; }
    return { lobby, s, reply };
  }

  function onGuess(socket, payload, ack) {
    const g = guard(socket, ack);
    if (!g) return;
    const text = String(payload?.text || '').slice(0, 120);
    const key = bank.resolve(text);
    if (!key || !g.s.answers.some(a => bank.resolve(a.name) === key)) {
      return g.reply({ ok: false, reason: 'unknown', me: mine(g.s, socket.id) });
    }
    const result = applyGuess(g.lobby, socket.id, key);
    g.reply({ ok: result === 'correct' || result === 'wrong', result, name: nameOf(key), me: mine(g.s, socket.id) });
  }

  function onPass(socket, ack) {
    const g = guard(socket, ack);
    if (!g) return;
    const result = applyGuess(g.lobby, socket.id, null);
    g.reply({ ok: result === 'wrong', result: result === 'wrong' ? 'pass' : result, me: mine(g.s, socket.id) });
  }

  function reveal(lobby) {
    const s = lobby.cl;
    if (!s || lobby.status !== 'clue_ladder' || s.phase !== 'playing') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'reveal';
    const c = s.queue[s.idx];

    const results = [];
    for (const p of lobby.players.values()) {
      const r = s.runs.get(p.id) || freshRun();
      const attempts = r.solved ? r.attempts : FAIL_ATTEMPTS;
      const ms = r.solved ? Math.max(0, r.doneAt - (s.endsAt - s.seconds * 1000)) : s.seconds * 1000;
      const t = s.totals.get(p.id) || { attempts: 0, solved: 0, points: 0, ms: 0, played: 0 };
      t.attempts += attempts;
      t.solved += r.solved ? 1 : 0;
      t.points += pointsFor(attempts);
      t.ms += ms;
      t.played += 1;
      s.totals.set(p.id, t);
      p.score = t.points;
      results.push({
        id: p.id, username: p.username, isBot: Boolean(p.isBot),
        solved: r.solved, attempts, seconds: r.solved ? Math.round(ms / 100) / 10 : null,
        guesses: r.guesses.map(g => (g.pass ? '(next clue)' : g.name)),
      });
    }
    results.sort((a, b) => a.attempts - b.attempts || (a.seconds ?? 1e9) - (b.seconds ?? 1e9));

    s.history.push({
      index: s.idx + 1, answer: nameOf(c.answer), group: c.group,
      solvedBy: results.filter(r => r.solved).length,
      best: results[0]?.solved ? results[0].attempts : null,
    });
    markSeen(lobby, c.answer);
    s.reveal = {
      answerKey: c.answer,
      brief: bank.answers.get(c.answer)?.brief || null,
      index: s.idx + 1, total: s.queue.length,
      answer: nameOf(c.answer), group: c.group, clues: c.clues,
      results, standings: standings(lobby),
      isLast: s.idx >= s.queue.length - 1, msLeft: REVEAL_MS,
    };
    s.revealAt = Date.now();
    io.to(lobby.id).emit('cl_reveal', s.reveal);
    s.timer = setTimeout(() => next(lobby), REVEAL_MS);
  }

  function finish(lobby, reason) {
    const s = lobby.cl;
    if (!s || lobby.status === 'game_over') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'done';
    lobby.status = 'game_over';

    const rows = standings(lobby);
    const sorted = rows.map(r => lobby.players.get(r.id)).filter(Boolean);
    lobby.correctCounts = new Map(rows.map(r => [r.id, r.solved]));
    lobby.answeredCounts = new Map(rows.map(r => [r.id, r.played]));
    lobby.questionIdx = Math.max(0, s.history.length - 1);

    const players = rows.map((r, i) => ({
      id: r.id, username: r.username, isBot: r.isBot, place: i + 1,
      attempts: r.attempts, solved: r.solved, played: r.played, score: r.points,
      seconds: Math.round(r.ms / 100) / 10, lives: 0, alive: true,
    }));
    io.to(lobby.id).emit('game_over', {
      gameMode: 'clue_ladder', reason,
      winner: players[0]?.username || null,
      players, total: s.queue.length, history: s.history,
    });
    awardXP(lobby, sorted).catch(err => console.error('[awardXP clue ladder]', err.message));
  }

  // ── Leaving, resetting, catching up ───────────────────────────────────────

  function onLeave(lobby, socketId) {
    const s = lobby.cl;
    if (!s) return;
    s.runs.delete(socketId);
    if (!humans(lobby).length) {
      clearTimeout(s.timer);
      clearBots(s);
      lobbies.delete(lobby.id);
      return;
    }
    if (s.phase === 'playing') {
      io.to(lobby.id).emit('cl_progress', { players: progress(lobby) });
      if (everyoneDone(lobby)) {
        clearTimeout(s.timer);
        s.timer = setTimeout(() => reveal(lobby), 600);
      }
    }
  }

  function reset(lobby) {
    const s = lobby.cl;
    if (!s) return;
    clearTimeout(s.timer);
    clearBots(s);
    lobby.cl = null;
  }

  function sync(socket) {
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.cl;
    if (!lobby || !s || !lobby.players.has(socket.id) || s.idx < 0) return;
    if (s.phase === 'reveal' && s.reveal) {
      return socket.emit('cl_reveal', { ...s.reveal, msLeft: Math.max(0, REVEAL_MS - (Date.now() - s.revealAt)) });
    }
    if (s.phase === 'intro' || s.phase === 'playing') {
      socket.emit('cl_round', {
        ...roundPublic(s), phase: s.phase,
        msToOpen: Math.max(0, s.opensAt - Date.now()),
        msLeft: Math.max(0, s.endsAt - Date.now()),
      });
      if (s.phase === 'playing') {
        socket.emit('cl_me', mine(s, socket.id));
        socket.emit('cl_progress', { players: progress(lobby) });
      }
    }
  }

  function attach(socket) {
    socket.on('set_cl_options', ({ options } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const lobby = lobbies.get(socket.lobbyId);
      if (!lobby || lobby.gameMode !== 'clue_ladder') return reply({ ok: false });
      if (lobby.hostId !== socket.id) return reply({ ok: false, error: 'Only the host can change the settings.' });
      if (lobby.status !== 'waiting') return reply({ ok: false, error: 'The match has already started.' });
      lobby.clOptions = sanitizeOptions(options);
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
      reply({ ok: true, options: lobby.clOptions });
    });
    socket.on('cl_guess', (payload, ack) => onGuess(socket, payload, ack));
    socket.on('cl_pass', (_payload, ack) => onPass(socket, typeof _payload === 'function' ? _payload : ack));
    socket.on('cl_sync', () => sync(socket));
    // The player's own record of diseases had lately: { today, seen: { key: 'YYYY-MM-DD' } }.
    socket.on('cl_seen', (payload) => {
      const today = dayNum(payload?.today);
      const raw = payload && typeof payload.seen === 'object' && payload.seen ? payload.seen : {};
      if (today == null) return;
      const m = new Map();
      for (const [k, v] of Object.entries(raw).slice(-SEEN_MAX)) {
        const d = dayNum(v);
        if (d != null && bank.answers.has(k) && today - d >= 0 && today - d <= SEEN_KEEP_DAYS) m.set(k, d);
      }
      socket.clToday = today;
      socket.clSeen = m;
      if (socket.userId) {
        let mine = byUser.get(socket.userId);
        if (!mine) { mine = new Map(); byUser.set(socket.userId, mine); }
        for (const [k, d] of m) if (!mine.has(k) || mine.get(k) < d) mine.set(k, d);
        trimSeen(mine, today);
      }
    });
  }

  return {
    MAX_PLAYERS, COUNT_CHOICES, SECOND_CHOICES, MAX_ATTEMPTS,
    sanitizeOptions, start, attach, onLeave, reset, catalog,
    // exported for tests
    _applyGuess: applyGuess, _mine: mine,
  };
};

module.exports.pointsFor = pointsFor;
module.exports.MAX_ATTEMPTS = MAX_ATTEMPTS;
