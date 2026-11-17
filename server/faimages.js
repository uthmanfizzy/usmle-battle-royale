'use strict';

/**
 * First Aid Images — name what a First Aid figure shows.
 *
 * A solo mode under Story Mode → First Aid Journey. Each question is one
 * figure from the admin-curated `fa_images` bank: a clinical photo, a slide
 * or a scan to name, or a diagram with one label blurred out to recall. The
 * figures come from the player's own copy of First Aid, imported as a pack
 * through Admin → FA Images; none of them are in this (public) repository.
 *
 * Same row shape as Scan Master's bank, with `system` holding the First Aid
 * chapter id. A solo run is marked in the browser, so the run carries the
 * correct index.
 */

const CHAPTERS = [
  { id: 'biochem',  name: 'Biochemistry',        icon: '🧬' },
  { id: 'immuno',   name: 'Immunology',          icon: '🛡️' },
  { id: 'micro',    name: 'Microbiology',        icon: '🦠' },
  { id: 'path',     name: 'Pathology',           icon: '🔬' },
  { id: 'pharm',    name: 'Pharmacology',        icon: '💊' },
  { id: 'cardio',   name: 'Cardiovascular',      icon: '❤️' },
  { id: 'endo',     name: 'Endocrine',           icon: '🦋' },
  { id: 'gi',       name: 'Gastrointestinal',    icon: '🫃' },
  { id: 'heme_onc', name: 'Hematology & Oncology', icon: '🩸' },
  { id: 'msk',      name: 'Musculoskeletal & Skin', icon: '🦴' },
  { id: 'neuro',    name: 'Neurology',           icon: '🧠' },
  { id: 'psych',    name: 'Psychiatry',          icon: '🗣️' },
  { id: 'renal',    name: 'Renal',               icon: '💧' },
  { id: 'repro',    name: 'Reproductive',        icon: '👶' },
  { id: 'resp',     name: 'Respiratory',         icon: '🫁' },
];
const CHAPTER_IDS = new Set(CHAPTERS.map(c => c.id));

// What kind of figure it is — shown as the figure's caption tag.
const MODALITIES = ['Clinical photo', 'Histology', 'Imaging', 'Diagram', 'Graph', 'Other'];

const COUNT_CHOICES = [10, 20, 30, 0];   // 0 = every figure in the chapter
const SECONDS = 30;
const TABLE = 'fa_images';
const TABLE_HELP = 'The fa_images table does not exist yet — run fa-images-migration.sql in the Supabase SQL editor.';
const tableMissing = (error) => new RegExp(TABLE).test(error?.message || '') && /(does not exist|not find|schema cache)/i.test(error?.message || '');

function sanitizeOptions(raw) {
  const o = raw && typeof raw === 'object' ? raw : {};
  const chapters = Array.isArray(o.chapters) ? [...new Set(o.chapters.filter(c => CHAPTER_IDS.has(c)))] : [];
  const n = Number(o.count);
  return { chapters, count: COUNT_CHOICES.includes(n) ? n : 10 };
}

