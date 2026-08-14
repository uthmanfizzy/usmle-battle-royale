#!/usr/bin/env node
'use strict';
/**
 * AnKing -> Supabase LIVE importer. Consumes out/cards.ndjson + out/notes.ndjson
 * produced by import-anking.js --dry-run.
 *
 *   node import-live.js --plan        # local only, no network. Derives every
 *                                     # storage key, sniffs every content type,
 *                                     # checks for key collisions, sizes the upload.
 *   node import-live.js --preflight   # network, READ-ONLY. Verifies credentials,
 *                                     # table columns and bucket. Writes nothing.
 *   node import-live.js --live        # the real import. Requires a clean preflight.
 *
 * Credentials come from the environment (never committed):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotency: media keys are a pure function of the source filename and upload
 * uses upsert; rows use upsert on the natural keys in config.LIVE.conflictTargets.
 * Progress is checkpointed to out/live-state.json plus append-only logs, so an
 * interrupted run resumes without duplicating rows or re-uploading blobs.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const cfg = require('./config');
const { storageKey, sniffContentType, mediaTypeOf } = require('./storage');

const OUT = cfg.PATHS.outDir;
const F = {
  cards: path.join(OUT, 'cards.ndjson'),
  notes: path.join(OUT, 'notes.ndjson'),
  plan: path.join(OUT, 'upload-plan.md'),
  mediaPlan: path.join(OUT, 'media-plan.ndjson'),
  uploaded: path.join(OUT, 'uploaded.ndjson'),
  liveState: path.join(OUT, 'live-state.json'),
  liveReport: path.join(OUT, 'live-import-report.md'),
};

const argv = process.argv.slice(2);
const MODE = argv.includes('--live') ? 'live' : argv.includes('--preflight') ? 'preflight' : 'plan';
// NB: indexOf returns -1 when the flag is absent, so argv[-1+1] is argv[0].
// Guard explicitly — a NaN here spawns zero upload workers and silently
// completes having transferred nothing.
const CONCURRENCY = (() => {
  const i = argv.indexOf('--concurrency');
  const n = i === -1 ? NaN : Number(argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 8;
})();
const ROW_BATCH = 500;

// --only media,notes,cards  restricts which phases run (default: all).
// --redo                    resets the selected phases' checkpoints first, so a
//                           completed phase can be deliberately rewritten
//                           without disturbing the others.
const ONLY = (() => {
  const i = argv.indexOf('--only');
  if (i === -1) return new Set(['media', 'notes', 'cards']);
  return new Set(String(argv[i + 1] || '').split(',').map((s) => s.trim()).filter(Boolean));
})();
const REDO = argv.includes('--redo');
const wants = (phase) => ONLY.has(phase);

const mb = (b) => (b / 1024 / 1024).toFixed(1);

async function eachLine(file, fn) {
  if (!fs.existsSync(file)) throw new Error(`missing ${file} — run import-anking.js --dry-run first`);
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.trim()) fn(JSON.parse(line));
  }
}

// ── Phase A: build the upload plan (pure local) ───────────────────────────────

async function buildPlan() {
  const media = new Map(); // original filename -> record
  let cards = 0;
  const byType = new Map();

  await eachLine(F.cards, (c) => {
    cards++;
    byType.set(c.card_kind, (byType.get(c.card_kind) || 0) + 1);
    for (const m of c.media || []) {
      if (!m.resolved) continue; // unresolved refs are never uploaded
      if (media.has(m.filename)) {
        media.get(m.filename).refs++;
        continue;
      }
      media.set(m.filename, { filename: m.filename, diskName: m.diskName, size: m.size, refs: 1 });
    }
  });

  // Derive keys + sniff types by reading each file's header.
  const keys = new Map(); // key -> filename (collision detector)
  const collisions = [];
  const typeCount = new Map();
  let bytes = 0;
  let unreadable = 0;
  const unreadableSamples = [];

  const out = fs.createWriteStream(F.mediaPlan);
  for (const rec of media.values()) {
    const key = storageKey(rec.filename);
    if (keys.has(key) && keys.get(key) !== rec.filename) {
      collisions.push({ key, a: keys.get(key), b: rec.filename });
    }
    keys.set(key, rec.filename);

    let contentType = 'application/octet-stream';
    try {
      const fd = fs.openSync(path.join(cfg.PATHS.media, rec.diskName), 'r');
      const head = Buffer.alloc(512);
      fs.readSync(fd, head, 0, 512, 0);
      fs.closeSync(fd);
      contentType = sniffContentType(head, rec.filename);
    } catch (e) {
      unreadable++;
      if (unreadableSamples.length < 8) unreadableSamples.push({ f: rec.filename, e: e.message });
    }
    typeCount.set(contentType, (typeCount.get(contentType) || 0) + 1);
    bytes += rec.size;

    out.write(JSON.stringify({
      filename: rec.filename,
      diskName: rec.diskName,
      storage_key: key,
      byte_size: rec.size,
      content_type: contentType,
      media_type: mediaTypeOf(contentType),
      refs: rec.refs,
    }) + '\n');
  }
  await new Promise((r) => out.end(r));

  return { cards, byType, mediaCount: media.size, bytes, typeCount, collisions, unreadable, unreadableSamples };
}

function writePlanReport(p, noteCount) {
  const L = [];
  L.push('# AnKing live import — UPLOAD PLAN (local, nothing sent)\n');
  L.push(`Generated ${new Date().toISOString()}\n`);
  L.push('## Rows that would be written\n');
  L.push('| Table | Rows |');
  L.push('|---|---|');
  L.push(`| \`${cfg.LIVE.tables.notes}\` | ${noteCount} |`);
  L.push(`| \`${cfg.LIVE.tables.cards}\` | ${p.cards} |`);
  for (const [k, v] of [...p.byType].sort((a, b) => b[1] - a[1])) L.push(`| &nbsp;&nbsp;↳ card_type \`${k}\` | ${v} |`);
  L.push(`| \`${cfg.LIVE.tables.media}\` | ${p.mediaCount} |`);
  L.push('\n## Media upload\n');
  L.push('| | |');
  L.push('|---|---|');
  L.push(`| Distinct files | ${p.mediaCount} |`);
  L.push(`| Total bytes | ${mb(p.bytes)} MB |`);
  L.push(`| Bucket | \`${cfg.LIVE.bucket}\` (public: ${cfg.LIVE.bucketPublic}) |`);
  L.push(`| Storage-key collisions | ${p.collisions.length} |`);
  L.push(`| Unreadable source files | ${p.unreadable} |`);
  L.push('\n**Content types (sniffed from magic bytes, not the extension)**\n');
  L.push('| Content-Type | Files |');
  L.push('|---|---|');
  for (const [k, v] of [...p.typeCount].sort((a, b) => b[1] - a[1])) L.push(`| \`${k}\` | ${v} |`);
  if (p.collisions.length) {
    L.push('\n**COLLISIONS — must be resolved before uploading**\n');
    for (const c of p.collisions.slice(0, 20)) L.push(`- \`${c.key}\` ← \`${c.a}\` and \`${c.b}\``);
  }
  if (p.unreadableSamples.length) {
    L.push('\n**Unreadable samples**\n');
    for (const u of p.unreadableSamples) L.push(`- \`${u.f}\`: ${u.e}`);
  }
  fs.writeFileSync(F.plan, L.join('\n') + '\n');
}

// ── Phase B: preflight (network, read-only) ───────────────────────────────────

function credentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('\nMissing credentials. Set both before running --preflight or --live:');
    console.error('  SUPABASE_URL=https://<project>.supabase.co');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=<service role key>');
    process.exit(2);
  }
  return { url, key };
}

/**
 * PostgREST publishes an OpenAPI document at the REST root describing every
 * exposed table and column. Introspecting it means we can prove the target
 * schema matches what we intend to write BEFORE sending a single row, instead
 * of discovering a column mismatch halfway through 27k inserts.
 */
