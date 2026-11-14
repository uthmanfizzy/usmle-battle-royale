'use strict';

/**
 * MedJinx — the live game.
 *
 * A round shows a condition (open) or a vignette (clinical). Everyone types
 * as many correct associations as they can before the clock runs out. Each
 * accepted answer is worth its tier's points, shared between everyone who
 * found it — so the answers nobody else thought of are the ones that pay.
 *
 * Everything that decides a score happens here: the clock, the matching,
 * the sharing-out. The client is told whether an answer was accepted and
 * how many each player has found, and nothing else, until the round ends.
 *
 * Wire protocol
 *   → set_medjinx_options {options}        host, in the lobby
 *   → medjinx_submit {text}  ack {status}  during a round (any number, as fast as typed)
 *   → medjinx_ready                         on the breakdown: "next round"
 *   → medjinx_replay {on}                   host: play this topic again
 *   → medjinx_sync                          "send me where we are"
 *   ← medjinx_round    intro / answering, with the prompt and time left
 *   ← medjinx_progress accepted-answer counts per player
 *   ← medjinx_reveal   the breakdown (per player: includes their own log)
 *   ← medjinx_ready    how many are ready
 *   ← game_over        the shared event, with gameMode 'medjinx'
 */

const E = require('./engine');
const bank = require('./bank');

const MAX_PLAYERS = 20;
const INTRO_MS = 4000;
const REVEAL_MS = 75000;        // the breakdown moves on by itself after this
const GRACE_MS = 400;           // an answer sent on the buzzer still counts
const MAX_ATTEMPTS = 90;        // per player per round
const MAX_LEN = 80;
const RAPID_SECONDS = 20;

const DEFAULTS = Object.freeze({
  variant: 'mixed',             // open | clinical | mixed
  rounds: 5,
  seconds: 75,
  difficulty: 'mixed',          // mixed | easy | intermediate | advanced
  systems: [],                  // [] = every system
  events: true,
});

const VARIANTS = ['open', 'clinical', 'mixed'];
const ROUND_CHOICES = [3, 5, 7];
const SECOND_CHOICES = [45, 60, 75, 90];
const DIFFICULTIES = ['mixed', 'easy', 'intermediate', 'advanced'];

// How likely a bot is to know an answer of each tier.
// Deliberately beatable: a student who knows the histology and the genetics
// should finish ahead of a bot that mostly knows the symptoms.
const BOT_KNOWS = {
  easy:   [0.45, 0.20, 0.06, 0.02, 0.00],
  hard:   [0.70, 0.45, 0.22, 0.08, 0.03],
  expert: [0.85, 0.65, 0.45, 0.25, 0.10],
};

function sanitizeOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const systems = new Set(bank.catalog().systems.map(s => s.name));
  return {
    variant: VARIANTS.includes(o.variant) ? o.variant : DEFAULTS.variant,
    rounds: ROUND_CHOICES.includes(Number(o.rounds)) ? Number(o.rounds) : DEFAULTS.rounds,
    seconds: SECOND_CHOICES.includes(Number(o.seconds)) ? Number(o.seconds) : DEFAULTS.seconds,
    difficulty: DIFFICULTIES.includes(o.difficulty) ? o.difficulty : DEFAULTS.difficulty,
    systems: Array.isArray(o.systems) ? [...new Set(o.systems.filter(s => systems.has(s)))] : [],
    events: o.events !== false,
  };
}

