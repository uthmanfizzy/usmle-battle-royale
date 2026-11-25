import { useEffect, useState } from 'react';
import './ScanMasterAdmin.css';
import { SERVER_URL } from '../../serverUrl';

const AUTH_KEY = 'usmle_admin_session';
// A long import outlives short outages (a server redeploy drops requests for
// a minute or so, which fetch reports as "Failed to fetch"), so network
// errors and 502/503/504 are retried with a growing wait before giving up.
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

const BATCH = 5;

/**
 * Admin → Amboss Qbank: imports an AMBOSS Qbank pack built on the admin's
 * computer by tools/amboss-qbank (the content never goes in the public repo).
 *
 * A pack is { format: 'amboss-qbank-pack', system, systemName, images:
 * {key: dataURL}, questions: [...] } where every figure in a question is a key
 * into `images`. Each figure is uploaded once through /admin/upload-image and
 * swapped for its URL, then the questions go to /admin/amboss-qbank/import a
 * few at a time. A question already in the bank is skipped unless
 * "replace existing" is ticked, so importing the same pack twice uploads
 * nothing new.
 */
export default function AmbossQbankImport() {
  const [summary, setSummary] = useState(null);
  const [replace, setReplace] = useState(false);
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');

  const loadSummary = () => apiCall('/admin/amboss-qbank/summary')
    .then(r => r.json())
    .then(d => setSummary(d))
    .catch(() => setSummary({ rows: [], error: true }));
  useEffect(() => { loadSummary(); }, []);

  async function importPack(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { setError('That file is not an Amboss Qbank pack.'); return; }
    if (pack?.format !== 'amboss-qbank-pack' || !Array.isArray(pack.questions)) { setError('That file is not an Amboss Qbank pack.'); return; }
    const images = pack.images || {};
    const have = new Set(summary?.ids || []);
    const todo = pack.questions.filter(q => replace || !have.has(q.id));
    if (!todo.length) { setError(`All ${pack.questions.length} questions in this pack are already in the bank. Tick "replace existing" to import them again.`); return; }
    if (!window.confirm(`Import "${pack.name || file.name}": ${todo.length} of ${pack.questions.length} questions?`)) return;

    const state = { name: pack.name || file.name, total: todo.length, done: 0, added: 0, failed: 0, error: '' };
    setImporting({ ...state });
    const uploaded = new Map();
    const upload = async (key) => {
      if (uploaded.has(key)) return uploaded.get(key);
      const dataUrl = images[key];
      if (!dataUrl) throw new Error(`figure ${key} is missing from the pack`);
      const mime = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
      const r = await apiCall('/admin/upload-image', {
        method: 'POST',
        body: JSON.stringify({ base64: dataUrl, filename: `aqb-${key}.${mime.split('/')[1]}`, mimeType: mime }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.url) throw new Error(d.error || 'figure upload failed');
      uploaded.set(key, d.url);
      return d.url;
    };

    for (let i = 0; i < todo.length; i += BATCH) {
      const ready = [];
      for (const q of todo.slice(i, i + BATCH)) {
        try {
          const stem_images = [];
          for (const k of q.stem_images || []) stem_images.push(await upload(k));
          const choices = [];
          for (const c of q.choices) {
            const explanation = [];
            for (const b of c.explanation || []) {
              if (b.type !== 'images') { explanation.push(b); continue; }
              const urls = [];
              for (const k of b.images) urls.push(await upload(k));
              explanation.push({ type: 'images', images: urls });
            }
            choices.push({ ...c, explanation });
          }
          ready.push({ ...q, stem_images, choices });
        } catch (err) {
          state.failed += 1; state.done += 1; state.error = `${q.id}: ${err.message}`;
        }
        setImporting({ ...state });
      }
      if (ready.length) {
        try {
          const r = await apiCall('/admin/amboss-qbank/import', { method: 'POST', body: JSON.stringify({ questions: ready }) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(d.error || 'save failed');
          state.added += ready.length;
        } catch (err) {
          state.failed += ready.length; state.error = err.message;
          if (/migration/.test(err.message)) { state.done += ready.length; setImporting({ ...state, finished: true }); return; }
        }
        state.done += ready.length;
        setImporting({ ...state });
      }
    }
    setImporting({ ...state, finished: true });
    loadSummary();
  }

  const bySystem = new Map();
  for (const r of summary?.rows || []) {
    const s = bySystem.get(r.system) || new Map();
    s.set(r.block, (s.get(r.block) || 0) + 1);
    bySystem.set(r.system, s);
  }

  return (
    <div className="sma" style={{ marginBottom: 16 }}>
      <div className="sma-head">
        <h2>🗂️ Amboss Qbank</h2>
        <label className="ap-btn-sec ap-btn-sm" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          <input type="checkbox" checked={replace} onChange={e => setReplace(e.target.checked)} /> replace existing
        </label>
        <label className={`ap-btn-sec ap-btn-sm sma-import${importing && !importing.finished ? ' is-busy' : ''}`} title="Load an Amboss Qbank pack (.json)">
          📦 Import pack
          <input type="file" accept=".json,application/json" onChange={importPack} hidden disabled={Boolean(importing && !importing.finished)} />
        </label>
      </div>
      {summary?.setup && (
        <p className="sma-error">The Qbank tables do not exist yet. Run <code>amboss-qbank-migration.sql</code> in the Supabase SQL editor, then import a pack.</p>
      )}
      {summary && !summary.setup && !bySystem.size && <p>No questions yet. Import a pack built by <code>tools/amboss-qbank</code>.</p>}
      {[...bySystem.entries()].map(([sys, blocks]) => (
        <p key={sys} style={{ margin: '4px 0' }}>
          <b>{sys}</b>: {[...blocks.entries()].sort((a, b) => a[0] - b[0]).map(([b, n]) => `Block ${b} (${n})`).join(' · ')}
        </p>
      ))}
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
