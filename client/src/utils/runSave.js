/**
 * A run you walked away from, kept so you can pick it up again.
 *
 * Pressing Home in the middle of a level used to cost you the level: the
 * study time and the activity row were written, but where you were was not,
 * so coming back started you at question one with nothing.
 *
 * WHAT IS SAVED is the position, not the question: the ids in the order they
 * were served, which one you were on, and the running totals. The questions
 * themselves are refetched — a saved copy would go stale the moment an admin
 * edited one.
 *
 * WHY THE IDS MATTER: a First Aid Journey level is shuffled server-side on
 * every request, so a refetch comes back in a different order. Without the
 * ids, resuming at "question 4" would drop you on a question you had already
 * answered and skip one you had not.
 *
 * WHERE IT LIVES: localStorage, per browser. That is the right size for
 * this — a half-finished level is not worth a table and a migration, and it
 * being per-device matches the expectation that you resume where you left
 * off, on the machine you left it on. Everything is wrapped: a browser with
 * storage blocked simply never saves, and nothing above has to care.
 */

// v2: every v1 entry is discarded on sight. A run that finished before the
// clear below was fixed left its save behind, and those saves are exactly the
// ones that resume into a finished level and end again on the first answer.
// They cannot be told apart from good ones, so none of them are trusted.
const PREFIX = 'mr_run_v2:';
const LEGACY_PREFIX = 'mr_run_v1:';

let swept = false;
function sweepLegacy() {
  if (swept) return;
  swept = true;
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_PREFIX)) doomed.push(k);
    }
    for (const k of doomed) localStorage.removeItem(k);
  } catch {
    /* storage blocked — there is nothing to sweep anyway */
  }
}

// A fortnight. Long enough to come back to a level after a week off, short
// enough that a run you have genuinely forgotten does not ambush you.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * What identifies this run, or null for a run that must NOT be resumed.
 *
 * UWorld Adventure is deliberately excluded: its completion handler owns the
 * daily-block bookkeeping, and leaving a block already spends it. Resuming
 * into a block the day's count has already been charged for would hand back
 * questions the mode thinks are gone.
 */
export function runKeyFor({ uworldSkin, questionsUrl, subject, topicId, difficulty }) {
  if (uworldSkin) return null;
  // A journey level and a training topic both carry their identity in the
  // url they are fetched from; plain solo is identified by what it asked for.
  if (questionsUrl) return `url:${questionsUrl}`;
  if (topicId) return `topic:${topicId}:${difficulty || ''}`;
  if (subject) return `subject:${subject}:${difficulty || ''}`;
  return null;
}

export function loadRun(key) {
  if (!key) return null;
  sweepLegacy();
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.ids) || typeof saved.idx !== 'number') return null;
    if (!saved.at || Date.now() - saved.at > MAX_AGE_MS) { clearRun(key); return null; }
    // Nothing answered is not a run worth restoring.
    if (saved.idx <= 0) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveRun(key, data) {
  if (!key || !data || !Array.isArray(data.ids)) return;
  // The whole point is the questions already behind you; at zero there are
  // none, and writing anyway would leave a stale row after a fresh start.
  if (!(data.idx > 0)) { clearRun(key); return; }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ ...data, at: Date.now() }));
  } catch {
    /* storage full or blocked — the run just will not be resumable */
  }
}

export function clearRun(key) {
  if (!key) return;
  try { localStorage.removeItem(PREFIX + key); } catch { /* nothing to do */ }
}

/**
 * Put a freshly fetched set back into the order it was served in, and say
 * whether the saved position still makes sense against it.
 *
 * Questions that have since been deleted or retired simply drop out; ones
 * added since go on the end, after everything the player has already seen.
 * If the drop-outs eat into what they had already answered, the position is
 * no longer meaningful and the run is not resumable.
 */
export function restoreOrder(fetched, saved) {
  const list = Array.isArray(fetched) ? fetched : [];
  if (!saved || !list.length) return { questions: list, idx: 0, ok: false };

  const byId = new Map(list.map(q => [String(q.id), q]));
  const ordered = saved.ids.map(id => byId.get(String(id))).filter(Boolean);
  const kept = new Set(ordered.map(q => String(q.id)));
  const added = list.filter(q => !kept.has(String(q.id)));

  // Everything behind the cursor has to still be there, or the cursor points
  // at the wrong question.
  const answeredStillPresent = saved.ids.slice(0, saved.idx)
    .filter(id => byId.has(String(id))).length;
  const ok = answeredStillPresent === saved.idx && saved.idx < ordered.length + added.length;

  return { questions: [...ordered, ...added], idx: saved.idx, ok };
}
