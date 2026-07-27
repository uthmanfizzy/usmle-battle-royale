#!/usr/bin/env node
'use strict';
/**
 * AnKing -> MedVale import tool. STANDALONE + LOCAL. Not wired into the server.
 *
 *   node import-anking.js --dry-run          # analyse, write ./out/dry-run-report.md
 *   node import-anking.js --dry-run --fresh  # ignore checkpoint, start over
 *   node import-anking.js --dry-run --limit 500
 *
 * This build supports --dry-run ONLY. It never connects to Supabase, never
 * uploads media, and never writes outside ./out. The Anki collection is opened
 * read-only from a COPY; the live Anki profile is refused outright.
 *
 * Resumability: notes are streamed in id order and appended to out/notes.ndjson
 * and out/cards.ndjson, with out/state.json recording the last completed note id
 * plus the exact byte length of each output file. A resumed run truncates both
 * files back to those lengths (discarding any half-written line from a crash)
 * and continues. Re-running to completion always yields the same output.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const initSqlJs = require('sql.js');

const cfg = require('./config');
const P = require('./parse');

const CHECKPOINT_EVERY = 1000;
const MAX_SAMPLES = 8;
const OUT = cfg.PATHS.outDir;
const FILES = {
  notes: path.join(OUT, 'notes.ndjson'),
  cards: path.join(OUT, 'cards.ndjson'),
  state: path.join(OUT, 'state.json'),
  issues: path.join(OUT, 'issues.ndjson'),
  report: path.join(OUT, 'dry-run-report.md'),
};

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valOf = (f, d) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : argv[i + 1];
};
const DRY_RUN = has('--dry-run');
const FRESH = has('--fresh');
const LIMIT = Number(valOf('--limit', 0)) || 0;

// ── Safety rails ──────────────────────────────────────────────────────────────

function assertSafe() {
  if (!DRY_RUN) {
    console.error('Refusing to run: this build supports --dry-run only.');
    console.error('Usage: node import-anking.js --dry-run [--fresh] [--limit N]');
    process.exit(2);
  }
  const col = path.resolve(cfg.PATHS.collection);
  if (/[\\/]AppData[\\/]Roaming[\\/]Anki2[\\/]/i.test(col)) {
    console.error('Refusing to open the live Anki profile: ' + col);
    console.error('Point PATHS.collection at a COPY of collection.anki2.');
    process.exit(2);
  }
  if (!fs.existsSync(col)) {
    console.error('Collection not found: ' + col);
    process.exit(2);
  }
  if (!fs.existsSync(cfg.PATHS.media)) {
    console.warn('WARNING: media folder not found, every reference will be reported unresolved:');
    console.warn('  ' + cfg.PATHS.media);
  }
}

// ── Output stream with byte accounting ────────────────────────────────────────

class Appender {
  constructor(file) {
    this.file = file;
    this.buf = [];
  }
  write(obj) {
    this.buf.push(JSON.stringify(obj));
  }
  flush() {
    if (this.buf.length) {
      fs.appendFileSync(this.file, this.buf.join('\n') + '\n');
      this.buf = [];
    }
    return fs.existsSync(this.file) ? fs.statSync(this.file).size : 0;
  }
}

// ── Collection loading (Anki schema 18) ───────────────────────────────────────
// col.models / col.decks are empty in schema 18 — the real data lives in the
// notetypes/fields/decks tables. Those carry a `unicase` collation sql.js does
// not implement, so every query against them uses NOT INDEXED to force a scan.

async function loadCollection() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(cfg.PATHS.collection));
  const q = (sql) => {
    const r = db.exec(sql);
    return r[0] ? r[0].values : [];
  };

  const ver = q('SELECT ver FROM col')[0][0];
  if (ver !== 18) {
    console.warn(`WARNING: expected collection schema 18, found ${ver}. Field/deck lookups may differ.`);
  }

  const notetypes = new Map();
  for (const [id, name] of q('SELECT id, name FROM notetypes NOT INDEXED')) {
    notetypes.set(Number(id), String(name));
  }

  const decks = new Map();
  for (const [id, name] of q('SELECT id, name FROM decks NOT INDEXED')) {
    decks.set(Number(id), String(name).replace(/\x1f/g, '::'));
  }

  // A note can own cards in more than one deck; keep the full set so the report
  // can flag those rather than silently picking one.
  const noteDecks = new Map();
  for (const [nid, did] of q('SELECT nid, did FROM cards')) {
    const k = Number(nid);
    if (!noteDecks.has(k)) noteDecks.set(k, new Set());
    noteDecks.get(k).add(Number(did));
  }

  const notes = q('SELECT id, mid, flds, tags FROM notes');
  return { db, notes, notetypes, decks, noteDecks };
}

// ── Media index (read-only stat of the media folder) ──────────────────────────

function buildMediaIndex() {
  const idx = new Map(); // lowercased filename -> { name, size }
  if (!fs.existsSync(cfg.PATHS.media)) return idx;
  for (const name of fs.readdirSync(cfg.PATHS.media)) {
    try {
      const st = fs.statSync(path.join(cfg.PATHS.media, name));
      if (st.isFile()) idx.set(name.toLowerCase(), { name, size: st.size });
    } catch (_) {
      /* unreadable entry — treated as absent */
    }
  }
  return idx;
}

