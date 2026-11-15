import { useEffect, useMemo, useState } from 'react';
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

const EMPTY = { system: '', modality: '', image_url: '', prompt: '', answer: '', distractors: ['', '', ''], explanation: '', active: true };

/**
 * Admin → Scan Master: the picture bank the mode plays from.
 *
 * Each image needs a system, the correct answer and (ideally) three wrong
 * options; with fewer, the game borrows other answers from the same system.
 * Images are uploaded to the shared question-images bucket through the
 * existing /admin/upload-image route.
 */
export default function ScanMasterAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);       // null = closed; {id?} = editing
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [importing, setImporting] = useState(null);   // { done, total, added, skipped, failed, name } while running / after

  function load() {
    setError('');
    apiCall('/admin/scan-master/images')
      .then(r => r.json())
      .then(d => { setData(d); if (d.error) setError(d.error); })
      .catch(e => setError(`Could not load the image bank (${e.message}).`));
  }
  useEffect(load, []);

  const systems = data?.systems || [];
  const modalities = data?.modalities || [];
  const images = data?.images || [];
  const sysName = (id) => systems.find(s => s.id === id)?.name || id;
  const counts = useMemo(() => {
    const c = {};
    for (const im of images) if (im.active !== false) c[im.system] = (c[im.system] || 0) + 1;
    return c;
  }, [images]);
  const shown = images.filter(im =>
    (!filter || im.system === filter)
    && (!q.trim() || `${im.answer} ${im.modality || ''} ${(im.distractors || []).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())));

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setD = (i, v) => setForm(f => ({ ...f, distractors: f.distractors.map((d, j) => (j === i ? v : d)) }));

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setFormError('Only JPG, PNG and WEBP images.'); return; }
    if (file.size > 5 * 1024 * 1024) { setFormError('Images must be under 5MB.'); return; }
    setUploading(true);
    setFormError('');
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
      const res = await apiCall('/admin/upload-image', { method: 'POST', body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      set('image_url', d.url);
    } catch (err) {
      setFormError(err.message);
    }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    const body = { ...form, distractors: form.distractors.map(d => d.trim()).filter(Boolean) };
    const res = await apiCall(form.id ? `/admin/scan-master/images/${form.id}` : '/admin/scan-master/images', {
      method: form.id ? 'PUT' : 'POST', body: JSON.stringify(body),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res || !res.ok) { setFormError(d.error || 'Could not save.'); return; }
    // Keep the system and modality for the next one: images usually come in batches.
    setForm(form.id ? null : { ...EMPTY, system: form.system, modality: form.modality, distractors: ['', '', ''] });
    load();
  }

  /**
   * Load a question pack: a JSON file of { images: {key: dataURL}, items: [...] }.
   * Each picture is uploaded once through /admin/upload-image (so it lands in
   * the same storage bucket as a hand-added one) and every question that uses
   * it is then created. A question already in the bank — same system, prompt
   * and answer — is skipped, so importing the same pack twice adds nothing.
   * The pack stays on the admin's computer; nothing of it is in the code.
   */
  async function importPack(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { setError('That file is not a Scan Master pack.'); return; }
    if (pack?.format !== 'scan-master-pack' || !Array.isArray(pack.items) || !pack.images) { setError('That file is not a Scan Master pack.'); return; }
    if (data?.missingTable) { setError('Create the table first (scan-master-migration.sql).'); return; }
    if (!window.confirm(`Import "${pack.name || file.name}": ${pack.items.length} questions using ${Object.keys(pack.images).length} images?`)) return;

    const key = (r) => `${r.system}|${(r.prompt || '').trim().toLowerCase()}|${(r.answer || '').trim().toLowerCase()}`;
    const have = new Set(images.map(key));
    const todo = pack.items.filter(it => !have.has(key(it)));
    const state = { name: pack.name || file.name, total: pack.items.length, done: pack.items.length - todo.length, added: 0, skipped: pack.items.length - todo.length, failed: 0, error: '' };
    setImporting({ ...state });
    const urls = {};
    for (const it of todo) {
      try {
        if (!urls[it.image]) {
          const dataUrl = pack.images[it.image];
          if (!dataUrl) throw new Error(`image ${it.image} missing from the pack`);
          const mime = (dataUrl.match(/^data:([^;]+);/) || [])[1] || 'image/jpeg';
          const up = await apiCall('/admin/upload-image', {
            method: 'POST',
            body: JSON.stringify({ base64: dataUrl, filename: `scan-${it.image}.${mime.split('/')[1]}`, mimeType: mime }),
          });
          const ud = await up.json().catch(() => ({}));
          if (!up.ok || !ud.url) throw new Error(ud.error || 'upload failed');
          urls[it.image] = ud.url;
        }
        const res = await apiCall('/admin/scan-master/images', {
          method: 'POST',
          body: JSON.stringify({ ...it, image_url: urls[it.image], active: true }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || 'save failed');
        state.added += 1;
      } catch (err) {
        state.failed += 1;
        state.error = err.message;
      }
      state.done += 1;
      setImporting({ ...state });
    }
    setImporting({ ...state, finished: true });
    load();
  }

  async function remove(im) {
    if (!window.confirm(`Delete the "${im.answer}" image? This cannot be undone.`)) return;
    await apiCall(`/admin/scan-master/images/${im.id}`, { method: 'DELETE' });
    load();
  }

  async function toggleActive(im) {
    await apiCall(`/admin/scan-master/images/${im.id}`, { method: 'PUT', body: JSON.stringify({ ...im, active: im.active === false }) });
    load();
  }

  const edit = (im) => setForm({
    ...EMPTY, ...im,
    modality: im.modality || '', prompt: im.prompt || '', explanation: im.explanation || '',
    distractors: [...(im.distractors || []), '', '', ''].slice(0, Math.max(3, (im.distractors || []).length)),
  });

  return (
    <div className="sma">
      <div className="sma-head">
        <h2>🔬 Scan Master images</h2>
        <span className="sma-total">{images.filter(i => i.active !== false).length} live</span>
        <button type="button" className="ap-btn-pri" onClick={() => { setFormError(''); setForm({ ...EMPTY, distractors: ['', '', ''] }); }}>+ Add image</button>
        <label className={`ap-btn-sec ap-btn-sm sma-import${importing && !importing.finished ? ' is-busy' : ''}`} title="Load a Scan Master question pack (.json)">
          📦 Import pack
          <input type="file" accept=".json,application/json" onChange={importPack} hidden disabled={Boolean(importing && !importing.finished)} />
        </label>
        <button type="button" className="ap-btn-sec ap-btn-sm" onClick={load}>↻</button>
      </div>

      {importing && (
        <div className={`sma-progress${importing.failed ? ' has-fail' : ''}`}>
          <b>{importing.finished ? 'Import finished' : 'Importing'} — {importing.name}</b>
          <span className="sma-bar"><i style={{ width: `${(importing.done / importing.total) * 100}%` }} /></span>
          <small>
            {importing.done}/{importing.total} · {importing.added} added
            {importing.skipped ? ` · ${importing.skipped} already in the bank` : ''}
            {importing.failed ? ` · ${importing.failed} failed (${importing.error})` : ''}
          </small>
          {importing.finished && <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => setImporting(null)}>Close</button>}
        </div>
      )}

      {error && <p className="sma-error">{error}</p>}
      {data?.missingTable && (
        <p className="sma-warn">Run <code>scan-master-migration.sql</code> (repo root) in the Supabase SQL editor to create the table, then reload.</p>
      )}

      <div className="sma-systems">
        <button type="button" className={`sma-sys${!filter ? ' is-on' : ''}`} onClick={() => setFilter('')}>All <b>{images.length}</b></button>
        {systems.map(s => (
          <button key={s.id} type="button" className={`sma-sys${filter === s.id ? ' is-on' : ''}`} onClick={() => setFilter(s.id)}>
            {s.icon} {s.name} <b>{counts[s.id] || 0}</b>
          </button>
        ))}
      </div>
      <input className="ap-input-plain sma-search" placeholder="Search answers, options, modality…" value={q} onChange={e => setQ(e.target.value)} />

      {!data && !error && <p className="sma-dim">Loading…</p>}
      {data && !shown.length && <p className="sma-dim">No images here yet. Use “Add image”.</p>}

      <div className="sma-grid">
        {shown.map(im => (
          <article key={im.id} className={`sma-card${im.active === false ? ' is-off' : ''}`}>
            <img src={im.image_url} alt={im.answer} loading="lazy" />
            <div className="sma-card-body">
              <b>{im.answer}</b>
              <small>{sysName(im.system)}{im.modality ? ` · ${im.modality}` : ''}</small>
              {(im.distractors || []).length > 0 && <small className="sma-wrong">✗ {(im.distractors || []).join(' · ')}</small>}
              <div className="sma-card-actions">
                <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => edit(im)}>Edit</button>
                <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => toggleActive(im)}>{im.active === false ? 'Turn on' : 'Hide'}</button>
                <button type="button" className="ap-btn-danger ap-btn-sm" onClick={() => remove(im)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {form && (
        <div className="sma-modal" role="dialog" aria-label={form.id ? 'Edit image' : 'Add image'} onClick={(e) => { if (e.target === e.currentTarget) setForm(null); }}>
          <form className="sma-form" onSubmit={save}>
            <h3>{form.id ? 'Edit image' : 'Add image'}</h3>
            <div className="sma-form-grid">
              <div className="sma-drop">
                {form.image_url
                  ? <img src={form.image_url} alt="" />
                  : <span>{uploading ? 'Uploading…' : 'No image yet'}</span>}
                <label className="ap-btn-sec ap-btn-sm sma-upload">
                  {uploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} hidden />
                </label>
                <input className="ap-input-plain" placeholder="…or paste an image URL" value={form.image_url} onChange={e => set('image_url', e.target.value)} />
              </div>
              <div className="sma-fields">
                <label>System
                  <select className="ap-input-plain" value={form.system} onChange={e => set('system', e.target.value)} required>
                    <option value="">Choose…</option>
                    {systems.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </label>
                <label>Type of image
                  <select className="ap-input-plain" value={form.modality} onChange={e => set('modality', e.target.value)}>
                    <option value="">—</option>
                    {modalities.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label>Question (optional)
                  <input className="ap-input-plain" placeholder="What does this image show?" value={form.prompt} onChange={e => set('prompt', e.target.value)} />
                </label>
                <label className="sma-right">Correct answer
                  <input className="ap-input-plain" value={form.answer} onChange={e => set('answer', e.target.value)} required />
                </label>
                <div className="sma-wrongs">
                  <span>Wrong options <small>(3 recommended; blanks are filled from the same system)</small></span>
                  {form.distractors.map((d, i) => (
                    <input key={i} className="ap-input-plain" placeholder={`Wrong option ${i + 1}`} value={d} onChange={e => setD(i, e.target.value)} />
                  ))}
                  {form.distractors.length < 6 && (
                    <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => set('distractors', [...form.distractors, ''])}>+ another</button>
                  )}
                </div>
                <label>Explanation (shown after the reveal)
                  <textarea className="ap-input-plain" rows={3} value={form.explanation} onChange={e => set('explanation', e.target.value)} />
                </label>
                <label className="sma-check">
                  <input type="checkbox" checked={form.active !== false} onChange={e => set('active', e.target.checked)} /> Live in the game
                </label>
              </div>
            </div>
            {formError && <p className="sma-error">{formError}</p>}
            <div className="sma-form-actions">
              <button type="button" className="ap-btn-sec" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="ap-btn-pri" disabled={busy || uploading || !form.image_url || !form.answer || !form.system}>
                {busy ? 'Saving…' : form.id ? 'Save' : 'Add image'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
