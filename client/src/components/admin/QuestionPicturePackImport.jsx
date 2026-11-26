import { useState } from 'react';
import './ScanMasterAdmin.css';
import { SERVER_URL } from '../../serverUrl';

const AUTH_KEY = 'usmle_admin_session';
// A server redeploy drops requests for a minute or so; retry those rather
// than failing half the pack.
const RETRY_WAITS = [3000, 8000, 20000, 45000];
async function apiCall(path, options = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${SERVER_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem(AUTH_KEY) || '',
          ...(options.headers || {}),
        },
      });
      if (![502, 503, 504].includes(res.status) || attempt >= RETRY_WAITS.length) return res;
    } catch (err) {
      if (attempt >= RETRY_WAITS.length) throw err;
    }
    await new Promise(r => setTimeout(r, RETRY_WAITS[attempt]));
  }
}

const hasPicture = (q) => Boolean(
  q.image_url || q.explanation_image_url
  || (q.stem_images || []).length || (q.explanation_images || []).length,
);

/**
 * Attaches pictures to questions that are already in the bank. A pack is
 * built on the admin's computer (the pictures never go in the public repo):
 *
 *   { format: 'question-picture-pack', name, subject,
 *     images: { key: dataURL },
 *     questions: [{ id: 'OB-105', stem_images: [key], explanation_images: [key] }] }
 *
 * A question that already has any picture is left alone, so a pack only
 * fills the gaps and importing it twice changes nothing.
 */
export default function QuestionPicturePackImport({ modeLabel }) {
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');

  async function importPack(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { setError('That file is not a picture pack.'); return; }
    if (pack?.format !== 'question-picture-pack' || !Array.isArray(pack.questions)) { setError('That file is not a picture pack.'); return; }

    // What the bank holds right now, so a question that already has a
    // picture is skipped even if the pack was built before it got one.
    let bank;
    try {
      const r = await fetch(`${SERVER_URL}/api/questions?subject=${encodeURIComponent(pack.subject || 'all')}`);
      bank = new Map(((await r.json()).questions || []).map(q => [q.id, q]));
    } catch { setError('Could not read the question bank. Try again.'); return; }
    const missing = pack.questions.filter(q => !bank.has(q.id)).map(q => q.id);
    const todo = pack.questions.filter(q => bank.has(q.id) && !hasPicture(bank.get(q.id)));
    const skipped = pack.questions.length - todo.length - missing.length;
    if (!todo.length) {
      setError(`Nothing to add: ${skipped} already have pictures${missing.length ? `, ${missing.length} not found (${missing.slice(0, 5).join(', ')})` : ''}.`);
      return;
    }
    if (!window.confirm(`Add pictures to ${todo.length} questions from "${pack.name || file.name}"?\n${skipped} already have pictures and will be left alone.${missing.length ? `\n${missing.length} not in the bank: ${missing.slice(0, 8).join(', ')}` : ''}`)) return;

    const images = pack.images || {};
    const state = { name: pack.name || file.name, total: todo.length, done: 0, added: 0, failed: 0, error: '' };
    setImporting({ ...state });
    const upload = async (key, id) => {
      const dataUrl = images[key];
      if (!dataUrl) throw new Error(`picture ${key} is missing from the pack`);
      const mime = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
      const r = await apiCall('/admin/upload-image', {
        method: 'POST',
        body: JSON.stringify({ base64: dataUrl, filename: `${id}-${key}.${mime.split('/')[1]}`, mimeType: mime }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || 'picture upload failed');
      return d.url;
    };

    for (const q of todo) {
      try {
        const body = {};
        if (q.stem_images?.length) {
          body.stem_images = [];
          for (const k of q.stem_images) body.stem_images.push(await upload(k, q.id));
        }
        if (q.explanation_images?.length) {
          body.explanation_images = [];
          for (const k of q.explanation_images) body.explanation_images.push({ url: await upload(k, q.id), pos: 0 });
        }
        const r = await apiCall(`/api/question-image/${encodeURIComponent(q.id)}?table=questions`, { method: 'PUT', body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'save failed');
        state.added += 1;
      } catch (err) {
        state.failed += 1; state.error = `${q.id}: ${err.message}`;
      }
      state.done += 1;
      setImporting({ ...state });
    }
    setImporting({ ...state, finished: true });
  }

  return (
    <div className="sma" style={{ marginBottom: 16 }}>
      <div className="sma-head">
        <h2>🖼️ {modeLabel} pictures</h2>
        <label className={`ap-btn-sec ap-btn-sm sma-import${importing && !importing.finished ? ' is-busy' : ''}`} title="Load a picture pack (.json)">
          📦 Import picture pack
          <input type="file" accept=".json,application/json" onChange={importPack} hidden disabled={Boolean(importing && !importing.finished)} />
        </label>
      </div>
      <p style={{ margin: '4px 0' }}>Adds pictures only to questions that have none yet.</p>
      {error && <p className="sma-error">{error}</p>}
      {importing && (
        <div className={`sma-progress${importing.failed ? ' has-fail' : ''}`}>
          <b>{importing.finished ? 'Import finished' : 'Importing'} — {importing.name}</b>
          <span className="sma-bar"><i style={{ width: `${(importing.done / Math.max(1, importing.total)) * 100}%` }} /></span>
          <small>
            {importing.done}/{importing.total} · {importing.added} saved
            {importing.failed ? ` · ${importing.failed} failed (${importing.error})` : ''}
          </small>
          {importing.finished && <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => setImporting(null)}>Close</button>}
        </div>
      )}
    </div>
  );
}