module.exports = function createMedJinx({ io, lobbies, shuffle, awardXP, lobbyPayload, getSupabase }) {
  // Answers nobody had written into the bank. Kept in memory for the admin
  // review endpoint, and written to Supabase when the table exists.
  const review = new Map();     // topicId → Map(norm → { text, count, last })
  let warnedNoTable = false;

  // ── Building a match ──────────────────────────────────────────────────────

  function pickTopics(opts) {
    const bySystem = (t) => !opts.systems.length || opts.systems.includes(t.system);
    const byLevel = (t) => opts.difficulty === 'mixed' || t.difficulty === opts.difficulty;
    // Narrowest first; widen only as far as needed to fill the rounds, so a
    // host who asked for Advanced Endocrine gets as much of it as exists.
    const tiers = [
      bank.TOPICS.filter(t => bySystem(t) && byLevel(t)),
      bank.TOPICS.filter(bySystem),
      bank.TOPICS,
    ];
    const picked = [];
    for (const pool of tiers) {
      for (const t of shuffle(pool)) {
        if (picked.length >= opts.rounds) break;
        if (!picked.includes(t)) picked.push(t);
      }
    }
    return picked;
  }

  function buildQueue(opts) {
    const topics = pickTopics(opts);
    const rank = { easy: 0, intermediate: 1, advanced: 2 };
    const queue = topics.map(topic => ({ topic, variant: opts.variant, event: null }));
    const withEvents = opts.events && queue.length >= 3;

    if (withEvents) {
      // The hardest topic goes last and becomes the Boss Case.
      let hardest = 0;
      queue.forEach((q, i) => { if (rank[q.topic.difficulty] > rank[queue[hardest].topic.difficulty]) hardest = i; });
      const [boss] = queue.splice(hardest, 1);
      boss.event = 'boss';
      queue.push(boss);
    }

    // A mixed match alternates, starting on either. Done after the Boss Case
    // has been moved to the end, so moving it cannot bunch one kind together.
    if (opts.variant === 'mixed') {
      const offset = Math.random() < 0.5 ? 0 : 1;
      queue.forEach((q, i) => { q.variant = (i + offset) % 2 === 0 ? 'open' : 'clinical'; });
    }

    if (withEvents) {
      // A Boss Case is always a vignette, whatever the match is set to.
      queue[queue.length - 1].variant = 'clinical';

      // One or two of the others, never the opener, never the same twice.
      const pool = shuffle(['double', 'rare', 'rapid', 'reverse', 'streak']);
      const slots = shuffle(queue.map((_, i) => i).filter(i => i > 0 && i < queue.length - 1));
      const howMany = Math.min(slots.length, queue.length >= 6 ? 2 : 1);
      for (let n = 0; n < howMany; n++) {
        let ev = pool.pop();
        // A streak needs rounds behind it to mean anything.
        if (ev === 'streak' && slots[n] < 2) ev = pool.pop() || 'double';
        queue[slots[n]].event = ev;
      }
    }
    return queue;
  }

  // ── What a client may see ─────────────────────────────────────────────────

  function roundPublic(lobby) {
    const s = lobby.mjx;
    const q = s.queue[s.idx];
    const clinical = q.variant === 'clinical';
    return {
      round: s.idx + 1,
      total: s.queue.length,
      variant: q.variant,
      subject: q.topic.subject,
      system: q.topic.system,
      difficulty: q.topic.difficulty,
      event: q.event ? E.EVENTS[q.event] : null,
      seconds: s.seconds,
      // What each tier pays THIS round — a special round changes it, and the
      // legend on screen should say what is actually on offer.
      tiers: E.TIERS.map(t => ({ tier: t.tier, name: t.name, points: E.answerValue(t.tier, q.event) })),
      // A clinical round never names the condition — that is the first
      // thing the players are being asked to work out.
      prompt: clinical
        ? { kind: q.topic.vignetteType, vignette: q.topic.vignette }
        : { title: q.topic.title, description: q.topic.description },
    };
  }

  function counts(lobby) {
    const s = lobby.mjx;
    const out = {};
    for (const p of lobby.players.values()) out[p.id] = s.found.get(p.id)?.size || 0;
    return out;
  }

  const humans = (lobby) => [...lobby.players.values()].filter(p => !p.isBot);

  // ── Starting ──────────────────────────────────────────────────────────────

  function start(lobby) {
    const opts = sanitizeOptions(lobby.medjinxOptions);
    const queue = buildQueue(opts);
    if (!queue.length) {
      io.to(lobby.id).emit('error', { message: 'MedJinx has no topics to play yet.' });
      return;
    }

    lobby.status = 'medjinx';
    lobby.mjx = {
      opts, queue, idx: 0, phase: 'intro', seconds: opts.seconds,
      compiled: null, found: new Map(), tried: new Map(), log: new Map(),
      attempts: new Map(), lastAt: new Map(),
      totals: new Map(), streaks: new Map(), ready: new Set(),
      replay: false, timer: null, botTimers: [], endsAt: 0, opensAt: 0,
      reveal: null, mine: new Map(), history: [],
    };
    for (const p of lobby.players.values()) {
      p.score = 0;
      lobby.mjx.totals.set(p.id, { score: 0, accepted: 0, unique: 0, bestTier: 0, rarest: null, attempts: 0 });
    }

    io.to(lobby.id).emit('game_start', { gameMode: 'medjinx' });
    beginRound(lobby);
  }

  function beginRound(lobby) {
    const s = lobby.mjx;
    if (!s || lobby.status !== 'medjinx') return;
    const q = s.queue[s.idx];

    s.phase = 'intro';
    s.compiled = E.compileTopic(q.topic, q.variant);
    s.seconds = q.event === 'rapid' ? RAPID_SECONDS : s.opts.seconds;
    s.found = new Map();
    s.tried = new Map();
    s.log = new Map();
    s.attempts = new Map();
    s.lastAt = new Map();
    s.ready = new Set();
    s.replay = false;
    s.reveal = null;
    s.mine = new Map();
    for (const p of lobby.players.values()) {
      s.found.set(p.id, new Map());
      s.tried.set(p.id, new Set());
      s.log.set(p.id, []);
    }

    s.opensAt = Date.now() + INTRO_MS;
    io.to(lobby.id).emit('medjinx_round', { ...roundPublic(lobby), phase: 'intro', msLeft: INTRO_MS, counts: counts(lobby) });
    clearTimeout(s.timer);
    s.timer = setTimeout(() => openRound(lobby), INTRO_MS);
  }

  function openRound(lobby) {
    const s = lobby.mjx;
    if (!s || lobby.status !== 'medjinx' || s.phase !== 'intro') return;
    s.phase = 'answering';
    const ms = s.seconds * 1000;
    s.endsAt = Date.now() + ms;
    io.to(lobby.id).emit('medjinx_round', { ...roundPublic(lobby), phase: 'answering', msLeft: ms, counts: counts(lobby) });
    s.timer = setTimeout(() => closeRound(lobby), ms + GRACE_MS);
    scheduleBots(lobby);
  }

  // ── Bots ──────────────────────────────────────────────────────────────────

  function scheduleBots(lobby) {
    const s = lobby.mjx;
    const ms = s.seconds * 1000;
    for (const bot of lobby.players.values()) {
      if (!bot.isBot) continue;
      const knows = BOT_KNOWS[bot.difficulty] || BOT_KNOWS.hard;
      // A bot types about as fast as a person: one answer every few seconds.
      const cap = Math.max(2, Math.floor(s.seconds / 6));
      const mine = shuffle(s.compiled.answers.filter(a => Math.random() < knows[a.tier - 1])).slice(0, cap);
      for (const a of mine) {
        const at = 1500 + Math.random() * Math.max(500, ms - 2500);
        s.botTimers.push(setTimeout(() => {
          if (lobby.mjx !== s || s.phase !== 'answering' || !lobby.players.has(bot.id)) return;
          const got = s.found.get(bot.id);
          if (!got || got.has(a.id)) return;
          got.set(a.id, a.label);
          s.attempts.set(bot.id, (s.attempts.get(bot.id) || 0) + 1);
          io.to(lobby.id).emit('medjinx_progress', { counts: counts(lobby) });
        }, at));
      }
    }
  }

  function clearBots(s) {
    for (const t of s.botTimers) clearTimeout(t);
    s.botTimers = [];
  }

  // ── An answer arrives ─────────────────────────────────────────────────────

  function submit(socket, payload, ack) {
    const reply = typeof ack === 'function' ? ack : () => {};
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.mjx;
    if (!lobby || !s || lobby.status !== 'medjinx' || !lobby.players.has(socket.id)) return reply({ status: 'closed' });
    if (s.phase !== 'answering' || Date.now() > s.endsAt + GRACE_MS) return reply({ status: 'closed' });

    // No minimum gap between answers: this is a game of typing as fast as
    // you can think, and a dropped answer is worse than a spammed one. The
    // per-round cap below is what bounds a flood.
    const text = String(payload?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
    const keys = E.keysOf(text);
    if (!keys) return reply({ status: 'empty' });

    const tried = s.tried.get(socket.id);
    const found = s.found.get(socket.id);
    const log = s.log.get(socket.id);
    if (!tried || !found || !log) return reply({ status: 'closed' });
    if ((s.attempts.get(socket.id) || 0) >= MAX_ATTEMPTS) return reply({ status: 'limit' });

    // The same wording twice is not a second attempt.
    if (tried.has(keys.sorted)) return reply({ status: 'duplicate', text });
    tried.add(keys.sorted);

    const m = E.matchAnswer(s.compiled, text);

    if (m.status === 'accepted') {
      // A different wording of something already found.
      if (found.has(m.answer.id)) return reply({ status: 'duplicate', text, label: m.answer.label });
      found.set(m.answer.id, text);
      s.attempts.set(socket.id, (s.attempts.get(socket.id) || 0) + 1);
      log.push({ text, status: 'accepted', id: m.answer.id });
      io.to(lobby.id).emit('medjinx_progress', { counts: counts(lobby) });
      return reply({ status: 'accepted', text, label: m.answer.label });
    }

    s.attempts.set(socket.id, (s.attempts.get(socket.id) || 0) + 1);

    if (m.status === 'trap') {
      // Naming the topic back is told straight away — there is nothing to
      // give away. A wrong association is only explained at the reveal.
      log.push({ text, status: m.self ? 'self' : 'trap', why: m.why });
      return reply({ status: m.self ? 'self' : 'rejected', text, note: m.self ? m.why : undefined });
    }

    log.push({ text, status: 'unknown' });
    noteUnknown(s.queue[s.idx].topic.id, keys.sorted, text);
    return reply({ status: 'rejected', text });
  }

  function noteUnknown(topicId, norm, text) {
    if (!review.has(topicId)) review.set(topicId, new Map());
    const m = review.get(topicId);
    const row = m.get(norm) || { text, count: 0, last: 0 };
    row.count += 1;
    row.last = Date.now();
    m.set(norm, row);
    // Bounded: a topic keeps its 400 most recent distinct unknowns.
    if (m.size > 400) m.delete(m.keys().next().value);

    const supabase = getSupabase();
    if (!supabase) return;
    supabase.from('medjinx_unmatched').insert({ topic_id: topicId, answer: text, norm })
      .then(({ error }) => {
        if (error && !warnedNoTable) {
          warnedNoTable = true;
          console.warn('[medjinx] unmatched answers are not being saved —', error.message);
        }
      }, () => {});
  }

  // ── The round ends ────────────────────────────────────────────────────────

  function closeRound(lobby) {
    const s = lobby.mjx;
    if (!s || lobby.status !== 'medjinx' || s.phase !== 'answering') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'reveal';

    const q = s.queue[s.idx];
    const scored = E.scoreRound(s.compiled, s.found, q.event, s.streaks);
    const name = (id) => lobby.players.get(id)?.username || 'Player';

    for (const [pid, r] of scored.players) {
      const t = s.totals.get(pid);
      if (!t) continue;
      t.score += r.points;
      t.accepted += r.accepted;
      t.unique += r.unique;
      t.attempts += s.attempts.get(pid) || 0;
      if (r.bestTier > t.bestTier) { t.bestTier = r.bestTier; t.rarest = r.rarest; }
      // Read by scoreRound in a Streak Round, so it is updated only after.
      s.streaks.set(pid, r.bestTier >= 3 ? (s.streaks.get(pid) || 0) + 1 : 0);
      const p = lobby.players.get(pid);
      if (p) p.score = t.score;
    }

    const standings = [...lobby.players.values()].map((p) => {
      const r = scored.players.get(p.id) || { points: 0, accepted: 0, unique: 0, bestTier: 0, rarest: null, multiplier: 1 };
      const t = s.totals.get(p.id) || { score: 0 };
      return {
        id: p.id, username: p.username, isBot: Boolean(p.isBot),
        roundPoints: r.points, total: t.score, accepted: r.accepted, unique: r.unique,
        bestTier: r.bestTier, rarest: r.rarest, multiplier: r.multiplier,
        streak: s.streaks.get(p.id) || 0,
      };
    }).sort((a, b) => b.total - a.total || b.roundPoints - a.roundPoints);

    // Wrong answers people actually gave, with why — the room learns from
    // each other's mistakes as well as its own.
    const traps = new Map();
    for (const [pid, log] of s.log) {
      for (const e of log) {
        if (e.status !== 'trap') continue;
        const row = traps.get(e.why) || { why: e.why, texts: [], by: [] };
        if (!row.texts.includes(e.text)) row.texts.push(e.text);
        if (!row.by.includes(name(pid))) row.by.push(name(pid));
        traps.set(e.why, row);
      }
    }

    const best = scored.perAnswer
      .filter(a => a.finders.length)
      .sort((a, b) => b.tier - a.tier || a.finders.length - b.finders.length)[0];
    s.history.push({
      round: s.idx + 1, title: q.topic.title, variant: q.variant, event: q.event,
      found: scored.perAnswer.filter(a => a.finders.length).length, bank: scored.perAnswer.length,
      best: best ? { label: best.label, tier: best.tier, by: best.finders.map(name) } : null,
    });

    s.reveal = {
      ...roundPublic(lobby),
      phase: 'reveal',
      msLeft: REVEAL_MS,
      isLast: s.idx >= s.queue.length - 1,
      topic: {
        id: q.topic.id, title: q.topic.title, description: q.topic.description,
        vignette: q.variant === 'clinical' ? q.topic.vignette : null,
        source: q.topic.source, takeaways: q.topic.takeaways,
      },
      answers: scored.perAnswer.map(a => ({
        id: a.id, label: a.label, tier: a.tier, category: a.category, why: a.why,
        value: a.value, each: a.each, finders: a.finders,
      })),
      traps: [...traps.values()],
      standings,
      ready: 0, need: humans(lobby).length, replay: false,
    };
    s.revealAt = Date.now();

    for (const p of humans(lobby)) {
      const log = s.log.get(p.id) || [];
      const attempts = s.attempts.get(p.id) || 0;
      const accepted = s.found.get(p.id)?.size || 0;
      const mine = {
        log: log.map(e => ({ text: e.text, status: e.status, id: e.id, why: e.why })),
        attempts, accepted,
        accuracy: attempts ? Math.round((accepted / attempts) * 100) : null,
      };
      s.mine.set(p.id, mine);
      io.to(p.id).emit('medjinx_reveal', { ...s.reveal, mine });
    }

    s.timer = setTimeout(() => advance(lobby), REVEAL_MS);
    // A room of one person and some bots has nobody to wait for but them.
    if (!humans(lobby).length) advance(lobby);
  }

  function ready(socket) {
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.mjx;
    if (!lobby || !s || s.phase !== 'reveal' || !lobby.players.has(socket.id)) return;
    s.ready.add(socket.id);
    checkReady(lobby);
  }

  function checkReady(lobby) {
    const s = lobby.mjx;
    if (!s || s.phase !== 'reveal') return;
    const hs = humans(lobby);
    const n = hs.filter(p => s.ready.has(p.id)).length;
    if (s.reveal) { s.reveal.ready = n; s.reveal.need = hs.length; }
    io.to(lobby.id).emit('medjinx_ready', { ready: n, need: hs.length });
    if (n >= hs.length) {
      clearTimeout(s.timer);
      s.timer = setTimeout(() => advance(lobby), 500);
    }
  }

  function setReplay(socket, payload) {
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.mjx;
    if (!lobby || !s || s.phase !== 'reveal' || lobby.hostId !== socket.id) return;
    s.replay = Boolean(payload?.on);
    if (s.reveal) s.reveal.replay = s.replay;
    io.to(lobby.id).emit('medjinx_replay', { on: s.replay });
  }

  function advance(lobby) {
    const s = lobby.mjx;
    if (!s || lobby.status !== 'medjinx' || s.phase !== 'reveal') return;
    clearTimeout(s.timer);
    if (s.replay) {
      // The same topic again, as an extra round and without its event.
      const q = s.queue[s.idx];
      s.queue.splice(s.idx + 1, 0, { topic: q.topic, variant: q.variant, event: null });
    }
    s.idx += 1;
    if (s.idx >= s.queue.length) return finish(lobby, 'complete');
    beginRound(lobby);
  }

  // ── The match ends ────────────────────────────────────────────────────────

  function finish(lobby, reason) {
    const s = lobby.mjx;
    if (!s || lobby.status === 'game_over') return;
    clearTimeout(s.timer);
    clearBots(s);
    s.phase = 'done';
    lobby.status = 'game_over';

    const sorted = [...lobby.players.values()].sort((a, b) => {
      const ta = s.totals.get(a.id), tb = s.totals.get(b.id);
      return (tb?.score || 0) - (ta?.score || 0) || (tb?.unique || 0) - (ta?.unique || 0);
    });

    // What awardXP reads for every mode.
    lobby.correctCounts = new Map(sorted.map(p => [p.id, s.totals.get(p.id)?.accepted || 0]));
    lobby.answeredCounts = new Map(sorted.map(p => [p.id, s.totals.get(p.id)?.attempts || 0]));
    lobby.questionIdx = Math.max(0, s.history.length - 1);

    const players = sorted.map((p, i) => {
      const t = s.totals.get(p.id) || {};
      return {
        id: p.id, username: p.username, isBot: Boolean(p.isBot), clanTag: p.clanTag || null,
        place: i + 1, score: t.score || 0, accepted: t.accepted || 0, unique: t.unique || 0,
        bestTier: t.bestTier || 0, rarest: t.rarest || null,
        accuracy: t.attempts ? Math.round(((t.accepted || 0) / t.attempts) * 100) : null,
        lives: p.lives, alive: true,
      };
    });

    io.to(lobby.id).emit('game_over', {
      gameMode: 'medjinx',
      reason,
      winner: players[0]?.username || null,
      players,
      rounds: s.history,
    });
    awardXP(lobby, sorted).catch(err => console.error('[awardXP medjinx]', err.message));
  }

  // ── Leaving, resetting, catching up ───────────────────────────────────────

  function onLeave(lobby, socketId) {
    const s = lobby.mjx;
    if (!s) return;
    for (const m of [s.found, s.tried, s.log, s.attempts, s.lastAt, s.mine]) m.delete(socketId);
    s.ready.delete(socketId);

    if (!humans(lobby).length) {
      // Only bots left: there is nobody to play for.
      clearTimeout(s.timer);
      clearBots(s);
      lobbies.delete(lobby.id);
      return;
    }
    if (lobby.players.size <= 1) return finish(lobby, 'forfeit');
    if (s.phase === 'answering') io.to(lobby.id).emit('medjinx_progress', { counts: counts(lobby) });
    if (s.phase === 'reveal') checkReady(lobby);
  }

  function reset(lobby) {
    const s = lobby.mjx;
    if (!s) return;
    clearTimeout(s.timer);
    clearBots(s);
    lobby.mjx = null;
  }

  function sync(socket) {
    const lobby = lobbies.get(socket.lobbyId);
    const s = lobby?.mjx;
    if (!lobby || !s || !lobby.players.has(socket.id)) return;
    if (s.phase === 'reveal' && s.reveal) {
      const msLeft = Math.max(0, REVEAL_MS - (Date.now() - (s.revealAt || Date.now())));
      return socket.emit('medjinx_reveal', { ...s.reveal, msLeft, mine: s.mine.get(socket.id) || null });
    }
    if (s.phase === 'intro' || s.phase === 'answering') {
      const msLeft = Math.max(0, (s.phase === 'intro' ? s.opensAt : s.endsAt) - Date.now());
      const log = (s.log.get(socket.id) || []).map((e) => ({
        text: e.text,
        status: e.status === 'accepted' ? 'accepted' : e.status === 'self' ? 'self' : 'rejected',
      }));
      socket.emit('medjinx_round', { ...roundPublic(lobby), phase: s.phase, msLeft, counts: counts(lobby), log });
    }
  }

  function attach(socket) {
    socket.on('set_medjinx_options', ({ options } = {}, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      const lobby = lobbies.get(socket.lobbyId);
      if (!lobby || lobby.gameMode !== 'medjinx') return reply({ ok: false });
      if (lobby.hostId !== socket.id) return reply({ ok: false, error: 'Only the host can change the settings.' });
      if (lobby.status !== 'waiting') return reply({ ok: false, error: 'The match has already started.' });
      lobby.medjinxOptions = sanitizeOptions(options);
      io.to(lobby.id).emit('lobby_update', lobbyPayload(lobby));
      reply({ ok: true, options: lobby.medjinxOptions });
    });
    socket.on('medjinx_submit', (payload, ack) => submit(socket, payload, ack));
    socket.on('medjinx_ready', () => ready(socket));
    socket.on('medjinx_replay', (payload) => setReplay(socket, payload));
    socket.on('medjinx_sync', () => sync(socket));
  }

  /** Unmatched answers waiting for a person to look at them. */
  function reviewQueue() {
    const out = [];
    for (const [topicId, m] of review) {
      const topic = bank.byId.get(topicId);
      for (const [norm, row] of m) {
        out.push({ topicId, topic: topic?.title || topicId, norm, text: row.text, count: row.count, last: row.last });
      }
    }
    return out.sort((a, b) => b.count - a.count || b.last - a.last);
  }

  return {
    MAX_PLAYERS,
    defaults: () => ({ ...DEFAULTS, systems: [] }),
    sanitizeOptions, start, attach, onLeave, reset, reviewQueue,
    catalog: () => ({
      ...bank.catalog(),
      tiers: E.TIERS,
      events: Object.values(E.EVENTS),
      choices: { variants: VARIANTS, rounds: ROUND_CHOICES, seconds: SECOND_CHOICES, difficulties: DIFFICULTIES },
    }),
  };
};
