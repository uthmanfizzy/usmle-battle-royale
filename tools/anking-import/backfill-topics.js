#!/usr/bin/env node
/**
 * One-time backfill: anking_cards.topic, derived from the parent note's
 * Step1::#FirstAid tags.
 *
 *   node backfill-topics.js --dry-run     compute and report, write nothing
 *   node backfill-topics.js               apply
 *   node backfill-topics.js --redo        reset the checkpoint and re-apply
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, read from this
 * directory's .env by config.js exactly as the import does.
 *
 * WHICH FirstAid TAG WINS
 * -----------------------
 * A note usually carries several #FirstAid tags, and they routinely span
 * chapters: a cardiology note may be tagged under 05_Pharmacology and
 * 07_Cardiovascular at once. Taking the lowest-numbered chapter across ALL of
 * them therefore imports topics from the wrong discipline — a cardiology card
 * lands in "Lymphoid Structures" because it happens to carry an 02_Immunology
 * tag, and no card is ever left as 'Other' because some FirstAid tag always
 * matches. Measured on the real corpus, that mis-assigns 129 cardiology cards
 * and 394 microbiology cards, and produces 10 spurious topics per subject.
 *
 * So the chapter is pinned to the one the subject itself lives in, and the
 * lowest-numbered TOPIC within that chapter wins. That reproduces the validated
 * distribution exactly. The chapter is not hardcoded per subject — it is
 * derived as the chapter most of that subject's notes are tagged under, so a
 * new subject needs no code change.
 *
 * Idempotency: topic is a pure function of the note's tags, and updates are
 * keyed on anki_note_id, so re-running rewrites the same values. Progress is
 * checkpointed to out/topic-state.json after every batch, so an interrupted run
 * resumes where it stopped.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('./config');   // side effect: loads .env into process.env

const OUT = path.join(__dirname, 'out');
const F = {
  state: path.join(OUT, 'topic-state.json'),
  log: path.join(OUT, 'topic-backfill.log'),
  report: path.join(OUT, 'topic-backfill-report.md'),
};

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const REDO = argv.includes('--redo');
const NOTE_BATCH = 400;   // notes per checkpoint
const ID_CHUNK = 100;     // note ids per UPDATE ... IN (...)

const FA = 'Step1::#FirstAid::';
const DEFAULT_TOPIC = 'Other';

/** "04_Pathology" -> "Pathology"; "02_Anatomy_&_Physiology" -> "Anatomy & Physiology". */
const cleanTopic = (seg) => seg.replace(/^\d+_/, '').replace(/_/g, ' ');

/**
 * The topic for one note: the lowest-numbered topic segment among the note's
 * FirstAid tags that sit in `chapter`. Null chapter, or no tag in it, means the
 * card keeps the column default.
 */
function topicForNote(tags, chapter) {
  if (!chapter) return DEFAULT_TOPIC;
  const prefix = `${FA}${chapter}::`;
  let best = null;
  for (const t of tags || []) {
    if (typeof t !== 'string' || !t.startsWith(prefix)) continue;
    const seg = t.split('::')[3];
    // Segments are zero-padded ("01_".."16_"), so lexical order is numeric order.
    if (seg && (best === null || seg < best)) best = seg;
  }
  return best === null ? DEFAULT_TOPIC : cleanTopic(best);
}

/** The FirstAid chapter each subject predominantly lives in. */
function deriveChapters(notes) {
  const perSubject = new Map();
  for (const n of notes) {
    if (!n.subject) continue;
    let counts = perSubject.get(n.subject);
    if (!counts) perSubject.set(n.subject, (counts = new Map()));
    const seen = new Set();
    for (const t of n.tags || []) {
      if (typeof t !== 'string' || !t.startsWith(FA)) continue;
      const chapter = t.split('::')[2];
      if (chapter) seen.add(chapter);
    }
    for (const c of seen) counts.set(c, (counts.get(c) || 0) + 1);
  }

  const chapters = new Map();
  const margins = [];
  for (const [subject, counts] of perSubject) {
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    if (!ranked.length) continue;
    chapters.set(subject, ranked[0][0]);
    margins.push({
      subject, chapter: ranked[0][0], notes: ranked[0][1],
      runnerUp: ranked[1] ? `${ranked[1][0]} (${ranked[1][1]})` : '—',
    });
  }
  return { chapters, margins };
}

const loadState = () => {
  if (!REDO && fs.existsSync(F.state)) {
    try {
      // Strip a BOM: an editor (or PowerShell's Set-Content -Encoding utf8)
      // will happily add one, and JSON.parse rejects it.
      return JSON.parse(fs.readFileSync(F.state, 'utf8').replace(/^﻿/, ''));
    } catch (e) {
      // Safe to continue — every write is idempotent, so the worst case is
      // redoing work — but say so rather than silently restarting.
      console.warn(`  ! checkpoint unreadable (${e.message}); starting from the beginning`);
    }
  }
  return { lastNoteId: 0, notesDone: 0, cardsUpdated: 0, startedAt: new Date().toISOString() };
};
const saveState = (s) => fs.writeFileSync(F.state, JSON.stringify(s, null, 2));

