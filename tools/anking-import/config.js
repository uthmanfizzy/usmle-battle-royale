'use strict';
/**
 * Mapping + path configuration for the AnKing import tool.
 *
 * Everything a human is likely to want to tweak between dry runs lives here so
 * import-anking.js stays mechanical. Editing this file and re-running is safe:
 * the dry run is pure analysis and never writes outside ./out.
 */

const os = require('os');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
// The collection copy made in an earlier session. The ORIGINAL Anki files are
// never opened by this tool — COLLECTION_PATH must point at a copy.
const SCRATCH = path.join(
  os.homedir(),
  'AppData/Local/Temp/claude/C--Users-faiza-usmle-battle-royale',
  '0355e547-259e-4707-ab0d-609e6c1f40dd/scratchpad/anki'
);

const PATHS = {
  collection: process.env.ANKI_COLLECTION || path.join(SCRATCH, 'collection.anki2'),
  // Read-only: we stat() files here to resolve media references. Never written.
  media: process.env.ANKI_MEDIA || path.join(os.homedir(), 'AppData/Roaming/Anki2/us/collection.media'),
  outDir: path.join(__dirname, 'out'),
};

// ── Note types in scope ───────────────────────────────────────────────────────
// ids are stable within this collection (verified in the schema-18 notetypes table).
const NOTETYPES = {
  ANKING_OVERHAUL: {
    id: 1606536512076,
    name: 'AnKingOverhaul',
    kind: 'cloze',
    // Only these field ordinals are parsed. Sketchy (2 -> wait, see below) and
    // friends are dropped wholesale, along with all media they reference.
    includeFields: { question: 0, extra: 1 }, // Text, Extra
    excludeFields: [2, 3, 4],                 // First Aid, Sketchy, Additional Resources
  },
  BASIC_A40BE: {
    id: 1454152820982,
    name: 'Basic-a40be',
    kind: 'mcq',
    includeFields: { front: 0, back: 1 },
    excludeFields: [],
  },
};

const INCLUDED_MID = new Set(Object.values(NOTETYPES).map((n) => n.id));

// ── Exclusions ────────────────────────────────────────────────────────────────
const EXCLUDE_TAGS = ['Step1::!FLAG_THESE_CARDS::!DELETE'];

// Contributor-provenance markers. These appear as a *segment* of a tag (usually
// the 3rd level under ^Systems) and carry no classification meaning.
const PROVENANCE_SEGMENTS = new Set(['BGadds', 'JBadds', 'AKadds']);

// ── Subject mapping ───────────────────────────────────────────────────────────
// Primary: Step1::^Systems::<System>
const SYSTEM_TO_SUBJECT = {
  Neuro: 'neurology',
  Cardio: 'cardiology',
  Biochem: 'biochemistry',
  GI: 'gastroenterology',
  Endocrine: 'endocrinology',
  Renal: 'nephrology',
  Respiratory: 'pulmonology',
  HemeOnc: 'haematology_oncology',
  Musculoskeletal: 'musculoskeletal',
  Immunology: 'immunology',
  Psychiatry: 'psychiatry',
  Psychology: 'psychiatry', // merged per scope decision
  Biostats: 'biostatistics',
  Dermatology: 'dermatology',
  Reproductive: 'reproductive',
};

// Fallback: the deck's top-level name, for the ~7.3k notes with no ^Systems tag.
// Keys are the exact top-level deck names present in this collection (all 19 of
// the non-Default roots are listed; anything absent falls through to "unmapped").
const DECK_ROOT_TO_SUBJECT = {
  'Neuro - Anking': 'neurology',
  Cardio: 'cardiology',
  'Cardio - Anking': 'cardiology',
  'Biochem - Anking': 'biochemistry',
  'Biochemistry - Mehlman': 'biochemistry',
  'GI - Anking': 'gastroenterology',
  'Endo - Anking': 'endocrinology',
  Renal: 'nephrology',
  Respiratory: 'pulmonology',
  'Hemat & Onco - Anking': 'haematology_oncology',
  'MSK - Anking': 'musculoskeletal',
  'Immuno & General Path - Anking': 'immunology',
  'Psychiatry - Anking': 'psychiatry',
  'Derma - Anking': 'dermatology',
  // Subject ids NOT present in the ^Systems mapping — introduced by the deck
  // fallback only. Flagged in the report for confirmation against MedVale's
  // real subject id list before the live import.
  'Microbiology - Anking': 'microbiology',
  'Pharma - Anking': 'pharmacology',
  'Pharm - Mehlman - General - Alpha and beta adrenergic drugs': 'pharmacology',
  'Public Health - Anking': 'biostatistics',
  // Deliberately unmapped: 'Default' (empty) and 'random facts ++' (Basic++ only,
  // excluded by note type anyway). Listing them here as null documents the intent.
  Default: null,
  'random facts ++': null,
};