function cleanRow(r) {
  if (!r || !r.image_url || !r.answer || !CHAPTER_IDS.has(r.system)) return null;
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

/** Four options; topped up from the same chapter when a row has fewer than three wrong ones. */
function buildOptions(item, all, shuffle) {
  const seen = new Set([item.answer.toLowerCase()]);
  const wrong = [];
  const add = (t) => {
    const k = String(t || '').toLowerCase();
    if (!t || seen.has(k) || wrong.length >= 3) return;
    seen.add(k); wrong.push(t);
  };
  item.distractors.forEach(add);
  if (wrong.length < 3) shuffle(all.filter(o => o.system === item.system && o.id !== item.id)).forEach(o => add(o.answer));
  const options = shuffle([item.answer, ...wrong]);
  return { options, correct: options.indexOf(item.answer) };
}

/** A row from the admin form or a pack, cleaned for writing. */
function rowFromBody(b) {
  const distractors = (Array.isArray(b?.distractors) ? b.distractors : [])
    .map(d => String(d || '').trim().slice(0, 160)).filter(Boolean).slice(0, 6);
  return {
    system: String(b?.system || ''),
    modality: b?.modality ? String(b.modality).slice(0, 40) : null,
    image_url: String(b?.image_url || '').trim(),
    prompt: b?.prompt ? String(b.prompt).trim().slice(0, 240) : null,
    answer: String(b?.answer || '').trim().slice(0, 160),
    distractors,
    explanation: b?.explanation ? String(b.explanation).trim().slice(0, 4000) : null,
    active: b?.active !== false,
  };
}

module.exports = function createFaImages({ getSupabase, shuffle }) {
  /** Every playable figure. Paged: PostgREST silently caps a read at 1000. */
  async function loadBank() {
    const supabase = getSupabase();
    if (!supabase) return { rows: [], missing: false };
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabase.from(TABLE).select('*').eq('active', true).range(from, from + 999);
      if (error) {
        const missing = tableMissing(error);
        if (!missing) console.warn('[fa images] bank unavailable —', error.message);
        return { rows: [], missing };
      }
      for (const r of data || []) { const c = cleanRow(r); if (c) rows.push(c); }
      if (!data || data.length < 1000) return { rows, missing: false };
    }
  }

  async function catalog() {
    const { rows, missing } = await loadBank();
    const counts = {};
    for (const r of rows) counts[r.system] = (counts[r.system] || 0) + 1;
    return {
      ready: !missing,
      total: rows.length,
      chapters: CHAPTERS.map(c => ({ ...c, count: counts[c.id] || 0 })),
      counts: COUNT_CHOICES,
      seconds: SECONDS,
    };
  }

  async function buildRun(opts) {
    const { rows } = await loadBank();
    const pool = opts.chapters.length ? rows.filter(r => opts.chapters.includes(r.system)) : rows;
    const picked = shuffle(pool);
    return (opts.count ? picked.slice(0, opts.count) : picked).map(item => {
      const { options, correct } = buildOptions(item, rows, shuffle);
      return { ...item, options, correct };
    });
  }

  /** Mount the public and admin routes. */
  function mount(app, { rateLimit, adminAuth }) {
    app.get('/api/fa-images/catalog', rateLimit(60, 60000), async (req, res) => {
      try { res.json(await catalog()); }
      catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/fa-images/solo', rateLimit(30, 60000), async (req, res) => {
      try {
        const opts = sanitizeOptions({
          chapters: String(req.query.chapters || '').split(',').filter(Boolean),
          count: req.query.count,
        });
        const run = await buildRun(opts);
        res.json({
          seconds: SECONDS,
          questions: run.map(q => ({
            id: q.id,
            chapter: CHAPTERS.find(c => c.id === q.system) || { id: q.system, name: q.system, icon: '📘' },
            modality: q.modality,
            prompt: q.prompt || 'What does this figure show?',
            image: q.image_url, options: q.options, correct: q.correct,
            answer: q.answer, explanation: q.explanation,
          })),
        });
      } catch (err) {
        res.status(500).json({ error: err.message, questions: [] });
      }
    });

    // ── Admin: the same shape as Scan Master's, so its admin screen is shared.
    const supa = () => getSupabase();
    app.get('/admin/fa-images/images', adminAuth, async (req, res) => {
      if (!supa()) return res.json({ images: [], systems: CHAPTERS, modalities: MODALITIES });
      const rows = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supa().from(TABLE).select('*')
          .order('created_at', { ascending: false }).range(from, from + 999);
        if (error) {
          return res.json({ images: [], systems: CHAPTERS, modalities: MODALITIES,
            missingTable: tableMissing(error), error: tableMissing(error) ? TABLE_HELP : error.message });
        }
        rows.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      res.json({ images: rows, systems: CHAPTERS, modalities: MODALITIES });
    });

    app.post('/admin/fa-images/images', adminAuth, async (req, res) => {
      if (!supa()) return res.status(503).json({ error: 'Supabase not configured.' });
      const row = rowFromBody(req.body);
      if (!CHAPTER_IDS.has(row.system)) return res.status(400).json({ error: 'Pick a chapter.' });
      if (!row.image_url) return res.status(400).json({ error: 'Upload an image first.' });
      if (!row.answer) return res.status(400).json({ error: 'The correct answer is required.' });
      const { data, error } = await supa().from(TABLE).insert(row).select().single();
      if (error) return res.status(500).json({ error: tableMissing(error) ? TABLE_HELP : error.message });
      res.json({ ok: true, image: data });
    });

    app.put('/admin/fa-images/images/:id', adminAuth, async (req, res) => {
      if (!supa()) return res.status(503).json({ error: 'Supabase not configured.' });
      const row = rowFromBody(req.body);
      if (!CHAPTER_IDS.has(row.system)) return res.status(400).json({ error: 'Pick a chapter.' });
      if (!row.image_url || !row.answer) return res.status(400).json({ error: 'An image and the correct answer are required.' });
      const { data, error } = await supa().from(TABLE).update(row).eq('id', req.params.id).select().single();
      if (error) return res.status(500).json({ error: tableMissing(error) ? TABLE_HELP : error.message });
      res.json({ ok: true, image: data });
    });

    app.delete('/admin/fa-images/images/:id', adminAuth, async (req, res) => {
      if (!supa()) return res.status(503).json({ error: 'Supabase not configured.' });
      const { error } = await supa().from(TABLE).delete().eq('id', req.params.id);
      if (error) return res.status(500).json({ error: error.message });
      res.json({ ok: true });
    });
  }

  return { CHAPTERS, MODALITIES, catalog, buildRun, mount };
};
