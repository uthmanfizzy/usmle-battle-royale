import { useCallback, useEffect, useState } from 'react';
import { getToken } from '../auth';
import { SERVER_URL } from '../serverUrl';
import { normalizeHighlightRow } from '../utils/explanationHighlights';

/**
 * Highlights and bold for one `questions` row, outside SoloGame: the same
 * explanation_highlights table and the same rules as UWorld Adventure.
 *
 *   stem ('question' region)     official only: an admin (password) or a
 *                                moderator in Developer Mode bolds, italicises
 *                                or colours it, and everyone sees it.
 *   explanation region           a signed-in student's own colours; in
 *                                Developer Mode the admin's are official and
 *                                may also be bold/italic.
 *
 * Developer Mode is the same switch SoloGame uses (localStorage
 * mr_dev_highlight_mode / mr_dev_mode_active), so turning it on in one place
 * turns it on in both. The server re-checks every write.
 */
export function useHighlightRights() {
  const [adminSession] = useState(() => { try { return localStorage.getItem('usmle_admin_session'); } catch { return null; } });
  const [isModerator, setIsModerator] = useState(false);
  const [devMode, setDevModeState] = useState(() => {
    try {
      return localStorage.getItem('mr_dev_mode_active') === '1' || localStorage.getItem('mr_dev_highlight_mode') === 'true';
    } catch { return false; }
  });
  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;
    let alive = true;
    fetch(`${SERVER_URL}/api/me/permissions`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive) setIsModerator(!!d?.moderator); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const setDevMode = (v) => {
    setDevModeState(v);
    try { localStorage.setItem('mr_dev_highlight_mode', String(v)); } catch { /* not remembered */ }
  };
  const isAdmin = !!adminSession || isModerator;
  return {
    adminSession,
    isAdmin,
    devMode,
    setDevMode,
    authoringOfficial: isAdmin && devMode,
    loggedIn: !!getToken(),
  };
}

export function useQuestionHighlights(qid, rights) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setRows([]);
    if (!qid) return undefined;
    let alive = true;
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(qid)}/highlights`, { headers })
      .then(r => (r.ok ? r.json() : { highlights: [] }))
      .then(d => { if (alive) setRows((d.highlights || []).map(normalizeHighlightRow)); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [qid]);

  const fail = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(''), 6000);
  }, []);

  const headersFor = useCallback((official) => {
    const h = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (official && rights.adminSession) h['x-admin-password'] = rights.adminSession;
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [rights.adminSession]);

  const create = useCallback((region, p) => {
    if (!qid) return;
    const isFormat = p.format != null;
    const official = isFormat || region === 'question' || rights.authoringOfficial;
    if (official && !rights.isAdmin) return;
    if (!official && !getToken()) return;
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setRows(rs => [...rs, {
      id: tmpId, start: p.start, end: p.end, color: p.color ?? null, format: p.format ?? null, region,
      quote: p.quote, prefix: p.prefix, suffix: p.suffix, created_at: new Date().toISOString(),
      scope: official ? 'official' : 'user',
    }]);
    const body = {
      start_offset: p.start, end_offset: p.end, region, scope: official ? 'official' : 'user',
      quote: p.quote, prefix: p.prefix, suffix: p.suffix,
    };
    if (isFormat) body.format = p.format; else body.color = p.color;
    fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(qid)}/highlights`, {
      method: 'POST', headers: headersFor(official), body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (r.ok) return r.json();
        let detail = `HTTP ${r.status}`;
        try { const e = await r.json(); detail = e.detail || e.error || detail; } catch { /* no body */ }
        fail(`Couldn’t save that — ${detail}`);
        return null;
      })
      .then(d => {
        if (d?.highlight) setRows(rs => rs.map(h => (h.id === tmpId ? normalizeHighlightRow(d.highlight) : h)));
        else setRows(rs => rs.filter(h => h.id !== tmpId));
      })
      .catch(() => {
        fail('Couldn’t save that — network error.');
        setRows(rs => rs.filter(h => h.id !== tmpId));
      });
  }, [qid, rights.authoringOfficial, rights.isAdmin, headersFor, fail]);

  // Remove what the selection touches. A row only partly covered is cut back
  // to the part outside the selection, so erasing two words of a long
  // highlight leaves the rest of it.
  const removeRange = useCallback((region, shown, visible, start, end) => {
    const token = getToken();
    const targets = shown.filter(h => h.start < end && h.end > start && !String(h.id).startsWith('tmp-')
      && ((h.scope === 'user' && token) || (h.scope === 'official' && rights.isAdmin)));
    if (!targets.length) return;
    const ids = targets.map(h => h.id);
    setRows(rs => rs.filter(h => !ids.includes(h.id)));
    targets.forEach(h => {
      fetch(`${SERVER_URL}/api/questions/${encodeURIComponent(qid)}/highlights/${encodeURIComponent(h.id)}`, {
        method: 'DELETE', headers: headersFor(h.scope === 'official'),
      }).catch(() => {});
      const keep = [];
      if (h.start < start) keep.push([h.start, start]);
      if (h.end > end) keep.push([end, h.end]);
      keep.forEach(([s, e]) => {
        const piece = { start: s, end: e, quote: visible.slice(s, e), prefix: visible.slice(Math.max(0, s - 30), s), suffix: visible.slice(e, e + 30) };
        if (h.format) piece.format = h.format; else piece.color = h.color;
        // Re-create as the same kind of row it was: create() picks the scope
        // from the current mode, so a leftover only comes back when that
        // matches (an official colour outside Developer Mode would otherwise
        // return as a private one).
        const wasOfficial = h.scope === 'official';
        const willBeOfficial = !!piece.format || region === 'question' || rights.authoringOfficial;
        if (wasOfficial !== willBeOfficial) return;
        create(region, piece);
      });
    });
  }, [qid, rights.isAdmin, rights.authoringOfficial, headersFor, create]);

  return { rows, create, removeRange, error };
}