// ── Classification ────────────────────────────────────────────────────────────

/**
 * difficulty_source is exactly 'tag' | 'default' — 'tag' iff the note carried a
 * real ^HighYield tag, 'default' iff it fell through to DEFAULT_DIFFICULTY.
 * A note tagged with several yield levels still counts as 'tag'; the levels are
 * kept in `yields` for audit and the highest yield (lowest number) wins.
 */
function resolveDifficulty(tags) {
  const found = new Set();
  for (const t of tags) {
    if (!t.startsWith('Step1::^Other::^HighYield::')) continue;
    const v = t.split('::')[3];
    if (v && cfg.YIELD_TO_DIFFICULTY[v] !== undefined) found.add(v);
  }
  if (found.size === 0) {
    return { difficulty: cfg.DEFAULT_DIFFICULTY, source: 'default', yields: [], multi: false };
  }
  const yields = [...found];
  const best = yields.slice().sort((a, b) => cfg.YIELD_TO_DIFFICULTY[a] - cfg.YIELD_TO_DIFFICULTY[b])[0];
  return { difficulty: cfg.YIELD_TO_DIFFICULTY[best], source: 'tag', yields, multi: yields.length > 1 };
}

function resolveSubject(tags, deckPaths) {
  // Primary: Step1::^Systems::<System>
  const systemHits = new Map(); // system -> tag count
  const unknownSystems = new Set();
  for (const t of tags) {
    if (!t.startsWith('Step1::^Systems::')) continue;
    const sys = t.split('::')[2];
    if (!sys) continue;
    if (cfg.SYSTEM_TO_SUBJECT[sys] === undefined) {
      unknownSystems.add(sys);
      continue;
    }
    systemHits.set(sys, (systemHits.get(sys) || 0) + 1);
  }

  const deckRoots = [...new Set(deckPaths.map((d) => d.split('::')[0]))];
  const deckSubjects = [
    ...new Set(deckRoots.map((r) => cfg.DECK_ROOT_TO_SUBJECT[r]).filter(Boolean)),
  ];

  if (systemHits.size > 0) {
    const subjects = new Map(); // subject -> weight
    for (const [sys, n] of systemHits) {
      const s = cfg.SYSTEM_TO_SUBJECT[sys];
      subjects.set(s, (subjects.get(s) || 0) + n);
    }
    if (subjects.size === 1) {
      return { subject: [...subjects.keys()][0], source: 'systems_tag', systems: [...systemHits.keys()], unknownSystems: [...unknownSystems] };
    }
    // More than one system on the note. Take the most-tagged; break a tie with
    // the deck fallback if it agrees, else alphabetically (deterministic).
    const ranked = [...subjects].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const topWeight = ranked[0][1];
    const tied = ranked.filter(([, w]) => w === topWeight).map(([s]) => s);
    let chosen = tied[0];
    let how = tied.length > 1 ? 'multi_system_tie_alphabetical' : 'multi_system_weighted';
    if (tied.length > 1) {
      const agree = tied.find((s) => deckSubjects.includes(s));
      if (agree) {
        chosen = agree;
        how = 'multi_system_tie_broken_by_deck';
      }
    }
    return {
      subject: chosen,
      source: how,
      systems: [...systemHits.keys()],
      candidates: ranked.map(([s, w]) => `${s}:${w}`),
      unknownSystems: [...unknownSystems],
    };
  }

  // Fallback: deck top-level name.
  if (deckSubjects.length === 1) {
    return { subject: deckSubjects[0], source: 'deck_fallback', deckRoots, unknownSystems: [...unknownSystems] };
  }
  if (deckSubjects.length > 1) {
    return {
      subject: null,
      source: 'unmapped_deck_conflict',
      deckRoots,
      candidates: deckSubjects,
      unknownSystems: [...unknownSystems],
    };
  }
  return {
    subject: null,
    source: unknownSystems.size ? 'unmapped_unknown_system' : 'unmapped_no_signal',
    deckRoots,
    unknownSystems: [...unknownSystems],
  };
}