async function introspect(url, key) {
  const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`REST root returned ${res.status} ${res.statusText}`);
  const spec = await res.json();
  const defs = spec.definitions || (spec.components && spec.components.schemas) || {};
  const found = {};
  for (const t of Object.values(cfg.LIVE.tables)) {
    found[t] = defs[t] ? Object.keys(defs[t].properties || {}) : null;
  }
  return found;
}

function diffColumns(found) {
  const problems = [];
  for (const [table, expected] of Object.entries(cfg.LIVE.columns)) {
    const actual = found[table];
    if (!actual) {
      problems.push({ table, kind: 'missing_table' });
      continue;
    }
    const missing = expected.filter((c) => !actual.includes(c));
    if (missing.length) problems.push({ table, kind: 'missing_columns', missing, actual });
  }
  return problems;
}

async function preflight() {
  const { url, key } = credentials();
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log('Introspecting schema …');
  const found = await introspect(url, key);
  for (const [t, cols] of Object.entries(found)) {
    console.log(`  ${t}: ${cols ? cols.length + ' columns — ' + cols.join(', ') : 'NOT FOUND'}`);
  }
  const problems = diffColumns(found);

  console.log('Checking storage bucket …');
  const { data: buckets, error: bErr } = await sb.storage.listBuckets();
  if (bErr) throw new Error('listBuckets failed: ' + bErr.message);
  const bucket = (buckets || []).find((b) => b.name === cfg.LIVE.bucket);
  console.log(`  ${cfg.LIVE.bucket}: ${bucket ? `exists (public: ${bucket.public})` : 'does not exist — would be created'}`);

  if (problems.length) {
    console.error('\nPREFLIGHT FAILED — refusing to write.\n');
    for (const p of problems) {
      if (p.kind === 'missing_table') {
        console.error(`  table "${p.table}" not found (or not exposed to PostgREST)`);
        console.error(`    importer expects columns: ${cfg.LIVE.columns[p.table].join(', ')}`);
      } else {
        console.error(`  table "${p.table}" is missing columns: ${p.missing.join(', ')}`);
        console.error(`    actual columns: ${p.actual.join(', ')}`);
      }
    }
    console.error('\nFix config.LIVE.columns to match the real schema (or alter the tables), then re-run.');
    process.exit(3);
  }
  console.log('\nPREFLIGHT OK — schema matches, safe to run --live.');
  return { sb, bucketExists: !!bucket };
}