/** Page a table fully; one PostgREST request silently caps at 1000 rows. */
async function pageAll(sb, table, select) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from(table).select(select)
      .order('anki_note_id', { ascending: true }).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) break;
    if (from && from % 10000 === 0) process.stdout.write(`    …${out.length} ${table} rows\n`);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (tools/anking-import/.env)');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  console.log(`AnKing topic backfill${DRY ? ' (DRY RUN — nothing will be written)' : ''}${REDO ? ' [--redo]' : ''}`);

  console.log('Loading notes…');
  const notes = await pageAll(sb, 'anking_notes', 'anki_note_id, subject, tags');
  console.log(`  ${notes.length} notes`);

  const { chapters, margins } = deriveChapters(notes);
  console.log('\nFirstAid chapter per subject (derived, not hardcoded):');
  for (const m of margins.sort((a, b) => b.notes - a.notes)) {
    console.log(`  ${m.subject.padEnd(22)} ${m.chapter.padEnd(28)} ${String(m.notes).padStart(5)} notes   runner-up: ${m.runnerUp}`);
  }

  // Compute every note's topic up front; only the non-default ones need writing.
  const planned = [];
  const tally = new Map();
  for (const n of notes) {
    const topic = topicForNote(n.tags, chapters.get(n.subject));
    tally.set(topic, (tally.get(topic) || 0) + 1);
    if (topic !== DEFAULT_TOPIC) planned.push({ id: n.anki_note_id, topic });
  }
  planned.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  console.log(`\n${planned.length} notes get a topic; ${(tally.get(DEFAULT_TOPIC) || 0)} stay '${DEFAULT_TOPIC}' (column default, no write)`);

  if (DRY) {
    console.log('\nTopic distribution that WOULD be written (by note):');
    for (const [t, c] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(c).padStart(6)}  ${t}`);
    }
    console.log('\nDry run complete — no rows touched.');
    return;
  }

  const state = loadState();
  if (REDO && fs.existsSync(F.state)) console.log('--redo: checkpoint reset');
  // anki_note_id is a bigint but every value is well inside 2^53, so ordinary
  // numeric comparison is exact here and matches the sort above.
  const todo = planned.filter((p) => Number(p.id) > Number(state.lastNoteId));
  console.log(`Resuming at note ${state.lastNoteId} — ${todo.length} of ${planned.length} notes left\n`);

  const log = fs.createWriteStream(F.log, { flags: 'a' });
  log.write(`\n=== run ${new Date().toISOString()} — ${todo.length} notes to update ===\n`);

  for (let i = 0; i < todo.length; i += NOTE_BATCH) {
    const batch = todo.slice(i, i + NOTE_BATCH);

    // One UPDATE per distinct topic in the batch, chunked to keep URLs sane.
    const byTopic = new Map();
    for (const p of batch) {
      if (!byTopic.has(p.topic)) byTopic.set(p.topic, []);
      byTopic.get(p.topic).push(p.id);
    }

    let updated = 0;
    for (const [topic, ids] of byTopic) {
      for (let j = 0; j < ids.length; j += ID_CHUNK) {
        const chunk = ids.slice(j, j + ID_CHUNK);
        const { data, error } = await sb.from('anking_cards')
          .update({ topic }).in('anki_note_id', chunk).select('id');
        if (error) throw new Error(`update ${topic}: ${error.message}`);
        updated += data.length;
      }
    }

    state.lastNoteId = batch[batch.length - 1].id;
    state.notesDone += batch.length;
    state.cardsUpdated += updated;
    saveState(state);
    log.write(`${new Date().toISOString()} notes<=${state.lastNoteId} batch=${batch.length} cards=${updated} total=${state.cardsUpdated}\n`);
    process.stdout.write(`\r  ${state.notesDone}/${planned.length} notes · ${state.cardsUpdated} cards updated   `);
  }
  log.end();
  console.log('\n\nBackfill complete.');

  fs.writeFileSync(F.report, [
    '# AnKing topic backfill',
    '',
    `Run: ${new Date().toISOString()}`,
    `Notes with a topic: ${planned.length} of ${notes.length}`,
    `Cards updated: ${state.cardsUpdated}`,
    '',
    '## Chapter derived per subject',
    '',
    '| subject | FirstAid chapter | notes | runner-up |',
    '| --- | --- | ---: | --- |',
    ...margins.map((m) => `| ${m.subject} | ${m.chapter} | ${m.notes} | ${m.runnerUp} |`),
  ].join('\n'));
  console.log(`Report: ${path.relative(process.cwd(), F.report)}`);
}

main().catch((e) => { console.error('\nFAILED:', e.message); process.exit(1); });