// ── Per-note processing ───────────────────────────────────────────────────────

function processNote(note, ctxData, sinks) {
  const { id, mid, flds, tags: rawTags } = note;
  const { notetypes, decks, noteDecks, mediaIndex, mediaSeen } = ctxData;
  const ctx = { note_id: id };
  const issues = [];

  const notetypeName = notetypes.get(mid) || `mid:${mid}`;

  // Exclusion 1 — note type not in scope.
  if (!cfg.INCLUDED_MID.has(mid)) {
    sinks.notes.write({ id, status: 'excluded', reason: 'notetype_out_of_scope', notetype: notetypeName });
    return { cards: 0, issues };
  }

  const tags = P.splitTags(rawTags);

  // Exclusion 2 — explicit delete flag.
  if (cfg.EXCLUDE_TAGS.some((x) => tags.includes(x))) {
    sinks.notes.write({ id, status: 'excluded', reason: 'delete_tag', notetype: notetypeName });
    return { cards: 0, issues };
  }

  const deckPaths = [...(noteDecks.get(id) || new Set())].map((d) => decks.get(d) || '(unknown deck)');
  if (!deckPaths.length) {
    issues.push({ kind: 'note_without_cards', ...ctx });
    deckPaths.push('(no cards)');
  }

  const subj = resolveSubject(tags, deckPaths);
  const diff = resolveDifficulty(tags);
  const cleanTags = [...new Set(tags.map(P.stripProvenance).filter(Boolean))];

  const spec = mid === cfg.NOTETYPES.ANKING_OVERHAUL.id
    ? cfg.NOTETYPES.ANKING_OVERHAUL
    : cfg.NOTETYPES.BASIC_A40BE;
  const fields = String(flds).split('\x1f');

  // Media — from IN-SCOPE fields only.
  const includedOrdinals = Object.values(spec.includeFields);
  const mediaRefs = [];
  for (const ord of includedOrdinals) {
    for (const ref of P.extractMedia(fields[ord] || '', issues, ctx)) mediaRefs.push(ref);
  }
  const media = [];
  for (const ref of mediaRefs) {
    const hit = ref.filename ? mediaIndex.get(ref.filename.toLowerCase()) : undefined;
    const rec = {
      type: ref.type,
      raw: ref.raw,
      filename: ref.filename,
      resolved: !!hit,
      diskName: hit ? hit.name : null,
      size: hit ? hit.size : 0,
      wasLocalServer: ref.wasLocalServer,
      isRemote: ref.isRemote,
    };
    media.push(rec);
    const key = ref.filename.toLowerCase();
    if (!mediaSeen.has(key)) {
      mediaSeen.set(key, { filename: ref.filename, type: ref.type, resolved: !!hit, size: hit ? hit.size : 0, refs: 0, sampleRaw: ref.raw, wasLocalServer: ref.wasLocalServer, isRemote: ref.isRemote });
    }
    mediaSeen.get(key).refs++;
  }

  const base = {
    note_id: id,
    notetype: notetypeName,
    deck_paths: deckPaths,
    subject: subj.subject,
    subject_source: subj.source,
    difficulty: diff.difficulty,
    difficulty_source: diff.source, // 'tag' | 'default'
    difficulty_yields: diff.yields,
    tags: cleanTags,
    media_count: media.length,
    media_unresolved: media.filter((m) => !m.resolved).length,
  };

  // Raw, unmodified source fields for anking_notes (AnKingOverhaul: Text/Extra,
  // Basic-a40be: Front/Back). Never sanitised, never cloze-rendered. Kept OUT of
  // `base` so they are not duplicated onto every generated card.
  const rawFields = {
    raw_text: fields[includedOrdinals[0]] || '',
    raw_extra: fields[includedOrdinals[1]] || '',
  };

  let cardsMade = 0;

  if (spec.kind === 'cloze') {
    const text = fields[spec.includeFields.question] || '';
    const extra = fields[spec.includeFields.extra] || '';
    P.inspectCloze(text, issues, ctx);

    // Sanitise ONCE, then render cloze from the sanitised text. Doing it in this
    // order keeps the generated <span class="cloze-blank"> out of the sanitiser
    // (which would unwrap it as a non-allow-listed tag) and avoids re-parsing
    // the field for every ordinal.
    const textSan = P.sanitizeHtml(text, issues, ctx);
    const ordinals = P.clozeOrdinals(textSan);
    const rawOrdinals = P.clozeOrdinals(text);
    if (rawOrdinals.length !== ordinals.length) {
      issues.push({ kind: 'cloze_lost_in_sanitize', ...ctx, raw: rawOrdinals, after: ordinals, sample: text.slice(0, 300) });
    }

    if (!ordinals.length) {
      issues.push({ kind: 'cloze_note_without_cloze_markup', ...ctx, sample: text.slice(0, 300) });
      sinks.notes.write({ ...base, ...rawFields, status: 'included_no_cards', reason: 'no_cloze_ordinals', cards: 0 });
      return { cards: 0, issues, subj, diff, media };
    }

    const answerHtml = P.renderCloze(textSan, null);
    const extraHtml = P.sanitizeHtml(extra, issues, ctx);
    for (const ord of ordinals) {
      sinks.cards.write({
        ...base,
        card_kind: 'cloze',
        cloze_ordinal: ord,
        cloze_ordinals_in_note: ordinals,
        question_html: P.renderCloze(textSan, ord),
        answer_html: answerHtml,
        extra_html: extraHtml,
        media,
      });
      cardsMade++;
    }
    sinks.notes.write({ ...base, ...rawFields, status: 'included', cards: cardsMade, kind: 'cloze' });
    return { cards: cardsMade, issues, subj, diff, media };
  }

  // MCQ
  const front = fields[spec.includeFields.front] || '';
  const back = fields[spec.includeFields.back] || '';
  const res = P.parseMcq(front, back, issues, ctx);
  if (!res.ok) {
    // RESCUE: a note that isn't a clean MCQ is still a real flashcard. Keep it
    // verbatim as card_type 'basic' — sanitised Front/Back, no options, no
    // correct letter, no cloze ordinal. Nothing from Basic-a40be is dropped.
    sinks.cards.write({
      ...base,
      card_kind: 'basic',
      basic_rescue_reason: res.reason,
      question_html: P.sanitizeHtml(front, issues, ctx),
      answer_html: P.sanitizeHtml(back, issues, ctx),
      extra_html: '',
      media,
    });
    sinks.notes.write({
      ...base,
      ...rawFields,
      status: 'included',
      kind: 'basic',
      cards: 1,
      basic_rescue_reason: res.reason,
      mcq_detail: res.detail || null,
      front_sample: front.slice(0, 400),
      back_sample: back.slice(0, 400),
    });
    return { cards: 1, issues, subj, diff, media, mcqFail: res.reason };
  }

  sinks.cards.write({
    ...base,
    card_kind: 'mcq',
    question_html: P.sanitizeHtml(front, issues, ctx),
    mcq_stem: res.stem,
    mcq_options: res.options,
    mcq_correct_letter: res.correct,
    answer_html: P.sanitizeHtml(back, issues, ctx),
    extra_html: '',
    media,
  });
  sinks.notes.write({ ...base, ...rawFields, status: 'included', cards: 1, kind: 'mcq' });
  return { cards: 1, issues, subj, diff, media };
}

