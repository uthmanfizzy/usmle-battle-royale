import { useEffect, useState } from 'react';
import './ScanMasterAdmin.css';
import { SERVER_URL } from '../../serverUrl';
import { MURMURS } from '../../murmur/murmurData';

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

/**
 * Admin → Game Settings → Murmurs sounds.
 *
 * Swaps a murmur's synthesised sound for a real recording. A pack is a JSON
 * file of { format: 'murmur-audio-pack', sounds: { murmurId: { dataUrl } } };
 * each clip is uploaded through /admin/upload-audio (the question-audio
 * bucket) and the resulting URLs are saved as gameSettings.murmurAudio, which
 * the minigame reads. The recordings stay out of the public repo.
 *
 * "Use synthesised" removes one, putting that murmur back on its own sound.
 */
export default function MurmurAudioAdmin() {
  const [audio, setAudio] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const load = () => fetch(`${SERVER_URL}/api/game-settings`)
    .then((r) => r.json())
    .then((s) => setAudio(s.murmurAudio || {}))
    .catch(() => setAudio({}));
  useEffect(() => { load(); }, []);

  async function save(map) {
    const res = await apiCall('/admin/settings', { method: 'POST', body: JSON.stringify({ murmurAudio: map }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || 'save failed');
    setAudio(d.murmurAudio || {});
  }

  async function importPack(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    let pack;
    try { pack = JSON.parse(await file.text()); } catch { setError('That file is not a murmur sound pack.'); return; }
    if (pack?.format !== 'murmur-audio-pack' || !pack.sounds) { setError('That file is not a murmur sound pack.'); return; }
    const known = new Set(MURMURS.map((m) => m.id));
    const entries = Object.entries(pack.sounds).filter(([id]) => known.has(id));
    if (!entries.length) { setError('No sounds in that pack match a murmur in the game.'); return; }
    if (!window.confirm(`Import ${entries.length} recorded sounds? They will replace the synthesised sound for those murmurs.`)) return;

    const state = { total: entries.length, done: 0, failed: 0, error: '' };
    setBusy({ ...state });
    const urls = {};
    for (const [id, s] of entries) {
      try {
        const mime = (s.dataUrl.match(/^data:([^;]+);/) || [])[1] || 'audio/mpeg';
        const up = await apiCall('/admin/upload-audio', {
          method: 'POST',
          body: JSON.stringify({ base64: s.dataUrl, filename: `murmur-${id}.mp3`, mimeType: mime }),
        });
        const d = await up.json().catch(() => ({}));
        if (!up.ok || !d.url) throw new Error(d.error || 'upload failed');
        urls[id] = d.url;
      } catch (err) {
        state.failed += 1;
        state.error = err.message;
      }
      state.done += 1;
      setBusy({ ...state });
    }
    try {
      if (Object.keys(urls).length) await save(urls);
    } catch (err) {
      state.error = err.message;
      state.failed = state.total;
    }
    setBusy({ ...state, finished: true, added: Object.keys(urls).length });
  }

  async function useSynth(id) {
    if (!window.confirm('Go back to the synthesised sound for this murmur?')) return;
    try { await save({ [id]: null }); } catch (err) { setError(err.message); }
  }

  return (
    <div className="sma">
      <div className="sma-head">
        <h2>🩺 Murmurs sounds</h2>
        <span className="sma-total">{audio ? Object.keys(audio).length : '…'} recorded · {MURMURS.length} total</span>
        <label className={`ap-btn-sec ap-btn-sm sma-import${busy && !busy.finished ? ' is-busy' : ''}`} title="Load a murmur sound pack (.json)">
          📦 Import sound pack
          <input type="file" accept=".json,application/json" onChange={importPack} hidden disabled={Boolean(busy && !busy.finished)} />
        </label>
      </div>
      <p style={{ margin: '0 0 10px', opacity: 0.75, fontSize: 13 }}>
        A murmur with a recording plays it in the minigame; the rest use the built-in synthesised sound.
      </p>
      {error && <p className="sma-error">{error}</p>}
      {busy && (
        <div className={`sma-progress${busy.failed ? ' has-fail' : ''}`}>
          <b>{busy.finished ? 'Import finished' : 'Uploading sounds'}</b>
          <span className="sma-bar"><i style={{ width: `${(busy.done / Math.max(1, busy.total)) * 100}%` }} /></span>
          <small>
            {busy.done}/{busy.total}{busy.finished ? ` · ${busy.added} saved` : ''}
            {busy.failed ? ` · ${busy.failed} failed (${busy.error})` : ''}
          </small>
          {busy.finished && <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => setBusy(null)}>Close</button>}
        </div>
      )}
      {audio && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 6 }}>
          {MURMURS.map((m) => (
            <li key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: 180 }}>{m.answer}</span>
              {audio[m.id] ? (
                <>
                  <audio controls preload="none" src={audio[m.id]} style={{ height: 30 }} />
                  <button type="button" className="ap-btn-sec ap-btn-sm" onClick={() => useSynth(m.id)}>Use synthesised</button>
                </>
              ) : (
                <span style={{ opacity: 0.6, fontSize: 13 }}>Synthesised</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