// ── Phase C: live import ──────────────────────────────────────────────────────

function loadLiveState() {
  if (fs.existsSync(F.liveState)) {
    try { return JSON.parse(fs.readFileSync(F.liveState, 'utf8')); } catch (_) { /* fall through */ }
  }
  return { mediaDone: false, notesDone: 0, cardsDone: 0, bytesUploaded: 0 };
}
const saveLiveState = (s) => fs.writeFileSync(F.liveState, JSON.stringify(s, null, 2));

/** Filenames already uploaded in a previous run — skipped on resume. */
function alreadyUploaded() {
  const done = new Set();
  if (!fs.existsSync(F.uploaded)) return done;
  for (const line of fs.readFileSync(F.uploaded, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).filename); } catch (_) { /* torn line */ }
  }
  return done;
}

async function uploadMedia(sb, state) {
  const plan = fs.readFileSync(F.mediaPlan, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const done = alreadyUploaded();
  const todo = plan.filter((p) => !done.has(p.filename));
  console.log(`Media: ${plan.length} total, ${done.size} already uploaded, ${todo.length} to go`);

  const log = fs.createWriteStream(F.uploaded, { flags: 'a' });
  let n = 0, bytes = 0, failed = 0;
  const failures = [];

  // Bounded-concurrency worker pool. Buffers are sent as raw binary — never
  // base64 — so a 547 MB corpus does not balloon to ~730 MB on the wire.
  let cursor = 0;
  const worker = async () => {
    while (cursor < todo.length) {
      const item = todo[cursor++];
      try {
        const buf = fs.readFileSync(path.join(cfg.PATHS.media, item.diskName));
        const { error } = await sb.storage.from(cfg.LIVE.bucket).upload(item.storage_key, buf, {
          contentType: item.content_type,
          upsert: true, // makes a retry of a partially-completed run safe
          // storage_key hashes the ORIGINAL FILENAME, not file content (storage.js),
          // so upsert:true can legitimately replace bytes at an unchanged key on a
          // later corrective re-run. A short-ish cache (vs. the other buckets' 1-year)
          // keeps that path from going stale for too long.
          cacheControl: '86400',
        });
        if (error) throw new Error(error.message);
        const { data } = sb.storage.from(cfg.LIVE.bucket).getPublicUrl(item.storage_key);
        log.write(JSON.stringify({ ...item, public_url: data.publicUrl }) + '\n');
        bytes += item.byte_size;
        n++;
        if (n % 100 === 0) {
          state.bytesUploaded = bytes;
          saveLiveState(state);
          process.stdout.write(`\r  uploaded ${n}/${todo.length} (${mb(bytes)} MB)`);
        }
      } catch (e) {
        failed++;
        if (failures.length < 20) failures.push({ filename: item.filename, error: e.message });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await new Promise((r) => log.end(r));
  process.stdout.write(`\r  uploaded ${n}/${todo.length} (${mb(bytes)} MB)\n`);
  if (failed) console.error(`  ${failed} uploads FAILED — re-run to retry them`);
  return { uploaded: n, bytes, failed, failures };
}

async function upsertRows(sb, table, rows, conflict, label, state, stateKey) {
  let done = state[stateKey] || 0;
  if (done >= rows.length) {
    console.log(`${label}: already complete (${done})`);
    return done;
  }
  console.log(`${label}: ${rows.length} rows, resuming at ${done}`);
  for (let i = done; i < rows.length; i += ROW_BATCH) {
    const batch = rows.slice(i, i + ROW_BATCH);
    const { error } = await sb.from(table).upsert(batch, { onConflict: conflict, ignoreDuplicates: false });
    if (error) throw new Error(`${table} upsert failed at row ${i}: ${error.message}`);
    state[stateKey] = Math.min(i + ROW_BATCH, rows.length);
    saveLiveState(state);
    process.stdout.write(`\r  ${label}: ${state[stateKey]}/${rows.length}`);
  }
  process.stdout.write('\n');
  return rows.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  let noteCount = 0;
  await eachLine(F.notes, (n) => { if (n.status === 'included') noteCount++; });

  console.log('Building upload plan (local) …');
  const plan = await buildPlan();
  writePlanReport(plan, noteCount);
  console.log(`  ${plan.cards} cards · ${noteCount} notes · ${plan.mediaCount} media files · ${mb(plan.bytes)} MB`);
  console.log(`  storage-key collisions: ${plan.collisions.length} · unreadable: ${plan.unreadable}`);
  console.log(`  plan written to ${F.plan}`);

  if (plan.collisions.length) {
    console.error('\nRefusing to continue: storage-key collisions detected (see plan).');
    process.exit(4);
  }
  if (MODE === 'plan') {
    console.log('\n--plan mode: nothing was sent. Use --preflight next (needs credentials).');
    return;
  }

  const { sb, bucketExists } = await preflight();
  if (MODE === 'preflight') return;

  // ---- LIVE ----
  const state = loadLiveState();
  if (!bucketExists) {
    console.log(`Creating bucket ${cfg.LIVE.bucket} …`);
    const { error } = await sb.storage.createBucket(cfg.LIVE.bucket, { public: cfg.LIVE.bucketPublic });
    if (error && !/already exists/i.test(error.message)) throw new Error('createBucket: ' + error.message);
  }

  if (REDO) {
    // Reset only the selected phases' counters; the others keep their progress.
    if (wants('media')) state.mediaRowsDone = 0;
    if (wants('notes')) state.notesDone = 0;
    if (wants('cards')) state.cardsDone = 0;
    saveLiveState(state);
    console.log(`--redo: reset checkpoints for [${[...ONLY].join(', ')}]`);
  }

  let up = { uploaded: 0, bytes: 0, failed: 0, failures: [] };
  if (wants('media')) {
    up = await uploadMedia(sb, state);
    state.mediaDone = up.failed === 0;
    saveLiveState(state);
  } else {
    console.log('Skipping media upload (not selected by --only)');
  }

  // anking_media rows come from the upload log, so only genuinely-uploaded
  // files get a mapping row.
  const mediaRows = fs.readFileSync(F.uploaded, 'utf8').trim().split('\n').filter(Boolean)
    .map((l) => JSON.parse(l))
    .map((m) => ({
      filename: m.filename,
      storage_key: m.storage_key,
      public_url: m.public_url,
      byte_size: m.byte_size,
      content_type: m.content_type,
      media_type: m.media_type,
    }));

  const noteRows = [];
  await eachLine(F.notes, (n) => {
    if (n.status !== 'included') return;
    noteRows.push({
      anki_note_id: Number(n.note_id), // bigint column
      notetype: n.notetype,
      deck_path: (n.deck_paths || []).join(' | '),
      subject: n.subject,
      subject_source: n.subject_source,
      difficulty: n.difficulty,
      difficulty_source: n.difficulty_source,
      tags: n.tags,
      raw_text: n.raw_text || '',
      raw_extra: n.raw_extra || '',
    });
  });

  const cardRows = [];
  await eachLine(F.cards, (c) => {
    cardRows.push({
      anki_note_id: Number(c.note_id), // bigint column
      card_type: c.card_kind,
      cloze_ordinal: c.card_kind === 'cloze' ? c.cloze_ordinal : 0,
      question_html: c.question_html,
      answer_html: c.answer_html,
      extra_html: c.extra_html || '',
      mcq_options: c.card_kind === 'mcq' ? c.mcq_options : null,
      mcq_correct_letter: c.card_kind === 'mcq' ? c.mcq_correct_letter : null,
      subject: c.subject,
      difficulty: c.difficulty,
      difficulty_source: c.difficulty_source,
      // Storage keys for this card's resolved media, so a renderer can rewrite
      // the <img src="original.jpg"> in question/answer/extra HTML to the bucket
      // without a per-card join. Derived, not looked up — storageKey() is a pure
      // function of the filename, identical to what the uploader used.
      media_keys: [...new Set((c.media || []).filter((m) => m.resolved).map((m) => storageKey(m.filename)))],
    });
  });

  // Order matters: anking_cards.anki_note_id has a FK to anking_notes, so notes
  // must land before cards whenever both phases are selected.
  if (wants('media')) await upsertRows(sb, cfg.LIVE.tables.media, mediaRows, cfg.LIVE.conflictTargets.media, 'anking_media', state, 'mediaRowsDone');
  else console.log('Skipping anking_media rows (not selected by --only)');
  if (wants('notes')) await upsertRows(sb, cfg.LIVE.tables.notes, noteRows, cfg.LIVE.conflictTargets.notes, 'anking_notes', state, 'notesDone');
  else console.log('Skipping anking_notes rows (not selected by --only)');
  if (wants('cards')) await upsertRows(sb, cfg.LIVE.tables.cards, cardRows, cfg.LIVE.conflictTargets.cards, 'anking_cards', state, 'cardsDone');
  else console.log('Skipping anking_cards rows (not selected by --only)');

  // Verify by counting server-side rather than trusting local tallies.
  const counts = {};
  for (const [label, t] of Object.entries(cfg.LIVE.tables)) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    counts[t] = error ? `ERROR ${error.message}` : count;
  }

  const L = ['# AnKing live import — RESULT\n', `Completed ${new Date().toISOString()}\n`, '| Table | Rows in Supabase | Expected |', '|---|---|---|'];
  L.push(`| \`${cfg.LIVE.tables.notes}\` | ${counts[cfg.LIVE.tables.notes]} | ${noteRows.length} |`);
  L.push(`| \`${cfg.LIVE.tables.cards}\` | ${counts[cfg.LIVE.tables.cards]} | ${cardRows.length} |`);
  L.push(`| \`${cfg.LIVE.tables.media}\` | ${counts[cfg.LIVE.tables.media]} | ${mediaRows.length} |`);
  L.push(`\nBytes uploaded this run: ${mb(up.bytes)} MB · failures: ${up.failed}`);
  if (up.failures.length) {
    L.push('\n**Upload failures**\n');
    for (const f of up.failures) L.push(`- \`${f.filename}\`: ${f.error}`);
  }
  fs.writeFileSync(F.liveReport, L.join('\n') + '\n');
  console.log('\n' + L.join('\n'));
}

main().catch((e) => { console.error('\nFATAL', e.message); process.exit(1); });