// ── Difficulty mapping ────────────────────────────────────────────────────────
const YIELD_TO_DIFFICULTY = {
  '1-HighYield': 1,
  '2-RelativelyHighYield': 2,
  '3-HighYield-temporary': 3,
  '4-LowerYield': 4,
  '5-LowYield': 5,
};
const DEFAULT_DIFFICULTY = 3;

// ── HTML sanitisation ─────────────────────────────────────────────────────────
// NOTE ON <img>: the brief's keep-list was <b><i><u><sub><sup><div><br><a>, which
// omits <img>. But media handling only makes sense if images survive, and 12,168
// in-scope notes carry one. <img> is kept here with src/alt only; flip
// KEEP_IMG to false to follow the brief's list literally.
const KEEP_IMG = true;

const ALLOWED_TAGS = new Set(
  ['b', 'i', 'u', 'sub', 'sup', 'div', 'br', 'a', 'strong', 'em']
    .concat(KEEP_IMG ? ['img'] : [])
);

// Tags whose entire subtree is dropped (not just unwrapped).
const DROP_SUBTREE_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta']);

// Per-tag attribute allow-list. Anything not listed is stripped — this kills
// onclick/onerror/style and the AnKing-specific class="resizer" / inline widths.
const ALLOWED_ATTRS = {
  a: ['href'],
  img: ['src', 'alt'],
};

// ── Cloze rendering ───────────────────────────────────────────────────────────
// The blank that replaces the *target* ordinal in question_html.
const clozeBlank = (hint) =>
  `<span class="cloze-blank">[${hint ? hint : '...'}]</span>`;

// ── Media ─────────────────────────────────────────────────────────────────────
// Anki's internal media server leaks absolute URLs into field HTML.
const LOCAL_MEDIA_SERVER_RE = /^https?:\/\/127\.0\.0\.1(:\d+)?\//i;

module.exports = {
  PATHS,
  NOTETYPES,
  INCLUDED_MID,
  EXCLUDE_TAGS,
  PROVENANCE_SEGMENTS,
  SYSTEM_TO_SUBJECT,
  DECK_ROOT_TO_SUBJECT,
  YIELD_TO_DIFFICULTY,
  DEFAULT_DIFFICULTY,
  KEEP_IMG,
  ALLOWED_TAGS,
  DROP_SUBTREE_TAGS,
  ALLOWED_ATTRS,
  clozeBlank,
  LOCAL_MEDIA_SERVER_RE,
};

// ── Live import: expected table + bucket names ────────────────────────────────
// The row shapes below are what the importer WILL write. They are declared here,
// in one place, so they can be reconciled against the tables that actually exist
// in Supabase before a single row is sent. import-live.js refuses to write until
// a preflight introspection confirms every column below exists.
const LIVE = {
  bucket: 'anking-media',
  bucketPublic: true,
  tables: { notes: 'anking_notes', cards: 'anking_cards', media: 'anking_media' },

  // Natural keys used for upsert, so re-running never duplicates rows.
  conflictTargets: {
    notes: 'anki_note_id',
    cards: 'anki_note_id,card_type,cloze_ordinal',
    media: 'filename',
  },

  // Columns the importer WRITES. `id` and `created_at` are database-generated
  // and deliberately absent — preflight checks that every column here exists on
  // the table, and tolerates extra columns it does not write.
  columns: {
    anking_notes: [
      'anki_note_id', 'notetype', 'deck_path', 'subject', 'subject_source',
      'difficulty', 'difficulty_source', 'tags', 'raw_text', 'raw_extra',
    ],
    anking_cards: [
      'anki_note_id', 'card_type', 'cloze_ordinal', 'question_html', 'answer_html',
      'extra_html', 'mcq_options', 'mcq_correct_letter', 'subject', 'difficulty',
      'difficulty_source', 'media_keys',
    ],
    anking_media: [
      'filename', 'storage_key', 'public_url', 'byte_size', 'content_type', 'media_type',
    ],
  },
};

// Load tools/anking-import/.env into process.env if present. Deliberately a
// 6-line parser rather than a dependency: this file holds a service-role key and
// the fewer packages that can read it, the better.
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!require('fs').existsSync(envPath)) return;
  for (const line of require('fs').readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trimStart().startsWith('#')) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
})();

module.exports.LIVE = LIVE;
