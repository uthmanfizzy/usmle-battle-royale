import { useState } from 'react';
import './ScanMasterAdmin.css';
import { SERVER_URL } from '../../serverUrl';

const AUTH_KEY = 'usmle_admin_session';
function apiCall(path, options = {}) {
  return fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': localStorage.getItem(AUTH_KEY) || '',
      ...(options.headers || {}),
    },
  });
}

const BATCH = 10;
const norm = (s) => String(s || '').trim();

/**
 * 📦 Import pack for a question bank (Amboss 200 Concepts first).
 *
 * A pack is a JSON file of
 *   { format: 'question-bank-pack', tag, name, images: {key: dataURL},
 *     items: [{ question_id, question, choices, correct, category, difficulty, image? }] }
 * the same shape as a Scan Master pack. Each picture is uploaded once through
 * /admin/upload-image, then the questions go through /admin/questions/bulk
 * tagged with this bank, a few at a time so the bar moves.
 *
 * A question already in the bank (same stem) is skipped, unless it is missing
 * the picture the pack has for it; then only the picture is added. So
 * importing the same pack twice changes nothing. The pack stays on the
 * admin's computer, so none of its content is in the public repo.
 */
export default function QuestionBankPackImport({ modeId, modeLabel }) {
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');

  async function importPack(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { setError('That file is not a question pack.'); return; }
    if (pack?.format !== 'question-bank-pack' || !Array.isArray(pack.items)) { setError('That file is not a question pack.'); return; }
    if (pack.tag && pack.tag !== modeId
      && !window.confirm(`This pack is for "${pack.tag}", not ${modeLabel}. Import it into ${modeLabel} anyway?`)) return;
    const images = pack.images || {};
    if (!window.confirm(`Import "${pack.name || file.name}" into ${modeLabel}: ${pack.items.length} questions with ${Object.keys(images).length} pictures?`)) return;

    const state = { name: pack.name || file.name, total: pack.items.length, done: 0, added: 0, skipped: 0, failed: 0, error: '' };
    setImporting({ ...state, stage: 'Checking what is already in the bank…' });

    // What the bank already has, by stem — the same key the bulk import matches on.
    const existing = new Map();
    try {
      const r = await apiCall('/admin/questions');
      const d = await r.json();
      for (const q of (d.questions || [])) existing.set(norm(q.question), q);
    } catch (err) {
      setImporting({ ...state, finished: true, failed: state.total, error: `could not read the bank (${err.message})` });
      return;
    }

    const todo = [];
    for (const it of pack.items) {
      const have = existing.get(norm(it.question));
      const needsPicture = it.image && !(have?.image_url && /^https?:/i.test(have.image_url));
      if (have && (have.game_modes || []).includes(modeId) && !needsPicture) { state.skipped += 1; state.done += 1; }
      else todo.push(it);
    }
    setImporting({ ...state });

    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      const questions = [];
      for (const it of chunk) {
        try {
          let image_url;
          if (it.image) {
            const dataUrl = images[it.image];
            if (!dataUrl) throw new Error(`picture ${it.image} missing from the pack`);
            const mime = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
            const up = await apiCall('/admin/upload-image', {
              method: 'POST',
              body: JSON.stringify({ base64: dataUrl, filename: `${it.image}.${mime.split('/')[1]}`, mimeType: mime }),
            });
            const ud = await up.json().catch(() => ({}));
            if (!up.ok || !ud.url) throw new Error(ud.error || 'picture upload failed');
            image_url = ud.url;
          }
          questions.push({
            question_id: it.question_id,
            question: it.question,
            choices: it.choices,
            correct: it.correct,
            category: it.category,
            difficulty: it.difficulty || 'hard',
            explanation: it.explanation || '',
            game_modes: [modeId],
            ...(image_url ? { image_url } : {}),
          });
        } catch (err) {
          state.failed += 1; state.done += 1; state.error = err.message;
        }
      }
      if (questions.length) {
        try {
          const res = await apiCall('/admin/questions/bulk', { method: 'POST', body: JSON.stringify({ questions }) });
          const d = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(d.error || 'save failed');
          const skipped = Array.isArray(d.skipped) ? d.skipped.length : 0;
          state.added += questions.length - skipped;
          state.failed += skipped;
          if (skipped) state.error = d.skipped[0]?.reason || 'skipped by the server';
        } catch (err) {
          state.failed += questions.length; state.error = err.message;
        }
        state.done += questions.length;
      }
      setImporting({ ...state });
    }
    setImporting({ ...state, finished: true });
  }

  return (
    <div className="sma" style={{ marginBottom: 16 }}>
      <div className="sma-head">
        <h2>📦 Question pack</h2>
        <label className={`ap-btn-sec ap-btn-sm sma-import${importing && !importing.finished ? ' is-busy' : ''}`} title={`Load a ${modeLabel} question pack (.json)`}>
          📦 Import pack
          <input type="file" accept=".json,application/json" onChange={importPack} hidden disabled={Boolean(importing && !importing.finished)} />
        </label>
      </div>
      {error && <p className="sma-error">{error}</p>}
      {importing && (
        <div className={`sma-progress${importing.failed ? ' has-fail' : ''}`}>
          <b>{importing.finished ? 'Import finished' : 'Importing'} — {importing.name}</b>
          {importing.stage && !importing.done && !importing.finished && <small>{importing.stage}</small>}
          <span className="sma-bar"><i style={{ width: `${(importing.done / Math.max(1, importing.total)) * 100}%` }} /></span>
          <small>
            {importing.done}/{importing.total} · {importing.added} added or updated
            {importing.skipped ? ` · ${importing.skipped} already in the bank` : ''}
            {importing.failed ? ` · ${importing.failed} failed (${importing.error})` : ''}
          </small>
          {importing.finished && <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => setImporting(null)}>Close</button>}
        </div>
      )}
    </div>
  );
}