// ── Aggregation + report ──────────────────────────────────────────────────────

async function eachLine(file, fn) {
  if (!fs.existsSync(file)) return;
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      fn(JSON.parse(line));
    } catch (_) {
      /* skip a torn line rather than abort the report */
    }
  }
}

const bump = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
const pushSample = (arr, v) => {
  if (arr.length < MAX_SAMPLES) arr.push(v);
};
const trunc = (s, n = 220) => {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ');
  return t.length > n ? t.slice(0, n) + ' …' : t;
};
const mb = (b) => (b / 1024 / 1024).toFixed(1);
const table = (rows, headers) => {
  const out = ['| ' + headers.join(' | ') + ' |', '|' + headers.map(() => '---').join('|') + '|'];
  for (const r of rows) out.push('| ' + r.join(' | ') + ' |');
  return out.join('\n');
};

async function buildReport(meta, mediaSeen) {
  const A = {
    notesTotal: 0,
    excluded: new Map(),
    excludedByNotetype: new Map(),
    included: 0,
    includedNoCards: 0,
    cards: 0,
    cardsByKind: new Map(),
    subject: new Map(),
    subjectSource: new Map(),
    unmapped: 0,
    unmappedSamples: [],
    multiSubjectSamples: [],
    difficulty: new Map(),
    difficultySource: new Map(),
    mcqOk: 0,
    mcqFail: new Map(),
    mcqFailSamples: [],
    clozeOrdinalHist: new Map(),
    deckSpanSamples: [],
    unknownSystems: new Map(),
  };

  await eachLine(FILES.notes, (n) => {
    A.notesTotal++;
    if (n.status === 'excluded') {
      bump(A.excluded, n.reason);
      if (n.reason === 'notetype_out_of_scope') bump(A.excludedByNotetype, n.notetype);
      return;
    }
    if (n.status === 'included') A.included++;
    if (n.status === 'included_no_cards') A.includedNoCards++;
    if (n.kind === 'mcq' && n.status === 'included') A.mcqOk++;
    if (n.kind === 'basic' && n.status === 'included') {
      // Rescued Basic-a40be notes: kept as card_type 'basic', not dropped.
      bump(A.mcqFail, n.basic_rescue_reason);
      pushSample(A.mcqFailSamples, {
        id: n.note_id,
        reason: n.basic_rescue_reason,
        detail: n.mcq_detail,
        front: trunc(n.front_sample, 300),
        back: trunc(n.back_sample, 240),
      });
    }

    const subj = n.subject || '(unmapped)';
    bump(A.subject, subj);
    bump(A.subjectSource, n.subject_source);
    if (!n.subject) {
      A.unmapped++;
      pushSample(A.unmappedSamples, {
        id: n.note_id,
        source: n.subject_source,
        decks: (n.deck_paths || []).join(' , '),
        tags: trunc((n.tags || []).slice(0, 6).join(' '), 260),
      });
    }
    if (String(n.subject_source).startsWith('multi_system')) {
      pushSample(A.multiSubjectSamples, { id: n.note_id, chosen: n.subject, source: n.subject_source, decks: (n.deck_paths || []).join(' , ') });
    }
    if ((n.deck_paths || []).length > 1) {
      pushSample(A.deckSpanSamples, { id: n.note_id, decks: n.deck_paths.join(' , ') });
    }
    bump(A.difficulty, String(n.difficulty));
    bump(A.difficultySource, n.difficulty_source);
  });

  await eachLine(FILES.cards, (c) => {
    A.cards++;
    bump(A.cardsByKind, c.card_kind);
    if (c.card_kind === 'cloze') bump(A.clozeOrdinalHist, String((c.cloze_ordinals_in_note || []).length));
  });

  const issueKinds = new Map();
  const issueSamples = new Map();
  await eachLine(FILES.issues, (i) => {
    bump(issueKinds, i.kind);
    if (!issueSamples.has(i.kind)) issueSamples.set(i.kind, []);
    pushSample(issueSamples.get(i.kind), i);
  });

  // Media rollup
  let mResolved = 0, mUnresolved = 0, mBytes = 0, mRefsTotal = 0;
  const unresolvedSamples = [];
  const localServerSamples = [];
  const byType = new Map();
  const byExt = new Map();
  for (const rec of mediaSeen.values()) {
    mRefsTotal += rec.refs;
    bump(byType, rec.type);
    const ext = (rec.filename.split('.').pop() || '(none)').toLowerCase();
    bump(byExt, ext);
    if (rec.resolved) {
      mResolved++;
      mBytes += rec.size;
    } else {
      mUnresolved++;
      pushSample(unresolvedSamples, rec);
    }
    if (rec.wasLocalServer) pushSample(localServerSamples, rec);
  }

  const L = [];
  const h = (s) => L.push('\n## ' + s + '\n');

  L.push('# AnKing import — DRY RUN report');
  L.push('');
  L.push('**No database writes. No media uploads. No changes to the Anki collection.**');
  L.push('');
  L.push(table([
    ['Generated', new Date().toISOString()],
    ['Collection', '`' + cfg.PATHS.collection + '`'],
    ['Media folder', '`' + cfg.PATHS.media + '` (read-only stat)'],
    ['Run mode', meta.resumed ? `resumed from note ${meta.resumedFrom}` : 'full run'],
    ['Wall time', meta.seconds + ' s'],
    ['Note-type scope', Object.values(cfg.NOTETYPES).map((n) => n.name).join(', ')],
    ['Fields parsed', 'AnKingOverhaul: Text, Extra · Basic-a40be: Front, Back'],
    ['Fields dropped', 'First Aid, Sketchy, Additional Resources (and all media they reference)'],
  ], ['', '']));

  // 1. Notes
  h('1. Notes processed');
  const totalExcluded = [...A.excluded.values()].reduce((a, b) => a + b, 0);
  L.push(table([
    ['Total notes in collection', A.notesTotal],
    ['Excluded', totalExcluded],
    ['**Included (produced ≥1 card)**', '**' + A.included + '**'],
    ['Included but produced 0 cards', A.includedNoCards],
  ], ['', 'Notes']));
  L.push('\n**Exclusions by reason**\n');
  L.push(table([...A.excluded].sort((a, b) => b[1] - a[1]).map(([k, v]) => ['`' + k + '`', v]), ['Reason', 'Notes']));
  L.push('\n**Out-of-scope note types**\n');
  L.push(table([...A.excludedByNotetype].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]), ['Note type', 'Notes']));

  // 2. Cards
  h('2. Cards that would be generated');
  L.push(table([
    ['**TOTAL**', '**' + A.cards + '**'],
    ...[...A.cardsByKind].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
  ], ['Card kind', 'Cards']));
  L.push('\n**Cloze cards per note** (distinct ordinals — one card each)\n');
  L.push(table(
    [...A.clozeOrdinalHist].sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => [k, Number(v) / Number(k), v]),
    ['Ordinals in note', 'Notes', 'Cards']
  ));

  // 3. Subjects
  h('3. Subject mapping');
  L.push(table(
    [...A.subject].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k === '(unmapped)' ? '**(unmapped)**' : '`' + k + '`', v]),
    ['Subject id', 'Notes']
  ));
  L.push('\n**How each subject was resolved**\n');
  L.push(table([...A.subjectSource].sort((a, b) => b[1] - a[1]).map(([k, v]) => ['`' + k + '`', v]), ['Source', 'Notes']));
  L.push(`\n**Unmapped bucket: ${A.unmapped} notes** — not assigned to any subject.\n`);
  if (A.unmappedSamples.length) {
    L.push(table(
      A.unmappedSamples.map((s) => [s.id, '`' + s.source + '`', trunc(s.decks, 90), trunc(s.tags, 160)]),
      ['note id', 'reason', 'deck path(s)', 'tags (first 6, provenance stripped)']
    ));
  } else {
    L.push('_None._');
  }
  if (A.multiSubjectSamples.length) {
    L.push('\n**Notes tagged with more than one system** (resolved, not dropped — audit these)\n');
    L.push(table(
      A.multiSubjectSamples.map((s) => [s.id, '`' + s.chosen + '`', '`' + s.source + '`', trunc(s.decks, 80)]),
      ['note id', 'chosen', 'rule', 'deck path(s)']
    ));
  }

  // 4. Difficulty
  h('4. Difficulty mapping');
  L.push(table(
    [...A.difficulty].sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => [k, v]),
    ['Difficulty', 'Notes']
  ));
  L.push('\n**Source**\n');
  L.push(table([...A.difficultySource].sort((a, b) => b[1] - a[1]).map(([k, v]) => ['`' + k + '`', v]), ['Source', 'Notes']));

  // 5. MCQ
  h('5. Basic-a40be routing (MCQ vs rescued basic)');
  const rescued = [...A.mcqFail.values()].reduce((a, b) => a + b, 0);
  const mcqTotal = A.mcqOk + rescued;
  L.push(table([
    ['In scope', mcqTotal],
    ['**Parsed as `mcq`**', '**' + A.mcqOk + '**'],
    ['**Rescued as `basic`**', '**' + rescued + '**'],
    ['Dropped', 0],
  ], ['', 'Notes']));
  if (A.mcqFail.size) {
    L.push('\n**Why each note was routed to `basic` rather than `mcq`**\n');
    L.push(table([...A.mcqFail].sort((a, b) => b[1] - a[1]).map(([k, v]) => ['`' + k + '`', v]), ['Reason', 'Notes']));
    L.push('\n**Samples (raw field content — kept verbatim as `basic`)**\n');
    for (const s of A.mcqFailSamples) {
      L.push(`- **note ${s.id}** — \`${s.reason}\`${s.detail ? ' ' + JSON.stringify(s.detail) : ''}`);
      L.push('  - Front: `' + s.front + '`');
      L.push('  - Back: `' + s.back + '`');
    }
  }

  // 6. Media
  h('6. Media resolution (in-scope fields only)');
  L.push(table([
    ['Total references', mRefsTotal],
    ['Distinct files referenced', mResolved + mUnresolved],
    ['**Resolved on disk**', '**' + mResolved + '**'],
    ['**Unresolved**', '**' + mUnresolved + '**'],
    ['Size of resolving set', mb(mBytes) + ' MB'],
  ], ['', '']));
  L.push('\n**By type**\n');
  L.push(table([...byType].sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]), ['Type', 'Distinct files']));
  L.push('\n**By extension**\n');
  L.push(table([...byExt].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => ['`' + k + '`', v]), ['Ext', 'Distinct files']));
  L.push('\n**Unresolved samples**\n');
  L.push(unresolvedSamples.length
    ? table(unresolvedSamples.map((s) => ['`' + trunc(s.filename, 70) + '`', s.type, s.refs, '`' + trunc(s.sampleRaw, 90) + '`']), ['filename', 'type', 'refs', 'raw src'])
    : '_All references resolved._');
  if (localServerSamples.length) {
    L.push(`\n**Refs that carried a \`http://127.0.0.1:PORT/\` prefix** (stripped before lookup): ${localServerSamples.length}+ distinct\n`);
    L.push(table(localServerSamples.map((s) => ['`' + trunc(s.sampleRaw, 90) + '`', s.resolved ? 'resolved' : 'UNRESOLVED']), ['raw src', 'after strip']));
  }

  // 7. Issues
  h('7. HTML / parsing edge cases');
  if (!issueKinds.size) {
    L.push('_None recorded._');
  } else {
    L.push(table([...issueKinds].sort((a, b) => b[1] - a[1]).map(([k, v]) => ['`' + k + '`', v]), ['Kind', 'Occurrences']));
    L.push('\n**Samples**\n');
    for (const [kind, arr] of issueSamples) {
      L.push(`- \`${kind}\``);
      for (const s of arr.slice(0, 4)) {
        L.push(`  - note ${s.note_id}: ${trunc(s.sample || s.message || JSON.stringify(s), 220)}`);
      }
    }
  }

  h('8. Decisions baked into this run');
  L.push([
    '- `<img>` is **kept** in sanitised output (with `src`/`alt` only). The brief\'s keep-list omitted it; see `KEEP_IMG` in `config.js` to follow that list literally.',
    '- `class`, `style`, and all `on*` handlers are stripped everywhere — this removes AnKing\'s `class="resizer"` and inline `width` sizing.',
    '- `question_html`/`answer_html` are sanitised with the same rules as `extra_html`, not just `extra_html`.',
    '- The blanked cloze renders as `<span class="cloze-blank">[hint or ...]</span>`; other ordinals are replaced by their bare answer text, matching Anki.',
    '- Subject ids `microbiology` and `pharmacology` come **only** from the deck fallback — they are not in the `^Systems` mapping. Confirm they exist in MedVale before the live import.',
    '- `Public Health - Anking` is mapped to `biostatistics`; that deck also holds Ethics, Healthcare Delivery and The Well Patient. Confirm or split.',
    '- Contributor markers `BGadds`/`JBadds`/`AKadds` are stripped from tag segments and never affect subject or difficulty.',
    '- Notes tagged with multiple systems are resolved by tag weight (tie → deck agreement → alphabetical), never dropped.',
  ].join('\n'));

  h('9. Artefacts');
  L.push(table([
    ['`out/dry-run-report.md`', 'this file'],
    ['`out/notes.ndjson`', 'one record per note incl. exclusion reason'],
    ['`out/cards.ndjson`', 'every generated card with full rendered HTML — the payload a live import would write'],
    ['`out/issues.ndjson`', 'every parsing edge case'],
    ['`out/state.json`', 'resume checkpoint'],
  ], ['File', 'Contents']));

  fs.writeFileSync(FILES.report, L.join('\n') + '\n');
  return { A, media: { mResolved, mUnresolved, mBytes, mRefsTotal } };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  assertSafe();
  fs.mkdirSync(OUT, { recursive: true });

  let state = { lastNoteId: 0, notesBytes: 0, cardsBytes: 0, issuesBytes: 0, processed: 0 };
  if (!FRESH && fs.existsSync(FILES.state)) {
    try {
      state = JSON.parse(fs.readFileSync(FILES.state, 'utf8'));
    } catch (_) {
      state = { lastNoteId: 0, notesBytes: 0, cardsBytes: 0, issuesBytes: 0, processed: 0 };
    }
  }
  const resumed = !FRESH && state.lastNoteId > 0;

  // Truncate to the last good checkpoint (drops any torn line) or start clean.
  for (const [file, len] of [[FILES.notes, state.notesBytes], [FILES.cards, state.cardsBytes], [FILES.issues, state.issuesBytes]]) {
    if (resumed && fs.existsSync(file)) fs.truncateSync(file, len);
    else fs.writeFileSync(file, '');
  }
  if (!resumed) state = { lastNoteId: 0, notesBytes: 0, cardsBytes: 0, issuesBytes: 0, processed: 0 };

  const t0 = Date.now();
  console.log('Loading collection …');
  const { db, notes, notetypes, decks, noteDecks } = await loadCollection();
  console.log(`  ${notes.length} notes, ${notetypes.size} note types, ${decks.size} decks`);
  console.log('Indexing media folder …');
  const mediaIndex = buildMediaIndex();
  console.log(`  ${mediaIndex.size} files on disk`);

  const sinks = {
    notes: new Appender(FILES.notes),
    cards: new Appender(FILES.cards),
    issues: new Appender(FILES.issues),
  };
  const mediaSeen = new Map();
  const ctxData = { notetypes, decks, noteDecks, mediaIndex, mediaSeen };

  const rows = notes
    .map((r) => ({ id: Number(r[0]), mid: Number(r[1]), flds: r[2], tags: r[3] }))
    .sort((a, b) => a.id - b.id)
    .filter((r) => r.id > state.lastNoteId);
  const work = LIMIT ? rows.slice(0, LIMIT) : rows;

  if (resumed) console.log(`Resuming after note ${state.lastNoteId} — ${work.length} remaining`);

  let n = 0;
  for (const row of work) {
    const { issues } = processNote(row, ctxData, sinks);
    for (const i of issues) sinks.issues.write(i);
    n++;
    state.lastNoteId = row.id;
    state.processed++;
    if (n % CHECKPOINT_EVERY === 0) {
      state.notesBytes = sinks.notes.flush();
      state.cardsBytes = sinks.cards.flush();
      state.issuesBytes = sinks.issues.flush();
      fs.writeFileSync(FILES.state, JSON.stringify(state, null, 2));
      process.stdout.write(`\r  processed ${state.processed}/${notes.length}`);
    }
  }
  state.notesBytes = sinks.notes.flush();
  state.cardsBytes = sinks.cards.flush();
  state.issuesBytes = sinks.issues.flush();
  fs.writeFileSync(FILES.state, JSON.stringify(state, null, 2));
  process.stdout.write(`\r  processed ${state.processed}/${notes.length}\n`);
  db.close();

  // Always rebuild the media rollup from cards.ndjson rather than the in-memory
  // tally. Two reasons: a resumed run's in-memory map only covers the tail, and
  // the number that matters is "media the import would actually have to upload",
  // i.e. media reachable from a generated card — notes that yield no cards
  // (unparseable MCQs, cloze notes with no markup) must not inflate it.
  {
    mediaSeen.clear();
    await eachLine(FILES.cards, (c) => {
      for (const m of c.media || []) {
        const k = m.filename.toLowerCase();
        if (!mediaSeen.has(k)) {
          mediaSeen.set(k, { filename: m.filename, type: m.type, resolved: m.resolved, size: m.size, refs: 0, sampleRaw: m.raw, wasLocalServer: m.wasLocalServer, isRemote: m.isRemote });
        }
        mediaSeen.get(k).refs++;
      }
    });
  }

  console.log('Aggregating report …');
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);
  const { A, media } = await buildReport({ resumed, resumedFrom: resumed ? state.lastNoteId : 0, seconds }, mediaSeen);

  console.log('\n─── DRY RUN COMPLETE (nothing was written to any database) ───');
  console.log(`notes: ${A.notesTotal} total · ${A.included} included · ${A.includedNoCards} included-but-0-cards`);
  console.log(`cards: ${A.cards} (${[...A.cardsByKind].map(([k, v]) => `${k} ${v}`).join(', ')})`);
  console.log(`subjects: ${A.subject.size - (A.unmapped ? 1 : 0)} mapped · ${A.unmapped} notes unmapped`);
  console.log(`mcq: ${A.mcqOk} parsed · ${[...A.mcqFail.values()].reduce((a, b) => a + b, 0)} unparseable`);
  console.log(`media: ${media.mResolved} resolved / ${media.mResolved + media.mUnresolved} distinct · ${mb(media.mBytes)} MB · ${media.mUnresolved} unresolved`);
  console.log(`\nreport: ${FILES.report}`);
}

main().catch((e) => {
  console.error('\nFATAL', e);
  process.exit(1);
});
