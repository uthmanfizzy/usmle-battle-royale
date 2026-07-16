import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { getToken } from '../auth';
import { JOURNEY_SUBJECTS, JOURNEY_SECTIONS } from '../journeySubjects';
import { parseShortUrl, embedUrlStatic } from '../utils/shortEmbeds';
import { getStarCount } from '../utils/journeyStars';
import './JourneyMode.css';

const SERVER = 'https://usmle-battle-royale-production.up.railway.app';
const ADMIN_KEY = 'usmle_admin_session';

// Admin-authenticated fetch — only ever used in editor mode (admin-only path).
function adminApi(path, options = {}) {
  return fetch(`${SERVER}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': localStorage.getItem(ADMIN_KEY) || '',
      ...(options.headers || {}),
    },
  });
}

// Decorative compass rose for the map corner
function CompassRose() {
  return (
    <svg className="jm-compass" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 4" />
      <polygon points="50,6 55,45 50,50 45,45" fill="currentColor" />
      <polygon points="50,94 55,55 50,50 45,55" fill="currentColor" opacity="0.5" />
      <polygon points="6,50 45,45 50,50 45,55" fill="currentColor" opacity="0.5" />
      <polygon points="94,50 55,45 50,50 55,55" fill="currentColor" opacity="0.5" />
      <polygon points="22,22 46,46 50,50 44,44" fill="currentColor" opacity="0.3" />
      <polygon points="78,22 54,46 50,50 56,44" fill="currentColor" opacity="0.3" />
      <polygon points="22,78 46,54 50,50 44,56" fill="currentColor" opacity="0.3" />
      <polygon points="78,78 54,54 50,50 56,56" fill="currentColor" opacity="0.3" />
      <text x="50" y="20" textAnchor="middle" fontSize="11" fill="currentColor">N</text>
    </svg>
  );
}

export default function JourneyMode({
  username, onBack, onPlayLevel, journeyReentry, onReentryConsumed,
  editorMode = false,
  // Visual builder (editor only): draft panels + drag/edit/delete callbacks.
  editorElements = null, onElementMove, onElementText, onElementDelete,
  previewSubjectId = null,
}) {
  const [view,        setView]        = useState('subjects'); // 'subjects' | 'chapters' | 'levels'
  const [chapterIdx,  setChapterIdx]  = useState(0);          // which chapter the 'levels' view shows
  const [subject,     setSubject]     = useState(null);       // entry from JOURNEY_SUBJECTS
  const [path,        setPath]        = useState(null);       // GET /api/journey/:subject response
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [authExpired, setAuthExpired] = useState(false);
  const [confirmNode,  setConfirmNode]  = useState(null); // { kind, name, questionCount, bestPct, completed, levelKey, questionsUrl }
  const [interstitial, setInterstitial] = useState(null); // null | { status: 'saving'|'complete'|'tryagain'|'save_failed', pct, threshold?, retryPayload? }
  const [bgUrl,       setBgUrl]       = useState(null);       // admin-set backdrop (landing-images slot 'journey_bg')
  const [activeIds,   setActiveIds]   = useState(null);       // Set of active subject ids; null = not loaded → show all

  // Admin-overridable UI text: { text_key: value }. Empty → every t() returns its default,
  // so with no overrides the page is byte-identical to the hardcoded version.
  const [overrides,   setOverrides]   = useState({});
  const [picker,      setPicker]      = useState(null);       // editor: inline editor target (text or chapter/level name)
  const [pickerBusy,  setPickerBusy]  = useState(false);
  const textDefaultsRef = useRef({});                         // text_key → default, recorded as t() renders
  const overridesRef    = useRef({});
  overridesRef.current  = overrides;

  // Custom panels: players fetch published ones; the editor passes its live draft.
  const [playerElements, setPlayerElements] = useState([]);
  const elements = editorMode ? (editorElements || []) : playerElements;
  const elementsLayerRef  = useRef(null);
  const dragRef           = useRef(null);
  const onElementMoveRef  = useRef(onElementMove);
  onElementMoveRef.current = onElementMove;

  // t(key, default): returns the admin override if present, else the original string.
  // Also records the default so the editor's "reset to default" can show/restore it.
  function t(key, def) {
    textDefaultsRef.current[key] = def;
    return Object.prototype.hasOwnProperty.call(overrides, key) ? overrides[key] : def;
  }
  // Edit-target attributes — only emitted in editor mode (normal render stays byte-identical).
  const ek = (key) => (editorMode ? { 'data-edit-key': key } : {});
  const en = (kind, id, label) =>
    (editorMode ? { 'data-edit-name': label, 'data-edit-kind': kind, 'data-edit-id': String(id) } : {});

  const frontierRef      = useRef(null);
  const lastPlayedRef    = useRef(null); // { subject, levelKey, questionsUrl, levelLabel } — survives reentry for TRY AGAIN
  const onReentryConsumedRef = useRef(onReentryConsumed);
  onReentryConsumedRef.current = onReentryConsumed;

  useEffect(() => {
    fetch(`${SERVER}/api/landing-images`)
      .then(r => r.json())
      .then(d => setBgUrl(d.images?.journey_bg || null))
      .catch(() => {}); // no backdrop → pure-parchment look
    fetch(`${SERVER}/api/game-settings`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.journeyActiveSubjects)) setActiveIds(new Set(d.journeyActiveSubjects)); })
      .catch(() => {}); // on error every subject stays visible
    fetch(`${SERVER}/api/ui-text?page=journey`)
      .then(r => r.json())
      .then(d => setOverrides(d && typeof d === 'object' && !Array.isArray(d) ? d : {}))
      .catch(() => {}); // no overrides → hardcoded defaults
  }, []);

  const isActive = (id) => !activeIds || activeIds.has(id);

  // Vivid admin backdrop with the parchment floating on top; absent → unchanged look
  const bgClass = bgUrl ? ' jm-screen--bg' : '';
  const bgLayer = bgUrl
    ? <div className="jm-bg" style={{ backgroundImage: `url(${bgUrl})` }} aria-hidden="true" />
    : null;

  // Reusable so J3c can re-enter the path with fresh unlock state
  const loadPath = useCallback(async (subj) => {
    setLoading(true);
    setError('');
    try {
      // Editor mode has no player token — build a faithful preview path from the
      // admin endpoints (same shape buildJourneyPath returns, minus progress).
      if (editorMode) {
        const data = await buildPreviewPath(subj.id);
        setPath(data);
        setSubject(subj);
        setView('chapters');
        setLoading(false);
        return data;
      }
      const res = await fetch(`${SERVER}/api/journey/${subj.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.status === 401) { setAuthExpired(true); setLoading(false); return null; }
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setPath(data);
      setSubject(subj);
      setView('chapters');
      setLoading(false);
      return data;
    } catch {
      setError('Could not load the journey. Check your connection.');
    }
    setLoading(false);
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode]);

  // ----- Editor mode: preview-path builder + click-to-edit -----
  // Mirrors buildJourneyPath's output from admin reads so the preview renders the
  // real map (all nodes unlocked, no progress). Only called in editor mode.
  async function buildPreviewPath(subjectId) {
    const chRes  = await adminApi(`/admin/journey-chapters?subject=${encodeURIComponent(subjectId)}`);
    const chData = await chRes.json();
    const chapterRows = chData.chapters || [];

    let counts = { levels: {}, chapters: {}, bosses: {} };
    try {
      const cRes = await adminApi(`/admin/journey-counts?subject=${encodeURIComponent(subjectId)}`);
      if (cRes.ok) counts = await cRes.json();
    } catch { /* counts are cosmetic in preview */ }

    const chapters = [];
    for (const ch of chapterRows) {
      const lvRes  = await adminApi(`/admin/journey-levels?chapter_id=${ch.id}`);
      const lvData = await lvRes.json();
      const members = lvData.levels || [];
      if (members.length === 0) continue; // empty chapters don't appear on the real path
      const levels = members.map(l => ({
        level_key: l.id,
        name: l.name,
        question_count: counts.levels?.[l.id] || 0,
        completed: false,
        best_score_pct: 0,
        unlocked: true,
        video_url: l.video_url || null,
      }));
      const bossKey = `chapter:${ch.id}`;
      chapters.push({
        chapter: { id: ch.id, name: ch.name },
        levels,
        boss: {
          boss_key: bossKey,
          level_key: `boss:${ch.id}`,
          question_count: counts.bosses?.[bossKey] || 0,
          completed: false,
          best_score_pct: 0,
          unlocked: true,
          auto_skipped: false,
        },
      });
    }

    return {
      subject: subjectId,
      threshold: 50,
      chapters,
      ultimate: {
        boss_key: 'ultimate',
        level_key: 'boss:ultimate',
        question_count: counts.bosses?.['ultimate'] || 0,
        completed: false,
        best_score_pct: 0,
        unlocked: true,
        auto_skipped: false,
      },
      mastery: false,
    };
  }

  // Delegated click handler on the editor root: routes a click on a tagged element
  // to the right inline editor (UI-text key vs chapter/level name).
  function handleEditorClick(e) {
    const nameEl = e.target.closest('[data-edit-name]');
    if (nameEl) {
      e.preventDefault();
      e.stopPropagation();
      setPicker({
        type:  'name',
        kind:  nameEl.getAttribute('data-edit-kind'),
        id:    nameEl.getAttribute('data-edit-id'),
        label: nameEl.getAttribute('data-edit-name'),
        value: nameEl.getAttribute('data-edit-name'),
      });
      return;
    }
    const keyEl = e.target.closest('[data-edit-key]');
    if (keyEl) {
      e.preventDefault();
      e.stopPropagation();
      const key = keyEl.getAttribute('data-edit-key');
      const has = Object.prototype.hasOwnProperty.call(overridesRef.current, key);
      setPicker({
        type:    'text',
        textKey: key,
        value:   has ? overridesRef.current[key] : (textDefaultsRef.current[key] ?? keyEl.textContent),
        def:     textDefaultsRef.current[key] ?? keyEl.textContent,
        hasOverride: has,
      });
    }
  }

  async function savePicker() {
    if (!picker) return;
    setPickerBusy(true);
    try {
      if (picker.type === 'text') {
        const res = await adminApi('/admin/ui-text', {
          method: 'PUT',
          body: JSON.stringify({ page: 'journey', text_key: picker.textKey, value: picker.value }),
        });
        if (!res.ok) throw new Error('save failed');
        setOverrides(o => ({ ...o, [picker.textKey]: picker.value }));
        setPicker(null);
      } else {
        const endpoint = picker.kind === 'chapter' ? 'journey-chapters' : 'journey-levels';
        const res = await adminApi(`/admin/${endpoint}/${picker.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: picker.value }),
        });
        if (!res.ok) throw new Error('save failed');
        setPicker(null);
        if (subject) await loadPath(subject); // refresh names live
      }
    } catch {
      alert('Save failed — check your admin session and try again.');
    }
    setPickerBusy(false);
  }

  async function resetPicker() {
    if (!picker || picker.type !== 'text') return;
    setPickerBusy(true);
    try {
      const res = await adminApi('/admin/ui-text', {
        method: 'DELETE',
        body: JSON.stringify({ page: 'journey', text_key: picker.textKey }),
      });
      if (!res.ok) throw new Error('reset failed');
      setOverrides(o => { const n = { ...o }; delete n[picker.textKey]; return n; });
      setPicker(null);
    } catch {
      alert('Reset failed — check your admin session and try again.');
    }
    setPickerBusy(false);
  }

  // Inline editor popover — rendered inside each editor-mode screen root.
  function renderEditorPicker() {
    if (!editorMode || !picker) return null;
    return (
      <div className="jm-edit-overlay" onClick={() => !pickerBusy && setPicker(null)}>
        <div className="jm-edit-card" onClick={e => e.stopPropagation()}>
          <div className="jm-edit-head">
            {picker.type === 'name'
              ? `Edit ${picker.kind} name`
              : `Edit text · ${picker.textKey}`}
          </div>
          <textarea
            className="jm-edit-input"
            value={picker.value}
            autoFocus
            rows={2}
            onChange={e => setPicker(p => ({ ...p, value: e.target.value }))}
          />
          {picker.type === 'text' && (
            <div className="jm-edit-default">Default: “{picker.def}”</div>
          )}
          <div className="jm-edit-actions">
            <button className="jm-edit-save" disabled={pickerBusy} onClick={savePicker}>
              {pickerBusy ? 'Saving…' : 'Save'}
            </button>
            {picker.type === 'text' && picker.hasOverride && (
              <button className="jm-edit-reset" disabled={pickerBusy} onClick={resetPicker}>
                Reset to default
              </button>
            )}
            <button className="jm-edit-cancel" disabled={pickerBusy} onClick={() => setPicker(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const editorRootProps = editorMode ? { onClick: handleEditorClick } : {};

  // ----- Custom panels: drag mechanics (editor only) -----
  // Window-level listeners so a drag continues even if the pointer leaves the panel.
  const onPanelPointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
    const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
    const x = Math.max(0, Math.min(100, d.startPosX + dx));
    const y = Math.max(0, Math.min(100, d.startPosY + dy));
    onElementMoveRef.current?.(d.id, x, y);
  }, []);
  const onPanelPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener('pointermove', onPanelPointerMove);
    window.removeEventListener('pointerup', onPanelPointerUp);
  }, [onPanelPointerMove]);
  const startPanelDrag = (e, el) => {
    const layer = elementsLayerRef.current;
    if (!layer) return;
    e.preventDefault();
    dragRef.current = {
      id: el.id ?? el._localId,
      startX: e.clientX, startY: e.clientY,
      startPosX: Number(el.pos_x) || 0, startPosY: Number(el.pos_y) || 0,
      rect: layer.getBoundingClientRect(),
    };
    window.addEventListener('pointermove', onPanelPointerMove);
    window.addEventListener('pointerup', onPanelPointerUp);
  };

  const renderPanel = (el) => {
    const id = el.id ?? el._localId;
    const style = { left: `${el.pos_x ?? 40}%`, top: `${el.pos_y ?? 40}%` };
    if (!editorMode) {
      return (
        <div key={id} className="jm-panel" style={style}>
          <div className="jm-panel-text">{el.text}</div>
        </div>
      );
    }
    return (
      <div key={id} className="jm-panel jm-panel--edit" style={style}>
        <div className="jm-panel-bar" onPointerDown={(e) => startPanelDrag(e, el)} title="Drag to move">
          <span className="jm-panel-grip" aria-hidden="true">⠿</span>
          <button
            className="jm-panel-del"
            title="Delete panel"
            onClick={() => onElementDelete?.(id)}
          >×</button>
        </div>
        <textarea
          className="jm-panel-input"
          value={el.text}
          placeholder="Panel text…"
          onChange={(e) => onElementText?.(id, e.target.value)}
        />
      </div>
    );
  };

  const renderElementsLayer = () => {
    // No layer at all when there's nothing to show and we're not editing →
    // player render stays byte-identical when a subject has no panels.
    if (!editorMode && elements.length === 0) return null;
    return (
      <div className={`jm-elements-layer${editorMode ? ' jm-elements-layer--edit' : ''}`} ref={elementsLayerRef}>
        {elements.map(renderPanel)}
      </div>
    );
  };

  // Auto-scroll to the frontier node (first unlocked, not-yet-completed) when
  // a chapter's level map renders and contains it
  useEffect(() => {
    if (view === 'levels' && path && frontierRef.current) {
      frontierRef.current.scrollIntoView({ block: 'center' });
    }
  }, [view, path, chapterIdx]);

  // Editor: jump straight to the requested subject's map so panels can be placed on it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!editorMode || !previewSubjectId) return;
    // Already previewing this subject (e.g. drilled into a level map in text
    // mode): snap back to the chapter list — panels only render there.
    if (subject && subject.id === previewSubjectId) { setView('chapters'); return; }
    const subj = JOURNEY_SUBJECTS.find(s => s.id === previewSubjectId);
    if (subj) loadPath(subj);
  }, [editorMode, previewSubjectId]);

  // Player: fetch published panels for the open subject. Editor uses its draft
  // instead. Panels render on the CHAPTER LIST view (see renderElementsLayer
  // call sites) — the closest analog to the old all-at-once map.
  useEffect(() => {
    if (editorMode) return;
    if (view !== 'chapters' || !subject) { setPlayerElements([]); return; }
    let cancelled = false;
    fetch(`${SERVER}/api/journey-elements?subject=${encodeURIComponent(subject.id)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setPlayerElements(Array.isArray(d.elements) ? d.elements : []); })
      .catch(() => { if (!cancelled) setPlayerElements([]); });
    return () => { cancelled = true; };
  }, [editorMode, view, subject]);

  // Re-entry after a journey game: POST completion, single source of truth for the refreshed path
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!journeyReentry) return;
    const reentry = journeyReentry; // local snapshot — App clears it on consume
    lastPlayedRef.current = {
      subject:     reentry.subject,
      levelKey:    reentry.levelKey,
      questionsUrl: reentry.questionsUrl,
      levelLabel:  reentry.levelLabel,
      wasMastery:  reentry.wasMastery,
    };
    onReentryConsumedRef.current();

    // Which chapter does the just-played node live in? (-1 = ultimate boss /
    // unknown → land on the chapter list, which is where the ultimate lives)
    const chapterIndexForKey = (pathData, levelKey) => {
      if (!levelKey || levelKey === 'boss:ultimate') return -1;
      return (pathData?.chapters || []).findIndex(c =>
        c.boss.level_key === levelKey || c.levels.some(l => l.level_key === levelKey));
    };
    const landOn = (pathData) => {
      const idx = chapterIndexForKey(pathData, reentry.levelKey);
      if (idx >= 0) { setChapterIdx(idx); setView('levels'); }
      else { setView('chapters'); }
    };

    if (reentry.pct === null) {
      // Quit mid-level: return to the same chapter's map, no POST
      loadPath(reentry.subject).then(data => { if (data) landOn(data); });
      return;
    }
    const pct = reentry.pct;
    setSubject(reentry.subject);
    landOn(path); // immediate best guess from the pre-play path (refined below)
    setInterstitial({ status: 'saving', pct });
    // POST is the single source of truth; loadPath only fires as fallback on POST failure
    fetch(`${SERVER}/api/journey/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ subject: reentry.subject.id, level_key: reentry.levelKey, score_pct: pct }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        // Full Mastery fires only when the Ultimate Boss was just beaten AND mastery
        // flipped false→true this run (wasMastery captured pre-play survives the unmount)
        const justMastered = reentry.levelKey === 'boss:ultimate' && data.mastery && !reentry.wasMastery;
        setPath(data);
        landOn(data); // re-derive against the fresh path (indexes could shift)
        setInterstitial({
          status: justMastered ? 'mastery' : (data.passed ? 'complete' : 'tryagain'),
          pct,
          threshold: data.threshold || 50,
        });
      })
      .catch(() => {
        // Save failed: reload last-known path so the map isn't blank, show retry banner
        loadPath(reentry.subject).then(data => { if (data) landOn(data); });
        setInterstitial({
          status: 'save_failed',
          pct,
          retryPayload: { subject: reentry.subject.id, level_key: reentry.levelKey, score_pct: pct },
        });
      });
  }, [journeyReentry]);

  const handleRetryPost = (payload) => {
    setInterstitial(prev => ({ ...prev, status: 'saving' }));
    fetch(`${SERVER}/api/journey/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(payload),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const justMastered = payload.level_key === 'boss:ultimate' && data.mastery && !lastPlayedRef.current?.wasMastery;
        setPath(data);
        setInterstitial({
          status: justMastered ? 'mastery' : (data.passed ? 'complete' : 'tryagain'),
          pct: payload.score_pct,
          threshold: data.threshold || 50,
        });
      })
      .catch(() => {
        setInterstitial(prev => ({ ...prev, status: 'save_failed' }));
      });
  };

  // ----- Guest gate: journey progress is per-account (editor mode bypasses it) -----
  if (!editorMode && (!getToken() || authExpired)) {
    return (
      <div className={`screen jm-screen${bgClass}`}>
        {bgLayer}
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">🚑</span>
          <h2 {...ek('gate.title')}>{t('gate.title', 'Sign in to begin your Journey')}</h2>
          <p {...ek('gate.subtitle')}>{t('gate.subtitle', 'Your progress through First Aid is saved to your account.')}</p>
          <button className="btn-start" onClick={onBack} {...ek('gate.back')}>{t('gate.back', '← Back')}</button>
        </div>
      </div>
    );
  }

  if (loading && !interstitial) {
    return (
      <div className={`screen jm-screen${bgClass}`}>
        {bgLayer}
        <div className="waiting-screen"><div className="spinner" /><p>{t('loading.text', 'Charting your journey…')}</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`screen jm-screen${bgClass}`}>
        {bgLayer}
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">🗺️</span>
          <h2 {...ek('error.title')}>{t('error.title', 'Lost the trail')}</h2>
          <p className="error-msg">{error}</p>
          {subject && <button className="btn-start" onClick={() => loadPath(subject)} {...ek('error.retry')}>{t('error.retry', 'Retry')}</button>}
          <button className="btn-secondary" onClick={() => { setError(''); setView('subjects'); }} {...ek('error.back')}>{t('error.back', '← Subjects')}</button>
        </div>
      </div>
    );
  }

  // ----- Subject select -----
  if (view === 'subjects') {
    return (
      <div className={`screen jm-screen${bgClass}${editorMode ? ' jm-editor' : ''}`} {...editorRootProps}>
        {bgLayer}
        <button className="jm-back-btn" onClick={onBack} {...ek('subjects.back')}>{t('subjects.back', '← Back')}</button>
        <div className="jm-banner">
          <span className="jm-banner-flourish">⚕ ─────── ⚕</span>
          <h1 className="jm-title" {...ek('subjects.title')}>{t('subjects.title', 'First Aid Journey')}</h1>
          <p className="jm-tagline" {...ek('subjects.tagline')}>{t('subjects.tagline', 'Choose a realm of medicine and chart your course')}</p>
        </div>
        <div className="jm-atlas">
          {JOURNEY_SECTIONS.map(sec => {
            const subjects = JOURNEY_SUBJECTS.filter(s => s.section === sec.id && isActive(s.id));
            return (
              <Fragment key={sec.id}>
                <div className="jm-section-header">
                  <span className="jm-section-fleur" aria-hidden="true">⚜</span>
                  <span className="jm-section-rule" aria-hidden="true" />
                  <h2 className="jm-section-title" {...ek(`section.${sec.id}`)}>{t(`section.${sec.id}`, sec.label)}</h2>
                  <span className="jm-section-rule" aria-hidden="true" />
                  <span className="jm-section-fleur" aria-hidden="true">⚜</span>
                </div>
                {subjects.length === 0 ? (
                  /* Mockup empty state for a fully admin-deactivated section
                     (previously the whole section silently vanished) */
                  <div className="jm-section-empty" {...ek(`section.${sec.id}.empty`)}>
                    {t(`section.${sec.id}.empty`, 'No subjects activated yet. Check back soon.')}
                  </div>
                ) : (
                  <div className="jm-subject-grid">
                    {subjects.map(s => (
                      <button key={s.id} className="jm-subject-card" onClick={() => loadPath(s)}>
                        <span className="jm-subject-icon">{s.icon}</span>
                        <span className="jm-subject-label">{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
        {renderEditorPicker()}
      </div>
    );
  }

  // ----- Pathway -----
  const threshold = path?.threshold || 50;
  const chapters  = path?.chapters || [];
  const ultimate  = path?.ultimate;

  // Empty path: no chapters authored (or journey tables not migrated) — friendly, not an error
  if (chapters.length === 0 && !interstitial) {
    return (
      <div className={`screen jm-screen${bgClass}${editorMode ? ' jm-editor' : ''}`} {...editorRootProps}>
        {bgLayer}
        <div className="jm-scroll-card">
          <span className="jm-scroll-icon">{subject?.icon || '🗺️'}</span>
          <h2>{subject?.label}</h2>
          <p {...ek('empty.text')}>{t('empty.text', "This journey hasn't been charted yet — check back soon.")}</p>
          <button className="btn-start" onClick={() => setView('subjects')} {...ek('empty.back')}>{t('empty.back', '← Subjects')}</button>
        </div>
        {renderEditorPicker()}
      </div>
    );
  }

  // Progress counter: levels + bosses that actually require play (auto-skipped bosses excluded)
  let totalNodes = 0, doneNodes = 0;
  for (const c of chapters) {
    totalNodes += c.levels.length;
    doneNodes  += c.levels.filter(l => l.completed).length;
    if (!c.boss.auto_skipped) { totalNodes += 1; if (c.boss.completed) doneNodes += 1; }
  }
  if (ultimate && !ultimate.auto_skipped) { totalNodes += 1; if (ultimate.completed) doneNodes += 1; }

  // The frontier = first node that is unlocked but not completed (for auto-scroll + pulse)
  const frontierKey = (() => {
    for (const c of chapters) {
      for (const l of c.levels) {
        if (l.unlocked && !l.completed && l.question_count > 0) return l.level_key;
      }
      if (c.boss.unlocked && !c.boss.completed && !c.boss.auto_skipped) return c.boss.level_key;
    }
    if (ultimate?.unlocked && !ultimate.completed && !ultimate.auto_skipped) return ultimate.level_key;
    return null;
  })();

  // Winding trail: nodes alternate left/right; a dashed hand-drawn segment leads into each node
  let slot = 0;
  let nodeCount = 0;
  const takeSide = () => (slot++ % 2 === 0 ? 'left' : 'right');

  // Connector segment leading INTO a node, colored by traversal state
  // (mockup: gold = passed, red = leads to the current node, dim = beyond)
  const trailSeg = (toSide, state = 'todo') => (
    <div className={`jm-trail-seg jm-trail-seg--${toSide} jm-trail-seg--${state}`} aria-hidden="true" />
  );

  const openConfirm = (node) => setConfirmNode(node);

  const renderLevelNode = (l, li) => {
    const side       = takeSide();
    const showSeg    = nodeCount > 0;
    nodeCount += 1;
    const empty      = l.question_count === 0;
    const isFrontier = l.level_key === frontierKey;
    const tappable   = l.unlocked && !empty;
    const stars      = l.completed ? getStarCount(l.best_score_pct) : 0;
    const cls = [
      'jm-node', 'jm-node--level',
      !l.unlocked ? 'jm-node--locked' : '',
      l.completed ? 'jm-node--done' : '',
      isFrontier ? 'jm-node--frontier' : '',
      empty ? 'jm-node--empty' : '',
    ].join(' ');
    const segState = l.completed ? 'done' : isFrontier ? 'current' : 'todo';
    return (
      <Fragment key={l.level_key}>
        {showSeg && trailSeg(side, segState)}
        <div className={`jm-node-row jm-node-row--${side}`} ref={isFrontier ? frontierRef : null}>
          <button
            className={cls}
            disabled={!tappable}
            onClick={editorMode ? undefined : () => openConfirm({
              kind: 'level', name: l.name, questionCount: l.question_count,
              bestPct: l.best_score_pct, completed: l.completed,
              levelKey: l.level_key,
              videoUrl: l.video_url || null,
              questionsUrl: `${SERVER}/api/journey-questions?level_id=${l.level_key}`,
            })}
          >
            <span className="jm-node-face">
              {!l.unlocked ? '🔒' : (li + 1)}
            </span>
            {l.completed && <span className="jm-node-badge" aria-hidden="true">✓</span>}
          </button>
          <div className="jm-node-caption">
            <span className="jm-node-name" {...en('level', l.level_key, l.name)}>{l.name}</span>
            {l.completed && <span className="jm-node-stars">{'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 3 - stars))}</span>}
            {empty && <span className="jm-node-tag" {...ek('tag.uncharted')}>{t('tag.uncharted', 'Uncharted')}</span>}
          </div>
        </div>
      </Fragment>
    );
  };

  const renderBossNode = (boss, label, big, labelKey) => {
    const side       = big ? 'center' : takeSide();
    const showSeg    = nodeCount > 0;
    nodeCount += 1;
    const isFrontier = boss.level_key === frontierKey;
    const tappable   = boss.unlocked && !boss.auto_skipped && boss.question_count > 0;
    const stars      = boss.completed ? getStarCount(boss.best_score_pct) : 0;
    const cls = [
      'jm-node', big ? 'jm-node--ultimate' : 'jm-node--boss',
      !boss.unlocked ? 'jm-node--locked' : '',
      boss.completed ? 'jm-node--done' : '',
      isFrontier ? 'jm-node--frontier' : '',
      boss.auto_skipped ? 'jm-node--skipped' : '',
    ].join(' ');
    const segState = (boss.completed || boss.auto_skipped) ? 'done' : isFrontier ? 'current' : 'todo';
    return (
      <Fragment key={boss.level_key}>
        {showSeg && trailSeg(side, segState)}
        <div className={`jm-node-row jm-node-row--${side}`} ref={isFrontier ? frontierRef : null}>
          <button
            className={cls}
            disabled={!tappable}
            onClick={editorMode ? undefined : () => openConfirm({
              kind: big ? 'ultimate' : 'boss', name: label, questionCount: boss.question_count,
              bestPct: boss.best_score_pct, completed: boss.completed,
              levelKey: boss.level_key,
              questionsUrl: `${SERVER}/api/boss-questions?subject=${subject?.id}&boss_key=${boss.boss_key}`,
            })}
          >
            <span className="jm-node-face">
              {boss.auto_skipped ? '💨' : !boss.unlocked ? '🔒' : big ? '👑' : '💀'}
            </span>
            {boss.completed && <span className="jm-node-badge" aria-hidden="true">✓</span>}
          </button>
          <div className="jm-node-caption">
            <span className="jm-node-name" {...(labelKey ? ek(labelKey) : {})}>{label}</span>
            {boss.auto_skipped && <span className="jm-node-tag" {...ek('tag.bypassed')}>{t('tag.bypassed', 'BYPASSED')}</span>}
            {boss.completed && <span className="jm-node-stars">{'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 3 - stars))}</span>}
          </div>
        </div>
      </Fragment>
    );
  };

  // Per-chapter progress stats (same computation the old inline banner used)
  const chapterStats = (c) => {
    const chTotal = c.levels.length + (c.boss.auto_skipped ? 0 : 1);
    const chDone  = c.levels.filter(l => l.completed).length
                  + (!c.boss.auto_skipped && c.boss.completed ? 1 : 0);
    return { chTotal, chDone, chComplete: chTotal > 0 && chDone === chTotal };
  };

  // Shared overlays (confirm / interstitial / celebration / editor picker),
  // rendered inside whichever of the two views below is active
  const overlays = (
    <>

      {confirmNode && (
        <div className="jm-confirm-overlay" onClick={() => setConfirmNode(null)}>
          <div className={`jm-confirm-card${confirmNode.videoUrl ? ' jm-confirm-card--video' : ''}`} onClick={e => e.stopPropagation()}>
            <span className="jm-confirm-seal" aria-hidden="true">⚕</span>
            <span className="jm-confirm-kind">
              {confirmNode.kind === 'ultimate' ? '👑 Ultimate Boss' : confirmNode.kind === 'boss' ? '💀 Chapter Boss' : '🎯 Level'}
            </span>
            <h3 className="jm-confirm-name">{confirmNode.name}</h3>
            <div className="jm-confirm-stats">
              <span>{confirmNode.questionCount} question{confirmNode.questionCount === 1 ? '' : 's'}</span>
              {confirmNode.bestPct > 0 && <span>Best: {confirmNode.bestPct}%</span>}
            </div>
            <p className="jm-confirm-threshold">Pass with ≥{threshold}% to unlock the next {confirmNode.kind === 'level' ? 'level' : 'stage'}</p>
            {confirmNode.videoUrl && (() => {
              const parsed = parseShortUrl(confirmNode.videoUrl);
              const src = parsed.error ? null : embedUrlStatic(parsed.platform, parsed.video_id);
              const vertical = parsed.platform === 'tiktok' || parsed.platform === 'instagram';
              return (
                <div className="jm-confirm-video">
                  <p className="jm-confirm-video-msg">📺 Recommended: watch this video before answering the questions.</p>
                  {src ? (
                    <div className={`jm-confirm-video-frame${vertical ? ' jm-confirm-video-frame--vertical' : ''}`}>
                      <iframe
                        src={src}
                        title="Recommended video"
                        frameBorder="0"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      className="jm-confirm-video-link"
                      href={confirmNode.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >▶ Open the recommended video</a>
                  )}
                </div>
              );
            })()}
            <button
              className="btn-start jm-confirm-play"
              onClick={() => {
                onPlayLevel({
                  subject,
                  levelKey:    confirmNode.levelKey,
                  questionsUrl: confirmNode.questionsUrl,
                  levelLabel:  confirmNode.name,
                  wasMastery:  !!path?.mastery, // pre-play snapshot → drives Full Mastery flip
                });
                setConfirmNode(null);
              }}
              {...ek('confirm.play')}
            >{t('confirm.play', '▶ PLAY')}</button>
            <button className="btn-secondary" onClick={() => setConfirmNode(null)} {...ek('confirm.cancel')}>{t('confirm.cancel', 'Cancel')}</button>
          </div>
        </div>
      )}

      {interstitial && (
        <div className="jm-interstitial-overlay">
          <div className="jm-interstitial-card">
            {interstitial.status === 'saving' && (
              <>
                <div className="spinner" />
                <p className="jm-interstitial-msg">{t('inter.saving', 'Saving progress…')}</p>
              </>
            )}
            {interstitial.status === 'complete' && (
              <>
                <span className="jm-interstitial-icon">⭐</span>
                <h2 className="jm-interstitial-heading" {...ek('inter.complete.title')}>{t('inter.complete.title', 'Level Complete!')}</h2>
                <p className="jm-interstitial-score">
                  {interstitial.pct}%{' '}
                  <span className="jm-interstitial-stars">
                    {'★'.repeat(getStarCount(interstitial.pct))}
                    {'☆'.repeat(Math.max(0, 3 - getStarCount(interstitial.pct)))}
                  </span>
                </p>
                <button className="btn-start" onClick={() => setInterstitial(null)} {...ek('inter.continue')}>{t('inter.continue', 'Continue')}</button>
              </>
            )}
            {interstitial.status === 'tryagain' && (
              <>
                <span className="jm-interstitial-icon">⚔</span>
                <h2 className="jm-interstitial-heading" {...ek('inter.tryagain.title')}>{t('inter.tryagain.title', 'Not quite…')}</h2>
                <p className="jm-interstitial-score">{interstitial.pct}% — need {interstitial.threshold}% to pass</p>
                <button
                  className="btn-start"
                  onClick={() => { setInterstitial(null); onPlayLevel(lastPlayedRef.current); }}
                  {...ek('inter.retry')}
                >{t('inter.retry', 'Retry Level')}</button>
                <button className="btn-secondary" onClick={() => setInterstitial(null)} {...ek('inter.backmap')}>{t('inter.backmap', 'Back to Map')}</button>
              </>
            )}
            {interstitial.status === 'save_failed' && (
              <>
                <span className="jm-interstitial-icon">⚠</span>
                <h2 className="jm-interstitial-heading" {...ek('inter.savefail.title')}>{t('inter.savefail.title', 'Score not saved')}</h2>
                <p className="jm-interstitial-score">{interstitial.pct}%</p>
                <p className="jm-interstitial-msg" {...ek('inter.savefail.msg')}>{t('inter.savefail.msg', 'Check your connection and try again.')}</p>
                <button className="btn-start" onClick={() => handleRetryPost(interstitial.retryPayload)} {...ek('inter.retrysave')}>{t('inter.retrysave', 'Retry Save')}</button>
                <button className="btn-secondary" onClick={() => setInterstitial(null)} {...ek('inter.dismiss')}>{t('inter.dismiss', 'Dismiss')}</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Full Mastery: full-screen celebration when the Ultimate Boss is first conquered */}
      {interstitial?.status === 'mastery' && (
        <div className="jm-celebration-overlay" role="dialog" aria-label="Full Mastery achieved">
          <div className="jm-confetti" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className={`jm-confetti-piece jm-confetti-piece--${i % 4}`} />
            ))}
          </div>
          <span className="jm-celebration-glow" aria-hidden="true" />
          <div className="jm-celebration-card">
            <span className="jm-celebration-rays" aria-hidden="true" />
            <span className="jm-celebration-trophy">🏆</span>
            <p className="jm-celebration-flourish" aria-hidden="true">⚕ ─────── ⚕</p>
            <h2 className="jm-celebration-heading" {...ek('celebrate.title')}>{t('celebrate.title', 'Full Mastery Achieved')}</h2>
            <p className="jm-celebration-subject">{subject?.icon} {subject?.label}</p>
            <p className="jm-celebration-score">Ultimate Boss defeated · {interstitial.pct}%</p>
            <button className="btn-start jm-celebration-btn" onClick={() => setInterstitial(null)} {...ek('celebrate.continue')}>{t('celebrate.continue', 'Continue')}</button>
          </div>
        </div>
      )}

      {renderEditorPicker()}
    </>
  );

  // ----- Chapter list ('chapters') — mockup chapter rows + Ultimate card -----
  if (view === 'chapters') {
    const ult = ultimate;
    const ultTappable = ult && ult.unlocked && !ult.auto_skipped && ult.question_count > 0;
    const ultStars = ult?.completed ? getStarCount(ult.best_score_pct) : 0;
    return (
      <div className={`screen jm-screen jm-screen--chapters${bgClass}${editorMode ? ' jm-editor' : ''}`} {...editorRootProps}>
        {bgLayer}
        <div className="jm-path-header">
          <button className="jm-back-btn" onClick={() => { setView('subjects'); setPath(null); setConfirmNode(null); }} {...ek('path.back')}>
            {t('path.back', '← Subjects')}
          </button>
          <span className="jm-path-subject">{subject?.icon} {subject?.label}</span>
          <span className="jm-path-progress">
            <span className="jm-progress-track" aria-hidden="true">
              <span
                className="jm-progress-fill"
                style={{ width: `${totalNodes ? Math.round((doneNodes / totalNodes) * 100) : 0}%` }}
              />
            </span>
            <span className="jm-progress-label">{doneNodes}/{totalNodes}</span>
          </span>
        </div>

        <div className="jm-chapters-scroll">
          <div className="jm-chapter-list">
            <p className="jm-chapters-tagline" {...ek('chapters.tagline')}>{t('chapters.tagline', 'Choose a chapter to begin.')}</p>
            {chapters.map((c, ci) => {
              const { chTotal, chDone, chComplete } = chapterStats(c);
              return (
                <button
                  key={c.chapter.id}
                  type="button"
                  className={`jm-chapter-row${chComplete ? ' jm-chapter-row--done' : ''}`}
                  onClick={(e) => {
                    // editor: clicking the chapter NAME opens the inline
                    // name editor (root handler) instead of navigating
                    if (editorMode && e.target.closest('[data-edit-name]')) return;
                    setChapterIdx(ci);
                    setView('levels');
                  }}
                >
                  <span className="jm-chapter-row-num">{ci + 1}</span>
                  <span className="jm-chapter-row-text">
                    <span className="jm-chapter-row-name" {...en('chapter', c.chapter.id, c.chapter.name)}>{c.chapter.name}</span>
                    <span className="jm-chapter-row-progress">
                      {c.levels.length} level{c.levels.length === 1 ? '' : 's'} · {chComplete ? '✓ Complete' : `${chDone}/${chTotal} completed`}
                    </span>
                  </span>
                  <span className="jm-chapter-row-arrow" aria-hidden="true">→</span>
                </button>
              );
            })}

            {/* Ultimate Boss + Mastery plaque: subject-level content that sits
                BEYOND all chapters (it gates on every chapter boss), so it
                lives here rather than inside any single chapter's map */}
            {ultimate && (
              <div className="jm-ultimate-card">
                <button
                  type="button"
                  className={`jm-ultimate-btn${ultimate.completed ? ' jm-ultimate-btn--done' : ''}${!ultimate.unlocked ? ' jm-ultimate-btn--locked' : ''}`}
                  disabled={!ultTappable}
                  onClick={editorMode ? undefined : () => openConfirm({
                    kind: 'ultimate', name: t('ultimate.label', 'ULTIMATE BOSS'),
                    questionCount: ultimate.question_count, bestPct: ultimate.best_score_pct,
                    completed: ultimate.completed, levelKey: ultimate.level_key,
                    questionsUrl: `${SERVER}/api/boss-questions?subject=${subject?.id}&boss_key=${ultimate.boss_key}`,
                  })}
                >
                  <span className="jm-ultimate-face">{ultimate.auto_skipped ? '💨' : !ultimate.unlocked ? '🔒' : '👑'}</span>
                  <span className="jm-ultimate-text">
                    <span className="jm-ultimate-name" {...ek('ultimate.label')}>{t('ultimate.label', 'ULTIMATE BOSS')}</span>
                    <span className="jm-ultimate-sub">
                      {!ultimate.unlocked
                        ? t('ultimate.locked', 'Clear every chapter boss to face it')
                        : ultimate.completed
                          ? <>Defeated {'★'.repeat(ultStars)}{'☆'.repeat(Math.max(0, 3 - ultStars))}</>
                          : t('ultimate.ready', 'The final trial awaits')}
                    </span>
                  </span>
                </button>
                <div className={`jm-mastery ${path?.mastery ? 'jm-mastery--earned' : ''}`}>
                  <span className="jm-mastery-icon">🏆</span>
                  <span className="jm-mastery-text" {...ek('mastery.title')}>{t('mastery.title', 'FULL MASTERY')}</span>
                  <span className="jm-mastery-sub">{path?.mastery ? `${subject?.label} conquered!` : t('mastery.sub.locked', 'Defeat the Ultimate Boss to claim it')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {renderElementsLayer()}
        {overlays}
      </div>
    );
  }

  // ----- Per-chapter level map ('levels') — mockup zig-zag path -----
  const curIdx   = Math.min(chapterIdx, chapters.length - 1);
  const current  = chapters[curIdx];
  const curStats = chapterStats(current);
  return (
    <div className={`screen jm-screen jm-screen--path${bgClass}${editorMode ? ' jm-editor' : ''}`} {...editorRootProps}>
      {bgLayer}
      <div className="jm-path-header">
        <button className="jm-back-btn" onClick={() => { setView('chapters'); setConfirmNode(null); }} {...ek('levels.back')}>
          {t('levels.back', '← Chapters')}
        </button>
        <span className="jm-path-subject">Chapter {curIdx + 1} · {current.chapter.name}</span>
        <span className="jm-path-progress">
          <span className="jm-progress-track" aria-hidden="true">
            <span
              className="jm-progress-fill"
              style={{ width: `${curStats.chTotal ? Math.round((curStats.chDone / curStats.chTotal) * 100) : 0}%` }}
            />
          </span>
          <span className="jm-progress-label">{curStats.chDone}/{curStats.chTotal}</span>
        </span>
      </div>

      <div className="jm-path-scroll">
        <div className="jm-map">
          <CompassRose />
          <div className="jm-path">
            {current.levels.map(renderLevelNode)}
            {renderBossNode(current.boss, `${current.chapter.name} ${t('boss.suffix', 'Boss')}`, false)}
          </div>
        </div>
      </div>

      {overlays}
    </div>
  );
}
