import React, { useState, useEffect, useRef } from 'react';
import './AdminApp.css';
import PlayPageAdmin from './admin/PlayPageAdmin';
import AnKingAdmin from './admin/AnKingAdmin';
import JourneyMode from './JourneyMode';
import QuestionParser from './QuestionParser';
import { parseRichText } from '../utils/parseRichText';
import { JOURNEY_SUBJECTS, JOURNEY_SECTIONS } from '../journeySubjects';

const API = 'https://usmle-battle-royale-production.up.railway.app';
const AUTH_KEY = 'usmle_admin_session';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const GAME_MODES = [
  { id: 'battle_royale',  label: 'Battle Royale',  icon: '⚔️', color: '#e74c3c' },
  { id: 'speed_race',     label: 'Speed Race',     icon: '⚡', color: '#3498db' },
  { id: 'trivia_pursuit', label: 'Trivia Pursuit', icon: '🎯', color: '#9b59b6' },
  { id: 'scan_master',    label: 'Scan Master',    icon: '🔬', color: '#00b894' },
  { id: 'tower',          label: 'The Tower',      icon: '🏰', color: '#f5c518' },
  { id: 'buzz_fun',       label: 'Buzz Fun',       icon: '⚡', color: '#e67e22' },
];

const TOWER_ZONE_LABELS = [
  'Zone 1 — Biochemistry',
  'Zone 2 — Microbiology',
  'Zone 3 — Pharmacology',
  'Zone 4 — Neurology',
  'Zone 5 — Cardiology',
  'Zone 6 — Biostatistics',
  'Zone 7 — Gastroenterology',
  'Zone 8 — Pulmonology',
  'Zone 9 — Reproductive',
  'Zone 10 — All Subjects',
];

function getTowerZone(floor) {
  const n = parseInt(floor);
  if (!n || n < 1 || n > 100) return '';
  return TOWER_ZONE_LABELS[Math.ceil(n / 10) - 1] || '';
}

const FOLDERS = [
  { id: 'all',              label: 'All Questions',                icon: '🏥', prefix: null,  special: false },
  { id: '__images__',       label: 'Image Questions',              icon: '🖼️', prefix: null,  special: true  },
  { id: 'buzz_fun',         label: 'Buzz Fun',                     icon: '⚡', prefix: 'BF',  special: true  },
  { id: 'scan_master',      label: 'Scan Master',                  icon: '🔬', prefix: 'SM',  special: true  },
  { id: 'cardiology',       label: 'Cardiology',                   icon: '❤️',  prefix: 'CA',  special: false },
  { id: 'neurology',        label: 'Neurology',                    icon: '🧠', prefix: 'NE',  special: false },
  { id: 'pharmacology',     label: 'Pharmacology',                 icon: '💊', prefix: 'PH',  special: false },
  { id: 'microbiology',     label: 'Microbiology',                 icon: '🦠', prefix: 'MI',  special: false },
  { id: 'biochemistry',     label: 'Biochemistry',                 icon: '⚗️', prefix: 'BC',  special: false },
  { id: 'biostatistics',    label: 'Biostatistics',                icon: '📊', prefix: 'BS',  special: false },
  // Coming soon
  { id: '__cs_sep__',       label: '',                             icon: '',   prefix: null,  special: true,  separator: true },
  { id: 'pulmonology',      label: 'Pulmonology',                  icon: '🫁', prefix: 'PL',  special: false, comingSoon: true },
  { id: 'nephrology',       label: 'Nephrology',                   icon: '💧', prefix: 'NP',  special: false, comingSoon: true },
  { id: 'gastroenterology', label: 'Gastroenterology',             icon: '🫃', prefix: 'GI',  special: false, comingSoon: true },
  { id: 'endocrinology',    label: 'Endocrinology',                icon: '🦋', prefix: 'EN',  special: false, comingSoon: true },
  { id: 'haematology',      label: 'Haematology',                  icon: '🩸', prefix: 'HM',  special: false, comingSoon: true },
  { id: 'haematology_oncology', label: 'Haematology & Oncology',   icon: '🩸', prefix: 'HO',  special: false, comingSoon: true },
  { id: 'immunology',       label: 'Immunology',                   icon: '🛡️', prefix: 'IM',  special: false, comingSoon: true },
  { id: 'musculoskeletal',  label: 'Musculoskeletal',              icon: '🦴', prefix: 'MS',  special: false, comingSoon: true },
  { id: 'dermatology',      label: 'Dermatology',                  icon: '🩹', prefix: 'DR',  special: false, comingSoon: true },
  { id: 'reproductive',     label: 'Reproductive & Obstetrics',    icon: '👶', prefix: 'OB',  special: false, comingSoon: true },
  { id: 'psychiatry',       label: 'Psychiatry & Behav. Science',  icon: '🧠', prefix: 'PS',  special: false, comingSoon: true },
  { id: 'ophthalmology',    label: 'Ophthalmology',                icon: '👁️', prefix: 'OP',  special: false, comingSoon: true },
  { id: 'ent',              label: 'ENT',                          icon: '👂', prefix: 'ET',  special: false, comingSoon: true },
  { id: 'genetics',         label: 'Genetics & Embryology',        icon: '🧬', prefix: 'GC',  special: false, comingSoon: true },
  { id: 'anatomy',          label: 'Anatomy',                      icon: '🫀', prefix: 'AN',  special: false, comingSoon: true },
];

const SUBJECTS = FOLDERS.filter(f => !f.special && f.id !== 'all').map(f => f.id);

const DEFAULT_TOWER_ZONES = [
  { name: 'The Basement',       desc: 'Deep beneath the hospital, the foundations of biochemistry echo through stone walls. Master the basics or be buried here forever.' },
  { name: 'The Laboratory',     desc: 'Culture plates and microscopes everywhere. Invisible enemies lurk in every petri dish. Identify them or be consumed.' },
  { name: 'The Ward',           desc: 'Medication carts line the hallways. Every drug interaction, every mechanism — your patients depend on your knowledge.' },
  { name: 'The Clinic',         desc: 'Neurological exams await. Reflex hammers and MRI films are scattered across darkened examination rooms.' },
  { name: 'The Cardio Unit',    desc: 'ECG tracings paper the walls. The rhythms of the heart are your language here. One misread and the case collapses.' },
  { name: 'The Research Floor', desc: 'Whiteboards covered in p-values and confidence intervals. The numbers tell the truth — if you know how to read them.' },
  { name: 'The GI Tract',            desc: 'The gut is more complex than it appears. Motility disorders, inflammatory conditions, and neoplasms hide behind everyday symptoms.' },
  { name: 'The Lungs',               desc: 'Breath by breath, the pulmonary floor tests your knowledge of obstruction, restriction, infection and beyond. Every wheeze has a reason.' },
  { name: 'The Reproductive System', desc: 'Obstetrics and reproductive medicine collide at the upper floors. From conception to complications — nothing here is straightforward.' },
  { name: 'The Summit',         desc: 'The final ten floors. Boss encounters on every level. Only legends reach the top.' },
];

function apiCall(path, options = {}) {
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': localStorage.getItem(AUTH_KEY) || '',
      ...(options.headers || {}),
    },
  });
}

// ── Login ──────────────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        localStorage.setItem(AUTH_KEY, password);
        onLogin();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setError('Could not reach server. Check your connection.');
    }
    setLoading(false);
  }

  return (
    <div className="al-page">
      <div className="al-card">
        <div className="al-logo">⚕️</div>
        <h1 className="al-title">USMLE Admin</h1>
        <p className="al-sub">Enter the admin password to access the control panel</p>
        <form onSubmit={handleSubmit} className="al-form">
          <div className="al-input-wrap">
            <input
              className="al-input"
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
            />
            <button type="button" className="al-toggle" onClick={() => setShow(s => !s)}>
              {show ? '🙈' : '👁️'}
            </button>
          </div>
          {error && <div className="al-error">{error}</div>}
          <button className="al-submit" type="submit" disabled={loading || !password}>
            {loading ? 'Verifying…' : 'Login →'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Stats ──────────────────────────────────────────────────────────────────────

function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiCall('/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Failed to load stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ap-loading">Loading stats…</div>;
  if (error) return <div className="ap-error">{error}</div>;

  const categories = Object.entries(stats.questionsByCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="ap-stats">
      <div className="ap-hero-cards">
        <div className="ap-hero-card">
          <div className="ap-hero-val">{stats.totalQuestions}</div>
          <div className="ap-hero-lbl">Total Questions</div>
        </div>
        <div className="ap-hero-card">
          <div className="ap-hero-val">{stats.totalGamesPlayed}</div>
          <div className="ap-hero-lbl">Games Played</div>
        </div>
        <div className="ap-hero-card">
          <div className="ap-hero-val">{stats.totalPlayersRegistered}</div>
          <div className="ap-hero-lbl">Players Registered</div>
        </div>
      </div>
      <h3 className="ap-section-title">Questions by Category</h3>
      <div className="ap-cat-grid">
        {categories.map(([cat, count]) => {
          const folder = FOLDERS.find(f => f.id === cat);
          return (
            <div key={cat} className="ap-cat-card">
              <div className="ap-cat-icon">{folder?.icon || '📁'}</div>
              <div className="ap-cat-count">{count}</div>
              <div className={`ap-cat-name ap-subj-${cat}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </div>
              <div className="ap-cat-bar-wrap">
                <div className="ap-cat-bar" style={{ width: `${Math.round((count / stats.totalQuestions) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Question Form Modal ────────────────────────────────────────────────────────

function QuestionModal({ question, defaultSubject = 'cardiology', onSave, onClose, topics = [], defaultTopicId = '', defaultDifficulty = 'easy' }) {
  const isEdit = !!question;
  const defaultSubjectResolved = (defaultSubject === 'all' || defaultSubject === '__images__') ? 'cardiology' : defaultSubject;

  const [form, setForm] = useState(() => question ? {
    subject:      question.subject,
    difficulty:   question.difficulty || 'easy',
    question:     question.question,
    optionA:      question.options[0] || '',
    optionB:      question.options[1] || '',
    optionC:      question.options[2] || '',
    optionD:      question.options[3] || '',
    optionE:      question.options[4] || '',
    optionF:      question.options[5] || '',
    optionG:      question.options[6] || '',
    optionH:      question.options[7] || '',
    correct:      question.correct,
    explanation:  question.explanation,
    why_others_wrong: question.why_others_wrong || '',
    image_url:    question.image_url || '',
    explanation_image_url: question.explanation_image_url || '',
    questionType: question.image_url ? 'image' : 'text',
    game_modes:   question.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit'],
    tower_floor:  question.tower_floor || '',
    buzz_type:    question.buzz_type || 'BUZZWORD',
    topic_id:     question.topic_id || '',
  } : {
    subject:      defaultSubjectResolved,
    difficulty:   defaultDifficulty,
    question:     '',
    optionA:      '',
    optionB:      '',
    optionC:      '',
    optionD:      '',
    optionE:      '',
    optionF:      '',
    optionG:      '',
    optionH:      '',
    correct:      'A',
    explanation:  '',
    why_others_wrong: '',
    image_url:    '',
    explanation_image_url: '',
    questionType: 'text',
    game_modes:   ['battle_royale', 'speed_race', 'trivia_pursuit'],
    tower_floor:  '',
    buzz_type:    'BUZZWORD',
    topic_id:     defaultTopicId,
  });

  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');
  // Explanation image upload uses its own busy/error state so the two controls
  // never spin or error over each other.
  const [expUploading,   setExpUploading]   = useState(false);
  const [expUploadError, setExpUploadError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  // Generalized: uploads to the shared question-image bucket and writes the URL
  // into `field` (defaults to image_url so existing call sites are unchanged).
  async function handleImageFile(e, field = 'image_url', setBusy = setUploading, setErr = setUploadError) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setErr('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr('Image must be under 5MB.');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res  = await apiCall('/admin/upload-image', {
        method: 'POST',
        body:   JSON.stringify({ base64, filename: file.name, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      set(field, data.url);
    } catch (err) {
      setErr(err.message);
    }
    setBusy(false);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      subject:     form.subject,
      difficulty:  form.difficulty,
      question:    form.question.trim(),
      options:     [
        form.optionA.trim(),
        form.optionB.trim(),
        form.optionC.trim(),
        form.optionD.trim(),
        form.optionE.trim(),
        form.optionF.trim(),
        form.optionG.trim(),
        form.optionH.trim()
      ].filter(opt => opt !== ''),
      correct:     form.correct,
      explanation: form.explanation.trim(),
      why_others_wrong: form.why_others_wrong ? form.why_others_wrong.trim() : null,
      image_url:   form.questionType === 'image' ? form.image_url : '',
      explanation_image_url: form.explanation_image_url || null,
      game_modes:  form.game_modes,
      tower_floor: form.game_modes.includes('tower') && form.tower_floor !== '' ? parseInt(form.tower_floor) : null,
      buzz_type:   form.game_modes.includes('buzz_fun') ? form.buzz_type : undefined,
      topic_id:    form.topic_id || null,
    };
    try {
      const res = isEdit
        ? await apiCall(`/admin/questions/${question.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiCall('/admin/questions', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const folderForSubject = FOLDERS.find(f => f.id === form.subject);
  const nextIdPreview    = isEdit ? question.id : `${folderForSubject?.prefix || '??'}-###`;

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal">
        <div className="ap-modal-head">
          <h2>{isEdit ? `Edit Question · ${question.id}` : `New Question · ${nextIdPreview}`}</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">

          {/* Question Type Toggle */}
          <div className="ap-field">
            <label>Question Type</label>
            <div className="ap-type-toggle">
              <button
                type="button"
                className={`ap-type-btn ${form.questionType === 'text' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, questionType: 'text', game_modes: f.game_modes.filter(m => m !== 'scan_master').length > 0 ? f.game_modes.filter(m => m !== 'scan_master') : ['battle_royale', 'speed_race', 'trivia_pursuit'] }))}
              >
                📝 Text Question
              </button>
              <button
                type="button"
                className={`ap-type-btn ${form.questionType === 'image' ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, questionType: 'image' }))}
              >
                🖼️ Image Question
              </button>
            </div>
          </div>

          <div className="ap-row-3">
            <div className="ap-field">
              <label>Subject</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                <optgroup label="Active Subjects">
                  {SUBJECTS.filter(s => !FOLDERS.find(f => f.id === s)?.comingSoon).map(s => {
                    const f = FOLDERS.find(fl => fl.id === s);
                    return <option key={s} value={s}>{f?.icon} {f?.label || s}</option>;
                  })}
                </optgroup>
                <optgroup label="Coming Soon">
                  {SUBJECTS.filter(s => FOLDERS.find(f => f.id === s)?.comingSoon).map(s => {
                    const f = FOLDERS.find(fl => fl.id === s);
                    return <option key={s} value={s}>{f?.icon} {f?.label || s} (Coming Soon)</option>;
                  })}
                </optgroup>
              </select>
            </div>
            <div className="ap-field">
              <label>Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                <option value="easy">Easy</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="ap-field">
              <label>Correct Answer</label>
              <select value={form.correct} onChange={e => set('correct', e.target.value)}>
                {LETTERS.map((l, idx) => {
                  const hasValue = form[`option${l}`] && form[`option${l}`].trim() !== '';
                  const isRequired = idx < 4;
                  if (!hasValue && !isRequired) return null;
                  const optionText = form[`option${l}`] ? form[`option${l}`].substring(0, 40) : '';
                  const displayText = optionText ? `${l} — ${optionText}${form[`option${l}`].length > 40 ? '...' : ''}` : l;
                  return <option key={l} value={l}>{displayText}</option>;
                }).filter(Boolean)}
              </select>
            </div>
          </div>

          {topics.length > 0 && (
            <div className="ap-field">
              <label>Topic <span className="ap-field-opt">(optional)</span></label>
              <select value={form.topic_id} onChange={e => set('topic_id', e.target.value)}>
                <option value="">— Unassigned —</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Image upload section */}
          {form.questionType === 'image' && (
            <div className="ap-field ap-image-field">
              <label>Medical Image</label>
              {form.image_url ? (
                <div className="ap-image-preview-wrap">
                  <img src={form.image_url} alt="Preview" className="ap-image-preview" />
                  <div className="ap-image-preview-actions">
                    <label className="ap-btn-sec ap-file-label">
                      🔄 Replace Image
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} style={{ display: 'none' }} />
                    </label>
                    <button type="button" className="ap-btn-danger ap-btn-sm" onClick={() => set('image_url', '')}>Remove</button>
                  </div>
                </div>
              ) : (
                <label className={`ap-image-upload-zone ${uploading ? 'uploading' : ''}`}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} style={{ display: 'none' }} disabled={uploading} />
                  {uploading ? (
                    <><div className="ap-upload-spinner" /><span>Uploading…</span></>
                  ) : (
                    <><span className="ap-upload-icon">📤</span><span>Click to upload image</span><span className="ap-upload-hint">JPG, PNG, WEBP · max 5MB</span></>
                  )}
                </label>
              )}
              {uploadError && <div className="ap-error ap-upload-error">{uploadError}</div>}
              {form.questionType === 'image' && !form.image_url && !uploading && (
                <div className="ap-image-url-alt">
                  <label style={{ marginBottom: 4 }}>Or paste image URL directly:</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={e => set('image_url', e.target.value)}
                    placeholder="https://…"
                    className="ap-input-plain"
                  />
                </div>
              )}
            </div>
          )}

          <div className="ap-field">
            <label>Question Text</label>
            <textarea
              value={form.question}
              onChange={e => set('question', e.target.value)}
              rows={4}
              placeholder="Enter the full question / clinical vignette…"
              required
            />
          </div>

          <div className="ap-options-grid">
            {LETTERS.map((l, idx) => {
              const isRequired = idx < 4;
              const hasValue = form[`option${l}`] && form[`option${l}`].trim() !== '';
              const showField = isRequired || hasValue || (idx > 0 && form[`option${LETTERS[idx - 1]}`] && form[`option${LETTERS[idx - 1]}`].trim() !== '');

              if (!showField) return null;

              return (
                <div key={l} className="ap-field">
                  <label>
                    <span className={`ap-letter ${l === form.correct ? 'ap-letter-correct' : 'ap-letter-plain'}`}>{l}</span>
                    {' '}Answer {l}
                    {!isRequired && ' '}
                    {!isRequired && <span style={{color:'rgba(255,255,255,0.3)', fontSize:'11px'}}>(optional)</span>}
                  </label>
                  <input
                    type="text"
                    value={form[`option${l}`]}
                    onChange={e => set(`option${l}`, e.target.value)}
                    placeholder={`Answer choice ${l}`}
                    required={isRequired}
                  />
                </div>
              );
            })}
          </div>

          <div className="ap-field">
            <label>Explanation</label>
            <textarea
              value={form.explanation}
              onChange={e => set('explanation', e.target.value)}
              rows={3}
              placeholder="Explain why the correct answer is correct…"
              required
            />
            <div className="rich-text-guide">
              <p>Formatting: <code>**bold**</code> | <code>*italic*</code> | <code>__underline__</code> | <code>[red]text[/red]</code> | <code>[blue]text[/blue]</code> | <code>[green]text[/green]</code> | <code>[gold]text[/gold]</code> | <code>[orange]text[/orange]</code> | <code>[purple]text[/purple]</code></p>
            </div>
            {form.explanation && (
              <div className="explanation-preview">
                <p className="explanation-preview-label">Preview:</p>
                <div className="explanation-rich explanation-preview-box">
                  {parseRichText(form.explanation)}
                </div>
              </div>
            )}
          </div>

          {/* Explanation image (independent of question type) — shown at reveal time */}
          <div className="ap-field ap-image-field">
            <label>Explanation Image <span className="ap-field-opt">(optional · shown when the answer is revealed)</span></label>
            {form.explanation_image_url ? (
              <div className="ap-image-preview-wrap">
                <img src={form.explanation_image_url} alt="Explanation preview" className="ap-image-preview" />
                <div className="ap-image-preview-actions">
                  <label className="ap-btn-sec ap-file-label">
                    🔄 Replace Image
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleImageFile(e, 'explanation_image_url', setExpUploading, setExpUploadError)} style={{ display: 'none' }} />
                  </label>
                  <button type="button" className="ap-btn-danger ap-btn-sm" onClick={() => set('explanation_image_url', '')}>Remove</button>
                </div>
              </div>
            ) : (
              <label className={`ap-image-upload-zone ${expUploading ? 'uploading' : ''}`}>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => handleImageFile(e, 'explanation_image_url', setExpUploading, setExpUploadError)} style={{ display: 'none' }} disabled={expUploading} />
                {expUploading ? (
                  <><div className="ap-upload-spinner" /><span>Uploading…</span></>
                ) : (
                  <><span className="ap-upload-icon">📤</span><span>Click to upload explanation image</span><span className="ap-upload-hint">JPG, PNG, WEBP · max 5MB</span></>
                )}
              </label>
            )}
            {expUploadError && <div className="ap-error ap-upload-error">{expUploadError}</div>}
            {!form.explanation_image_url && !expUploading && (
              <div className="ap-image-url-alt">
                <label style={{ marginBottom: 4 }}>Or paste image URL directly:</label>
                <input
                  type="url"
                  value={form.explanation_image_url}
                  onChange={e => set('explanation_image_url', e.target.value)}
                  placeholder="https://…"
                  className="ap-input-plain"
                />
              </div>
            )}
          </div>

          <div className="ap-field">
            <label>Why Are Other Options Wrong? <span style={{color:'rgba(255,255,255,0.3)', fontSize:'11px'}}>(optional)</span></label>
            <textarea
              className="ap-textarea"
              rows={4}
              placeholder="Explain why each incorrect option is wrong..."
              value={form.why_others_wrong || ''}
              onChange={e => set('why_others_wrong', e.target.value)}
            />
            {form.why_others_wrong && (
              <div className="explanation-preview">
                <p className="explanation-preview-label">Preview:</p>
                <div className="explanation-rich explanation-preview-box">
                  {parseRichText(form.why_others_wrong)}
                </div>
              </div>
            )}
            <div className="rich-text-guide">
              <p>Supports: <code>**bold**</code> | <code>*italic*</code> | <code>[red]text[/red]</code> | <code>[green]text[/green]</code> | <code>[gold]text[/gold]</code></p>
            </div>
          </div>

          <div className="ap-field">
            <label>Game Modes <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
            <div className="ap-gm-grid">
              {GAME_MODES.map(gm => {
                const isChecked = form.game_modes.includes(gm.id);
                return (
                  <label
                    key={gm.id}
                    className={`ap-gm-item${isChecked ? ' checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={e => {
                        const modes = e.target.checked
                          ? [...form.game_modes, gm.id]
                          : form.game_modes.filter(m => m !== gm.id);
                        if (modes.length > 0) set('game_modes', modes);
                      }}
                    />
                    <span className="ap-gm-icon">{gm.icon}</span>
                    <span className="ap-gm-label">{gm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {form.game_modes.includes('buzz_fun') && (
            <div className="ap-field">
              <label>Buzz Type <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
              <select value={form.buzz_type} onChange={e => set('buzz_type', e.target.value)}>
                <option value="BUZZWORD">BUZZWORD — single pathognomonic term</option>
                <option value="TRIAD">TRIAD — classic 3-symptom triad</option>
                <option value="ASSOCIATION">ASSOCIATION — HY clinical association</option>
                <option value="SIDE_EFFECT">SIDE EFFECT — drug side effect</option>
              </select>
            </div>
          )}

          {form.game_modes.includes('tower') && (
            <div className="ap-field ap-tower-floor-field">
              <label>Tower Floor <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
              <div className="ap-tower-floor-row">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.tower_floor}
                  onChange={e => set('tower_floor', e.target.value)}
                  placeholder="1 – 100"
                  className="ap-input-plain ap-tower-floor-input"
                />
                {form.tower_floor !== '' && (
                  <span className="ap-tower-zone-tag">
                    📍 {getTowerZone(form.tower_floor)}
                  </span>
                )}
              </div>
              <div className="ap-srow-desc" style={{ marginTop: 4 }}>
                Assign this question to a specific tower floor (1–100). Zone auto-fills based on the floor number.
              </div>
            </div>
          )}

          {error && <div className="ap-error">{error}</div>}

          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving || uploading}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ questionId, onConfirm, onCancel }) {
  return (
    <div className="ap-backdrop" onClick={onCancel}>
      <div className="ap-confirm" onClick={e => e.stopPropagation()}>
        <div className="ap-confirm-icon">🗑️</div>
        <h3>Delete {questionId}?</h3>
        <p>This action cannot be undone.</p>
        <div className="ap-modal-foot">
          <button className="ap-btn-sec" onClick={onCancel}>Cancel</button>
          <button className="ap-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Topic Modal ────────────────────────────────────────────────────────────────

function TopicModal({ topic, onSave, onClose, error }) {
  const isEdit = !!topic;
  const [name,   setName]   = useState(topic?.name || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  }

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-confirm ap-topic-modal">
        <div className="ap-modal-head">
          <h2>{isEdit ? '✏️ Rename Topic' : '📁 Create New Topic'}</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">
          <div className="ap-field">
            <label>Topic Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Heart Failure, Arrhythmias…"
              maxLength={100}
              autoFocus
            />
          </div>
          {error && <div className="ap-error">{error}</div>}
          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Rename' : 'Create Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Group Modal ────────────────────────────────────────────────────────────────

function GroupModal({ group, parentName, promote, onSave, onClose, error }) {
  const isEdit = !!group;
  const isSub  = !isEdit && !!parentName; // creating a sub-folder under parentName
  const [name,   setName]   = useState(group?.name || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  }

  const heading = isEdit ? '✏️ Rename Group' : isSub ? '📂 New Sub-folder' : '🗂️ Create New Group';

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-confirm ap-topic-modal">
        <div className="ap-modal-head">
          <h2>{heading}</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">
          {isSub && (
            <p className="ap-modal-sub">
              Inside <strong>{parentName}</strong>
              {promote && <span className="ap-modal-note"> — “{parentName}” becomes a folder; its existing topic &amp; questions stay inside it.</span>}
            </p>
          )}
          <div className="ap-field">
            <label>{isSub ? 'Sub-folder Name' : 'Group Name'}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Cardiology, Renal & Endocrine…"
              maxLength={100}
              autoFocus
            />
          </div>
          {error && <div className="ap-error">{error}</div>}
          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Rename' : isSub ? 'Create Sub-folder' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bulk Import Modal ──────────────────────────────────────────────────────────

function BulkImportModal({ activeFolder, selectedTopic, selectedDifficulty, onImport, onClose }) {
  const curFolder   = FOLDERS.find(f => f.id === activeFolder);
  const isCatLevel  = curFolder && !curFolder.special && !curFolder.separator && activeFolder !== 'all';
  const isInTopic   = selectedTopic && selectedTopic !== 'unassigned';

  const [file,        setFile]        = useState(null);
  const [fileErr,     setFileErr]     = useState('');
  const [parsedCount, setParsedCount] = useState(null);
  const [parsedData,  setParsedData]  = useState(null);
  const [dragging,    setDragging]    = useState(false);
  const [importing,   setImporting]   = useState(false);

  const dropRef   = useRef(null);
  const inputRef  = useRef(null);

  async function processFile(f) {
    setFileErr('');
    setParsedCount(null);
    setParsedData(null);
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith('.json') && f.type !== 'application/json') {
      setFileErr('Please upload a JSON file only');
      return;
    }
    setFile(f);
    try {
      const text   = await f.text();
      const parsed = JSON.parse(text);
      const arr    = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(arr)) throw new Error('JSON must be an array or { questions: [...] }');
      setParsedCount(arr.length);
      setParsedData(arr);
    } catch (err) {
      setFileErr(err.message);
      setFile(null);
    }
  }

  function handleDragOver(e)  { e.preventDefault(); setDragging(true); }
  function handleDragLeave(e) { if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false); }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }
  function handleFileInput(e) {
    processFile(e.target.files[0] || null);
    e.target.value = '';
  }
  function clearFile() {
    setFile(null); setParsedCount(null); setParsedData(null); setFileErr('');
  }

  async function handleImport() {
    if (!parsedData) return;
    setImporting(true);
    const topicId = isInTopic ? selectedTopic.id : null;
    // Pass category from activeFolder and difficulty from selectedDifficulty
    const importCategory = isCatLevel ? activeFolder : null;
    const importDifficulty = selectedDifficulty || 'easy';
    try {
      const res  = await apiCall('/admin/questions/bulk', {
        method: 'POST',
        body:   JSON.stringify({
          questions: parsedData,
          topic_id: topicId,
          category: importCategory,
          difficulty: importDifficulty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      // Show skip details if any
      if (data.skippedDetails && data.skippedDetails.length > 0) {
        console.log('[BulkImport] Skipped questions:', data.skippedDetails);
      }
      onImport(data, isInTopic ? selectedTopic : null);
    } catch (err) {
      setFileErr(err.message);
      setImporting(false);
    }
  }

  function fmtSize(bytes) {
    if (bytes < 1024)              return `${bytes} B`;
    if (bytes < 1024 * 1024)       return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  let ctxText, ctxClass;
  if (isInTopic) {
    ctxText  = `Questions will be imported into: ${curFolder?.label} › ${selectedTopic.name}`;
    ctxClass = 'bim-ctx-topic';
  } else if (isCatLevel) {
    ctxText  = `Questions will be imported as Unassigned in ${curFolder?.label}`;
    ctxClass = 'bim-ctx-cat';
  } else {
    ctxText  = 'Questions will be imported as Unassigned';
    ctxClass = 'bim-ctx-top';
  }

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal bim-modal">
        <div className="ap-modal-head">
          <h2>📥 Bulk Import Questions</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>

        <div className={`bim-context ${ctxClass}`}>
          <span className="bim-ctx-icon">{isInTopic ? '📁' : isCatLevel ? '📂' : '📋'}</span>
          <span>{ctxText}</span>
        </div>

        {!file ? (
          <div
            ref={dropRef}
            className={`bim-dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <div className="bim-dz-icon">{dragging ? '📂' : '📄'}</div>
            <div className="bim-dz-primary">Drag and drop your JSON file here</div>
            <div className="bim-dz-secondary">or click to browse files</div>
            <div className="bim-dz-hint">.json files only</div>
          </div>
        ) : (
          <div className="bim-file-selected">
            <div className="bim-fs-info">
              <span className="bim-fs-check">✓</span>
              <div className="bim-fs-details">
                <span className="bim-fs-name">{file.name}</span>
                <span className="bim-fs-size">{fmtSize(file.size)}</span>
              </div>
            </div>
            <button className="bim-fs-remove" title="Remove file" onClick={clearFile}>✕</button>
          </div>
        )}

        {parsedCount !== null && (
          <div className="bim-preview">
            <span className="bim-preview-icon">🔍</span>
            <span><strong>{parsedCount}</strong> question{parsedCount !== 1 ? 's' : ''} detected in file</span>
          </div>
        )}

        {fileErr && <div className="ap-error" style={{ marginTop: 8 }}>{fileErr}</div>}

        <div className="ap-modal-foot">
          <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="ap-btn-pri"
            disabled={!parsedData || importing}
            onClick={handleImport}
          >
            {importing
              ? 'Importing…'
              : parsedCount !== null
              ? `Import ${parsedCount} Question${parsedCount !== 1 ? 's' : ''}`
              : 'Import Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Questions Panel ────────────────────────────────────────────────────────────

function QuestionsPanel({ subjects = [] }) {
  // ─── Data ────────────────────────────────────────────────────────────────────
  const [questions,     setQuestions]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState(null);

  // ─── Navigation ──────────────────────────────────────────────────────────────
  const [activeFolder,       setActiveFolder]       = useState('all');
  const [view,               setView]               = useState('questions'); // 'difficulty' | 'topics' | 'questions'
  const [selectedTopic,      setSelectedTopic]      = useState(null);        // topic obj | 'unassigned' | null
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);        // null | 'easy' | 'hard'

  // ─── Topics ──────────────────────────────────────────────────────────────────
  const [topics,        setTopics]        = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicModal,    setTopicModal]    = useState(null);  // null | 'create' | topic obj
  const [delTopic,      setDelTopic]      = useState(null);
  const [topicErr,      setTopicErr]      = useState('');

  // ─── Topic groups ────────────────────────────────────────────────────────────
  const [groups,      setGroups]      = useState([]);
  const [groupModal,  setGroupModal]  = useState(null);  // null | 'create' | group obj
  const [delGroup,    setDelGroup]    = useState(null);
  const [dragTopicId, setDragTopicId] = useState(null);
  const [dropTarget,  setDropTarget]  = useState(null);  // group id | 'ungrouped' | null
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const toggleGroup = (id) => setCollapsedGroups(c => ({ ...c, [id]: !c[id] }));

  // ─── Question UI ─────────────────────────────────────────────────────────────
  const [modal,          setModal]          = useState(null);
  const [deleteId,       setDeleteId]       = useState(null);
  const [bulkMsg,        setBulkMsg]        = useState('');
  const [gameModeFilter, setGameModeFilter] = useState('all');
  const [search,         setSearch]         = useState('');

  // ─── Bulk Assign ─────────────────────────────────────────────────────────────
  const [selectedBulk,    setSelectedBulk]    = useState(new Set());
  const [bulkTargetTopic, setBulkTargetTopic] = useState('');
  const [bulkAssigning,   setBulkAssigning]   = useState(false);
  const [showBulkMoveDropdown, setShowBulkMoveDropdown] = useState(false);

  // ─── Import Modal ─────────────────────────────────────────────────────────────
  const [importModal, setImportModal] = useState(false);

  // ─── Question Parser ──────────────────────────────────────────────────────────
  const [showParser, setShowParser] = useState(false);

  // ─── Anki Import ──────────────────────────────────────────────────────────────
  const [ankiFile, setAnkiFile] = useState(null);
  const [ankiImporting, setAnkiImporting] = useState(false);
  const [ankiResult, setAnkiResult] = useState(null);
  const [ankiPreview, setAnkiPreview] = useState(null);
  const [ankiPreviewing, setAnkiPreviewing] = useState(false);

  const isCatFolder = (id) => {
    const f = FOLDERS.find(x => x.id === id);
    return f && !f.special && !f.separator && id !== 'all';
  };

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => {
    if (isCatFolder(activeFolder)) {
      setView('difficulty');
      setSelectedDifficulty(null);
      setSelectedTopic(null);
      setTopics([]);
      setGroups([]);
    } else {
      setView('questions');
      setSelectedDifficulty(null);
      setSelectedTopic(null);
      setTopics([]);
      setGroups([]);
    }
    setSearch('');
    setGameModeFilter('all');
    setSelectedBulk(new Set());
    setTopicErr('');
  }, [activeFolder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadQuestions() {
    setLoading(true);
    setLoadError(null);
    try {
      const res  = await apiCall('/admin/questions');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`);
      const qs = Array.isArray(data.questions) ? data.questions : [];
      console.log(`[QM] loadQuestions: ${qs.length} questions loaded`);
      setQuestions(qs);
    } catch (err) {
      console.error('[QM] loadQuestions failed:', err);
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTopics(category, difficulty) {
    setTopicsLoading(true);
    try {
      let url = `/admin/topics?category=${encodeURIComponent(category)}`;
      if (difficulty) url += `&difficulty=${encodeURIComponent(difficulty)}`;
      const res  = await apiCall(url);
      const data = await res.json();
      setTopics(data.topics || []);
      setGroups(data.groups || []);
    } finally { setTopicsLoading(false); }
  }

  // ─── Topic CRUD ───────────────────────────────────────────────────────────────
  async function handleSaveTopic(name) {
    setTopicErr('');
    const isEdit = topicModal && topicModal !== 'create';
    try {
      const res  = isEdit
        ? await apiCall(`/admin/topics/${topicModal.id}`, { method: 'PUT', body: JSON.stringify({ name }) })
        : await apiCall('/admin/topics', { method: 'POST', body: JSON.stringify({ name, category: activeFolder, difficulty: selectedDifficulty || 'easy' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save topic');
      if (isEdit) {
        setTopics(ts => ts.map(t => t.id === topicModal.id ? { ...t, ...data } : t));
        if (selectedTopic && selectedTopic !== 'unassigned' && selectedTopic.id === topicModal.id) {
          setSelectedTopic(prev => ({ ...prev, name: data.name }));
        }
      } else {
        setTopics(ts => [...ts, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setTopicModal(null);
    } catch (err) { setTopicErr(err.message); }
  }

  async function handleDeleteTopic() {
    setTopicErr('');
    try {
      const res  = await apiCall(`/admin/topics/${delTopic.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete topic');
      setTopics(ts => ts.filter(t => t.id !== delTopic.id));
      setDelTopic(null);
    } catch (err) { setTopicErr(err.message); setDelTopic(null); }
  }

  // ─── Topic group CRUD ─────────────────────────────────────────────────────────
  // groupModal shapes:
  //   'create'                                  → new top-level group
  //   { create, parentId }                      → new sub-folder under an existing group
  //   { create, promoteTopicId, parentName }    → promote a topic into a same-named folder,
  //                                                then create a sub-folder inside it
  //   groupObj                                  → rename existing group
  async function handleSaveGroup(name) {
    setTopicErr('');
    const gm       = groupModal;
    const isCreate = gm === 'create' || !!gm?.create;
    const isEdit   = !isCreate;
    try {
      if (isEdit) {
        const res  = await apiCall(`/admin/topic-groups/${gm.id}`, { method: 'PUT', body: JSON.stringify({ name }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save group');
        setGroups(gs => gs.map(g => g.id === gm.id ? { ...g, ...data } : g));
        setGroupModal(null);
        return;
      }

      let parentId = gm?.parentId || null;

      // Promote a leaf topic into a same-named top-level folder first (non-destructive:
      // the topic and all its questions simply move inside the new group).
      if (gm?.promoteTopicId) {
        const pRes  = await apiCall('/admin/topic-groups', { method: 'POST', body: JSON.stringify({ name: gm.parentName, category: activeFolder, difficulty: selectedDifficulty || 'easy' }) });
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData.error || 'Failed to create folder');
        const mvRes  = await apiCall(`/admin/topics/${gm.promoteTopicId}`, { method: 'PUT', body: JSON.stringify({ group_id: pData.id }) });
        const mvData = await mvRes.json();
        if (!mvRes.ok) throw new Error(mvData.error || 'Failed to move topic into folder');
        setGroups(gs => [...gs, pData].sort((a, b) => a.name.localeCompare(b.name)));
        setTopics(ts => ts.map(t => t.id === gm.promoteTopicId ? { ...t, group_id: pData.id } : t));
        parentId = pData.id;
      }

      // Create the (sub-)folder
      const res  = await apiCall('/admin/topic-groups', { method: 'POST', body: JSON.stringify({ name, category: activeFolder, difficulty: selectedDifficulty || 'easy', parent_group_id: parentId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save group');
      setGroups(gs => [...gs, data].sort((a, b) => a.name.localeCompare(b.name)));
      setGroupModal(null);
    } catch (err) { setTopicErr(err.message); }
  }

  async function handleDeleteGroup() {
    setTopicErr('');
    try {
      const res  = await apiCall(`/admin/topic-groups/${delGroup.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete group');
      // Server releases members via ON DELETE SET NULL — mirror that locally
      setTopics(ts => ts.map(t => t.group_id === delGroup.id ? { ...t, group_id: null } : t));
      // Server promotes any sub-folders to top-level — mirror that so they don't vanish
      setGroups(gs => gs
        .filter(g => g.id !== delGroup.id)
        .map(g => g.parent_group_id === delGroup.id ? { ...g, parent_group_id: null } : g));
      setDelGroup(null);
    } catch (err) { setTopicErr(err.message); setDelGroup(null); }
  }

  // ─── Drag-and-drop: assign topic to group (groupId null = ungroup) ───────────
  async function handleMoveTopic(topicId, groupId) {
    const topic = topics.find(t => t.id === topicId);
    if (!topic || (topic.group_id || null) === (groupId || null)) return;
    setTopicErr('');
    const prevGroupId = topic.group_id || null;
    setTopics(ts => ts.map(t => t.id === topicId ? { ...t, group_id: groupId } : t));
    try {
      const res  = await apiCall(`/admin/topics/${topicId}`, { method: 'PUT', body: JSON.stringify({ group_id: groupId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to move topic');
    } catch (err) {
      setTopics(ts => ts.map(t => t.id === topicId ? { ...t, group_id: prevGroupId } : t));
      setTopicErr(err.message);
    }
  }

  function dropZoneProps(targetId) {
    const groupId = targetId === 'ungrouped' ? null : targetId;
    return {
      // stopPropagation so a drop on a nested sub-folder zone doesn't also bubble up
      // and re-assign the topic to the parent group.
      onDragOver:  e => { e.preventDefault(); e.stopPropagation(); setDropTarget(targetId); },
      onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(cur => cur === targetId ? null : cur); },
      onDrop:      e => {
        e.preventDefault();
        e.stopPropagation();
        const topicId = e.dataTransfer.getData('text/plain');
        if (topicId) handleMoveTopic(topicId, groupId);
        setDropTarget(null);
        setDragTopicId(null);
      },
    };
  }

  // Identical markup/handlers to the original topic card — only drag attributes added
  const renderTopicCard = (t) => (
    <div
      key={t.id}
      className={`ap-topic-card ap-tc-${activeFolder} ${dragTopicId === t.id ? 'ap-card-dragging' : ''}`}
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; setDragTopicId(t.id); }}
      onDragEnd={() => { setDragTopicId(null); setDropTarget(null); }}
    >
      <button
        className="ap-topic-card-body"
        onClick={() => { setSelectedTopic(t); setView('questions'); setSearch(''); setGameModeFilter('all'); }}
      >
        <span className="ap-topic-card-icon">📁</span>
        <span className="ap-topic-card-name">{t.name}</span>
        <span className="ap-topic-card-count">{t.question_count} question{t.question_count !== 1 ? 's' : ''}</span>
      </button>
      <div className="ap-topic-card-actions">
        {!t.group_id && (
          <button
            className="ap-add-subfolder-btn ap-topic-subfolder-btn"
            onClick={() => { setTopicErr(''); setGroupModal({ create: true, promoteTopicId: t.id, parentName: t.name }); }}
            title={`Turn "${t.name}" into a folder and add a sub-folder inside it`}
          >📂 + Sub-folder</button>
        )}
        <button
          className="ap-topic-edit-btn"
          onClick={() => { setTopicErr(''); setTopicModal(t); }}
          title="Rename"
        >✏️</button>
        <button
          className="ap-topic-del-btn"
          onClick={() => t.question_count === 0 && setDelTopic(t)}
          title={t.question_count > 0 ? `${t.question_count} question(s) assigned — move them first` : 'Delete'}
          disabled={t.question_count > 0}
        >🗑️</button>
      </div>
    </div>
  );

  // ─── Question CRUD ────────────────────────────────────────────────────────────
  async function handleDelete() {
    await apiCall(`/admin/questions/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    setQuestions(qs => qs.filter(q => String(q.id) !== String(deleteId)));
    setDeleteId(null);
  }

  function handleSaved(savedQ) {
    setQuestions(qs => {
      const idx = qs.findIndex(q => String(q.id) === String(savedQ.id));
      if (idx >= 0) { const copy = [...qs]; copy[idx] = savedQ; return copy; }
      return [...qs, savedQ];
    });
    setModal(null);
    if (isCatFolder(activeFolder)) loadTopics(activeFolder, selectedDifficulty);
  }

  // ─── Move question to topic ───────────────────────────────────────────────────
  async function handleMoveQuestion(questionId, newTopicId) {
    try {
      const res  = await apiCall(`/admin/questions/${encodeURIComponent(questionId)}`, {
        method: 'PUT', body: JSON.stringify({ topic_id: newTopicId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Move failed');
      setQuestions(qs => qs.map(q =>
        String(q.id) === String(questionId)
          ? { ...q, topic_id: newTopicId || undefined }
          : q
      ));
      loadTopics(activeFolder, selectedDifficulty);
    } catch (err) { alert(err.message); }
  }

  // ─── Bulk assign ─────────────────────────────────────────────────────────────
  async function handleBulkAssign() {
    if (selectedBulk.size === 0 || !bulkTargetTopic) return;
    setBulkAssigning(true);
    try {
      const res  = await apiCall('/admin/questions/bulk-assign-topic', {
        method: 'POST',
        body: JSON.stringify({ questionIds: [...selectedBulk], topicId: bulkTargetTopic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk assign failed');
      setQuestions(qs => qs.map(q =>
        selectedBulk.has(String(q.id)) ? { ...q, topic_id: bulkTargetTopic } : q
      ));
      setSelectedBulk(new Set()); setBulkTargetTopic('');
      loadTopics(activeFolder, selectedDifficulty);
    } catch (err) { alert(err.message); }
    setBulkAssigning(false);
  }

  // ─── Bulk Actions ────────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedBulk.size === filtered.length && filtered.length > 0) {
      setSelectedBulk(new Set());
    } else {
      setSelectedBulk(new Set(filtered.map(q => String(q.id))));
    }
  };

  async function handleBulkDelete() {
    if (selectedBulk.size === 0) return;
    if (!window.confirm(`Delete ${selectedBulk.size} question${selectedBulk.size !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    try {
      const res = await apiCall('/admin/questions/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedBulk] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk delete failed');
      loadQuestions();
      setSelectedBulk(new Set());
      if (isCatFolder(activeFolder)) loadTopics(activeFolder, selectedDifficulty);
    } catch(e) {
      alert('Delete error: ' + e.message);
    }
  }

  async function handleBulkMove(targetTopicId, targetSubject) {
    if (selectedBulk.size === 0) return;
    try {
      const res = await apiCall('/admin/questions/bulk-move', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedBulk], topicId: targetTopicId, subject: targetSubject })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk move failed');
      loadQuestions();
      setSelectedBulk(new Set());
      setShowBulkMoveDropdown(false);
      if (isCatFolder(activeFolder)) loadTopics(activeFolder, selectedDifficulty);
    } catch(e) {
      alert('Move error: ' + e.message);
    }
  }

  async function handleBulkDifficultyChange(difficulty) {
    if (selectedBulk.size === 0) return;
    try {
      const res = await apiCall('/admin/questions/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ ids: [...selectedBulk], updates: { difficulty } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk update failed');
      loadQuestions();
      setSelectedBulk(new Set());
      if (isCatFolder(activeFolder)) loadTopics(activeFolder, selectedDifficulty);
    } catch(e) {
      alert('Update error: ' + e.message);
    }
  }

  // ─── Import done callback ─────────────────────────────────────────────────────
  async function handleImportDone(data, topic) {
    const updatedNote = data.updated ? `, ${data.updated} updated` : '';
    const skippedNote = data.skipped ? `, ${data.skipped} skipped` : '';
    const topicNote   = topic ? ` into ${topic.name}` : '';

    // Log skip details to console for debugging
    if (data.skippedDetails && data.skippedDetails.length > 0) {
      console.log('[Import] Skipped questions:');
      data.skippedDetails.forEach(s => console.log(`  Q${s.index}: ${s.reason} - "${s.question}"`));
    }

    let msg = `✓ Added ${data.added}${updatedNote}${skippedNote}${topicNote}`;
    if (data.skippedDetails && data.skippedDetails.length > 0 && data.skippedDetails.length <= 3) {
      msg += ` | Skip reasons: ${data.skippedDetails.map(s => s.reason).join('; ')}`;
    }
    setBulkMsg(msg);
    await loadQuestions();
    if (isCatFolder(activeFolder)) loadTopics(activeFolder, selectedDifficulty);
    setImportModal(false);
  }

  // ─── Export Questions ─────────────────────────────────────────────────────────
  const handleExportQuestions = () => {
    try {
      // Get current filtered questions
      const questionsToExport = filtered;

      if (questionsToExport.length === 0) {
        alert('No questions to export in current view.');
        return;
      }

      // Format to match bulk import format exactly
      const exportData = questionsToExport.map(q => ({
        question: q.question,
        options: q.choices || q.options || [],
        correct: q.correct || q.answer,
        explanation: q.explanation || '',
        subject: q.category || q.subject || '',
        difficulty: q.difficulty || 'easy',
        game_modes: q.game_modes || [],
        image_url: q.image_url || null,
        topic_id: q.topic_id || null,
      }));

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions-export-${activeFolder || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBulkMsg(`✓ Exported ${exportData.length} question${exportData.length !== 1 ? 's' : ''}`);
      setTimeout(() => setBulkMsg(''), 3000);
    } catch(e) {
      console.error('Export error:', e);
      alert('Export failed: ' + e.message);
    }
  };

  // ─── Anki Import Handlers ────────────────────────────────────────────────────
  const handleAnkiPreview = async () => {
    if (!ankiFile) return;
    setAnkiPreviewing(true);
    setAnkiPreview(null);
    const formData = new FormData();
    formData.append('apkg', ankiFile);
    try {
      const res = await fetch(`${API}/api/admin/preview-anki`, {
        method: 'POST',
        body: formData,
        headers: { 'x-admin-password': localStorage.getItem(AUTH_KEY) || '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');
      setAnkiPreview(data);
    } catch(e) {
      setAnkiPreview({ error: e.message });
    }
    setAnkiPreviewing(false);
  };

  const handleAnkiImport = async () => {
    if (!ankiFile) return;
    if (!window.confirm(`Import all cards from ${ankiFile.name}? This may take several minutes for large decks.`)) return;
    setAnkiImporting(true);
    setAnkiResult(null);
    const formData = new FormData();
    formData.append('apkg', ankiFile);
    try {
      const res = await fetch(`${API}/api/admin/import-anki`, {
        method: 'POST',
        body: formData,
        headers: { 'x-admin-password': localStorage.getItem(AUTH_KEY) || '' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setAnkiResult(data);
      if (data.success && data.imported > 0) {
        await loadQuestions();
      }
    } catch(e) {
      setAnkiResult({ error: e.message });
    }
    setAnkiImporting(false);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const folderCounts = FOLDERS.reduce((acc, f) => {
    if (f.separator) {
      acc[f.id] = 0;
    } else if (f.id === 'all') {
      acc[f.id] = questions.length;
    } else if (f.id === '__images__') {
      acc[f.id] = questions.filter(q => q.image_url).length;
    } else if (f.id === 'buzz_fun') {
      acc[f.id] = questions.filter(q => (q.game_modes || []).includes('buzz_fun')).length;
    } else {
      // Use the EXACT same filter logic as catQuestions below
      acc[f.id] = questions.filter(q => {
        if (q.subject === f.id) return true;
        if (q.category === f.id) return true;
        if (q.category?.toLowerCase() === f.id?.toLowerCase()) return true;
        if (q.subject?.toLowerCase() === f.id?.toLowerCase()) return true;
        return false;
      }).length;
    }
    return acc;
  }, {});

  // Step 1 — category filter. 'all' always passes through every question.
  const catQuestions = activeFolder === 'all'        ? questions
    : activeFolder === '__images__'                  ? questions.filter(q => q.image_url)
    : activeFolder === 'buzz_fun'                    ? questions.filter(q => (q.game_modes || []).includes('buzz_fun'))
    : questions.filter(q => {
        // Match by subject or category field
        if (q.subject === activeFolder) return true;
        if (q.category === activeFolder) return true;
        // Case-insensitive fallback matching
        if (q.category?.toLowerCase() === activeFolder?.toLowerCase()) return true;
        if (q.subject?.toLowerCase() === activeFolder?.toLowerCase()) return true;
        return false;
      });

  // Counts for the difficulty cards
  const easyCount = isCatFolder(activeFolder)
    ? catQuestions.filter(q => (q.difficulty || 'easy') === 'easy').length : 0;
  const hardCount = isCatFolder(activeFolder)
    ? catQuestions.filter(q => q.difficulty === 'hard').length : 0;

  // Step 2 — difficulty filter. Only applies inside a catFolder when a difficulty is chosen.
  // Questions without a difficulty field are treated as 'easy' — never filtered out in easy mode.
  const diffFiltered = (selectedDifficulty && isCatFolder(activeFolder))
    ? catQuestions.filter(q => (q.difficulty || 'easy') === selectedDifficulty)
    : catQuestions;

  // Step 3 — topic filter.
  // 'unassigned' → questions where topic_id is absent/null/empty string.
  // topic object  → questions assigned to that topic.
  // null          → no filter, show all diffFiltered.
  const isUnassigned = (q) => q.topic_id == null || q.topic_id === '';
  const topicFiltered = selectedTopic === 'unassigned'
    ? diffFiltered.filter(isUnassigned)
    : (selectedTopic && typeof selectedTopic === 'object')
    ? diffFiltered.filter(q => q.topic_id === selectedTopic.id)
    : diffFiltered;

  // Step 4 — text search (defensive: guard against missing q.question)
  const searched = search.trim()
    ? topicFiltered.filter(q =>
        (q.question || '').toLowerCase().includes(search.toLowerCase()) ||
        String(q.id || '').toLowerCase().includes(search.toLowerCase())
      )
    : topicFiltered;

  // Step 5 — game-mode filter
  const filtered = gameModeFilter === 'all'
    ? searched
    : searched.filter(q => (q.game_modes || []).includes(gameModeFilter));

  // Diagnostic: log when questions exist but none are showing
  if (questions.length > 0 && filtered.length === 0 && view === 'questions') {
    console.log('[QM] 0 questions showing — chain:', {
      total: questions.length,
      catQ: catQuestions.length,
      step2_diff: diffFiltered.length,
      step3_topic: topicFiltered.length,
      step4_search: searched.length,
      step5_mode: filtered.length,
      folder: activeFolder,
      view,
      selectedDifficulty,
      selectedTopic: selectedTopic === 'unassigned' ? 'unassigned' : (selectedTopic?.id ?? null),
      gameModeFilter,
      search,
    });
  }

  const unassignedCount = isCatFolder(activeFolder)
    ? diffFiltered.filter(isUnassigned).length : 0;

  const curFolder = FOLDERS.find(f => f.id === activeFolder);

  if (loading) return <div className="ap-loading">Loading questions…</div>;
  if (loadError) return (
    <div className="ap-loading" style={{ flexDirection: 'column', gap: 12 }}>
      <span style={{ color: '#e74c3c' }}>Failed to load questions: {loadError}</span>
      <button className="ap-btn-pri" onClick={loadQuestions}>Retry</button>
    </div>
  );
  if (questions.length === 0) return (
    <div className="ap-loading" style={{ flexDirection: 'column', gap: 12 }}>
      <span>Server returned 0 questions.</span>
      <button className="ap-btn-pri" onClick={loadQuestions}>Reload</button>
    </div>
  );

  return (
    <div className="ap-questions">
      <div className="ap-qm-layout">

        {/* ── Folder Sidebar ───────────────────────────────────────── */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-title">Categories</div>

          {/* Active subjects */}
          {(() => {
            try {
              return FOLDERS.filter(f => {
                if (f.separator || f.special) return false;
                const folderSubject = Array.isArray(subjects) ? subjects.find(s =>
                  s.id === f.id || s.name?.toLowerCase() === f.id?.toLowerCase()
                ) : null;
                return folderSubject ? folderSubject.active : !f.comingSoon;
              }).map(f => (
                <button
                  key={f.id}
                  className={`ap-folder-btn ${activeFolder === f.id ? 'active' : ''} ${f.id !== 'all' ? `ap-folder-${f.id}` : 'ap-folder-all'}`}
                  onClick={() => setActiveFolder(f.id)}
                >
                  <span className="ap-folder-icon">{f.icon}</span>
                  <span className="ap-folder-label">{f.label}</span>
                  <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
                </button>
              ));
            } catch(e) {
              console.error('Active subjects render error:', e);
              return <div style={{color:'red', padding:'10px'}}>Error loading active subjects: {e.message}</div>;
            }
          })()}

          {/* Game Modes separator */}
          <div className="ap-sidebar-separator">Game Modes</div>

          {/* Game mode folders - special folders excluding __images__ */}
          {FOLDERS.filter(f => f.special && !f.separator && f.id !== '__images__').map(f => (
            <button
              key={f.id}
              className={`ap-folder-btn ap-folder-gamemode ${activeFolder === f.id ? 'active' : ''}`}
              onClick={() => setActiveFolder(f.id)}
            >
              <span className="ap-folder-icon">{f.icon}</span>
              <span className="ap-folder-label">{f.label}</span>
              <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
            </button>
          ))}

          {/* First Aid Journey — opens the new inline JourneyEditor in the main pane */}
          <button
            className={`ap-folder-btn ap-folder-gamemode ${activeFolder === '__journey__' ? 'active' : ''}`}
            onClick={() => setActiveFolder('__journey__')}
          >
            <span className="ap-folder-icon">🚑</span>
            <span className="ap-folder-label">First Aid Journey</span>
          </button>

          {/* Deactivated separator - renamed from Coming Soon */}
          <div className="ap-sidebar-separator">Deactivated</div>

          {/* Deactivated subjects */}
          {(() => {
            try {
              return FOLDERS.filter(f => {
                if (f.separator || f.special) return false;
                const folderSubject = Array.isArray(subjects) ? subjects.find(s =>
                  s.id === f.id || s.name?.toLowerCase() === f.id?.toLowerCase()
                ) : null;
                return folderSubject ? !folderSubject.active : f.comingSoon;
              }).map(f => (
                <button
                  key={f.id}
                  className={`ap-folder-btn ap-folder-cs ${activeFolder === f.id ? 'active' : ''} ${f.id !== 'all' ? `ap-folder-${f.id}` : 'ap-folder-all'}`}
                  onClick={() => setActiveFolder(f.id)}
                >
                  <span className="ap-folder-icon">{f.icon}</span>
                  <span className="ap-folder-label">{f.label}</span>
                  <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
                  <span className="ap-folder-cs-tag">Off</span>
                </button>
              ));
            } catch(e) {
              console.error('Deactivated subjects render error:', e);
              return <div style={{color:'red', padding:'10px'}}>Error loading deactivated subjects: {e.message}</div>;
            }
          })()}

        </aside>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="ap-qm-main">
          {/* First Aid Journey: the new clean inline editor (subject → chapters → levels → inline questions) */}
          {activeFolder === '__journey__' ? <JourneyEditor /> : (<>

          {/* ════ DIFFICULTY LEVEL ═══════════════════════════════════ */}
          {view === 'difficulty' && (
            <div className="ap-difficulty-level">
              <div className="ap-breadcrumb">
                <span className="ap-bc-item">Question Manager</span>
                <span className="ap-bc-sep">›</span>
                <span className="ap-bc-item ap-bc-cur">{curFolder?.icon} {curFolder?.label}</span>
              </div>

              <div className="ap-toolbar">
                <div className="ap-toolbar-left">
                  <div className="ap-folder-heading">
                    <span className="ap-fh-icon">{curFolder?.icon}</span>
                    <span className="ap-fh-name">{curFolder?.label}</span>
                    <span className="ap-fh-count">{folderCounts[activeFolder] || 0} questions total</span>
                  </div>
                </div>
              </div>

              <div className="ap-diff-cards">
                <button
                  className="ap-diff-card ap-diff-card-easy"
                  onClick={() => {
                    setSelectedDifficulty('easy');
                    setView('topics');
                    setSearch('');
                    setGameModeFilter('all');
                    loadTopics(activeFolder, 'easy');
                  }}
                >
                  <div className="ap-dc-icon">😊</div>
                  <div className="ap-dc-title">Easy Mode</div>
                  <div className="ap-dc-count">{easyCount} question{easyCount !== 1 ? 's' : ''}</div>
                  <div className="ap-dc-sub">Straightforward clinical presentations</div>
                </button>

                <button
                  className="ap-diff-card ap-diff-card-hard"
                  onClick={() => {
                    setSelectedDifficulty('hard');
                    setView('topics');
                    setSearch('');
                    setGameModeFilter('all');
                    loadTopics(activeFolder, 'hard');
                  }}
                >
                  {hardCount === 0 && <div className="ap-dc-coming-soon">Coming Soon</div>}
                  <div className="ap-dc-icon">💀</div>
                  <div className="ap-dc-title">Hard Mode</div>
                  <div className="ap-dc-count">{hardCount} question{hardCount !== 1 ? 's' : ''}</div>
                  <div className="ap-dc-sub">Tricky and complex scenarios</div>
                </button>
              </div>
            </div>
          )}

          {/* ════ TOPIC LEVEL ════════════════════════════════════════ */}
          {view === 'topics' && (
            <div className="ap-topic-level">
              <div className="ap-breadcrumb">
                <span className="ap-bc-item">Question Manager</span>
                <span className="ap-bc-sep">›</span>
                <span
                  className="ap-bc-item ap-bc-link"
                  onClick={() => { setView('difficulty'); setSelectedDifficulty(null); setSelectedTopic(null); setTopics([]); setGroups([]); setTopicErr(''); setSearch(''); setGameModeFilter('all'); }}
                >{curFolder?.icon} {curFolder?.label}</span>
                <span className="ap-bc-sep">›</span>
                <span className="ap-bc-item ap-bc-cur">
                  {selectedDifficulty === 'easy' ? '😊 Easy Mode' : '💀 Hard Mode'}
                </span>
              </div>

              <div className="ap-toolbar">
                <div className="ap-toolbar-left">
                  <button className="ap-btn-back" onClick={() => { setView('difficulty'); setSelectedDifficulty(null); setSelectedTopic(null); setTopics([]); setGroups([]); setTopicErr(''); setSearch(''); setGameModeFilter('all'); }}>
                    ← Back
                  </button>
                  <div className="ap-folder-heading">
                    <span className="ap-fh-icon">{selectedDifficulty === 'easy' ? '😊' : '💀'}</span>
                    <span className={`ap-fh-name ap-fh-diff-${selectedDifficulty}`}>
                      {selectedDifficulty === 'easy' ? 'Easy Mode' : 'Hard Mode'}
                    </span>
                    <span className="ap-fh-count">{topics.length} topic{topics.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="ap-toolbar-right">
                  {topicErr && <span className="ap-bulk-msg err">{topicErr}</span>}
                  <button className="ap-btn-sec" onClick={() => { setTopicErr(''); setGroupModal('create'); }}>
                    🗂️ New Group
                  </button>
                  <button className="ap-btn-pri" onClick={() => { setTopicErr(''); setTopicModal('create'); }}>
                    📁 New Topic
                  </button>
                </div>
              </div>

              {topicsLoading ? (
                <div className="ap-loading">Loading topics…</div>
              ) : topics.length === 0 && groups.length === 0 ? (
                <div className="ap-topic-empty">
                  <div className="ap-topic-empty-icon">📁</div>
                  <p>No topics yet for {curFolder?.label} {selectedDifficulty === 'hard' ? 'Hard Mode' : 'Easy Mode'}. Create one to get started.</p>
                  <button className="ap-btn-pri" onClick={() => { setTopicErr(''); setTopicModal('create'); }}>
                    📁 Create First Topic
                  </button>
                </div>
              ) : (
                <>
                  {groups.filter(g => !g.parent_group_id).map(g => {
                    const subGroups     = groups.filter(sg => sg.parent_group_id === g.id);
                    const directMembers = topics.filter(t => t.group_id === g.id);
                    const subMembers    = topics.filter(t => subGroups.some(sg => sg.id === t.group_id));
                    const allMembers    = directMembers.length + subMembers.length;
                    const qCount        = [...directMembers, ...subMembers].reduce((sum, t) => sum + (t.question_count || 0), 0);
                    return (
                      <div
                        key={g.id}
                        className={`ap-group-section ${dropTarget === g.id ? 'ap-drop-active' : ''}`}
                        {...dropZoneProps(g.id)}
                      >
                        <div className="ap-group-header">
                          <button
                            className="ap-group-chevron"
                            onClick={() => toggleGroup(g.id)}
                            title={collapsedGroups[g.id] ? 'Expand group' : 'Collapse group'}
                          >{collapsedGroups[g.id] ? '▸' : '▾'}</button>
                          <span className="ap-group-icon">🗂️</span>
                          <span className="ap-group-name">{g.name}</span>
                          <span className="ap-group-count">
                            {allMembers} topic{allMembers !== 1 ? 's' : ''}
                            {subGroups.length > 0 ? ` · ${subGroups.length} sub-folder${subGroups.length !== 1 ? 's' : ''}` : ''}
                            {' · '}{qCount} question{qCount !== 1 ? 's' : ''}
                          </span>
                          <div className="ap-group-actions">
                            <button
                              className="ap-add-subfolder-btn"
                              onClick={() => { setTopicErr(''); setGroupModal({ create: true, parentId: g.id, parentName: g.name }); }}
                              title={`Create a sub-folder inside ${g.name}`}
                            >📂 + Sub-folder</button>
                            <button
                              className="ap-topic-edit-btn"
                              onClick={() => { setTopicErr(''); setGroupModal(g); }}
                              title="Rename group"
                            >✏️</button>
                            <button
                              className="ap-topic-del-btn"
                              onClick={() => setDelGroup(g)}
                              title="Delete group (topics become ungrouped, sub-folders promoted)"
                            >🗑️</button>
                          </div>
                        </div>
                        {!collapsedGroups[g.id] && (
                          <>
                            {directMembers.length === 0 ? (
                              <div className="ap-group-empty-hint">
                                {subGroups.length === 0 ? 'Drag topics here' : 'Drag topics here, or into a sub-folder below'}
                              </div>
                            ) : (
                              <div className="ap-topic-grid">
                                {directMembers.map(renderTopicCard)}
                              </div>
                            )}
                            {subGroups.map(sg => {
                              const sgMembers = topics.filter(t => t.group_id === sg.id);
                              const sgQ = sgMembers.reduce((sum, t) => sum + (t.question_count || 0), 0);
                              return (
                                <div
                                  key={sg.id}
                                  className={`ap-subgroup-section ${dropTarget === sg.id ? 'ap-drop-active' : ''}`}
                                  {...dropZoneProps(sg.id)}
                                >
                                  <div className="ap-subgroup-header">
                                    <span className="ap-subgroup-icon">↳ 📂</span>
                                    <span className="ap-group-name">{sg.name}</span>
                                    <span className="ap-group-count">
                                      {sgMembers.length} topic{sgMembers.length !== 1 ? 's' : ''} · {sgQ} question{sgQ !== 1 ? 's' : ''}
                                    </span>
                                    <div className="ap-group-actions">
                                      <button
                                        className="ap-topic-edit-btn"
                                        onClick={() => { setTopicErr(''); setGroupModal(sg); }}
                                        title="Rename sub-folder"
                                      >✏️</button>
                                      <button
                                        className="ap-topic-del-btn"
                                        onClick={() => setDelGroup(sg)}
                                        title="Delete sub-folder (topics become ungrouped)"
                                      >🗑️</button>
                                    </div>
                                  </div>
                                  {sgMembers.length === 0 ? (
                                    <div className="ap-group-empty-hint">Drag topics here</div>
                                  ) : (
                                    <div className="ap-topic-grid">
                                      {sgMembers.map(renderTopicCard)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}

                  <div
                    className={`ap-ungrouped-zone ${dropTarget === 'ungrouped' ? 'ap-drop-active' : ''}`}
                    {...dropZoneProps('ungrouped')}
                  >
                    {groups.length > 0 && <div className="ap-ungrouped-label">Ungrouped topics</div>}
                    <div className="ap-topic-grid">
                      {topics.filter(t => !t.group_id).map(renderTopicCard)}
                    </div>
                  </div>
                </>
              )}

              <div className="ap-unassigned-row">
                <button
                  className="ap-unassigned-btn"
                  onClick={() => { setSelectedTopic('unassigned'); setView('questions'); setSearch(''); setGameModeFilter('all'); }}
                >
                  <span className="ap-unassigned-icon">📋</span>
                  <span className="ap-unassigned-label">Unassigned Questions</span>
                  <span className="ap-unassigned-count">{unassignedCount}</span>
                  <span className="ap-unassigned-arrow">→</span>
                </button>
              </div>
            </div>
          )}

          {/* ════ QUESTION LEVEL ═════════════════════════════════════ */}
          {view === 'questions' && (
            <>
              {isCatFolder(activeFolder) && (
                <div className="ap-breadcrumb">
                  <span className="ap-bc-item">Question Manager</span>
                  <span className="ap-bc-sep">›</span>
                  <span
                    className="ap-bc-item ap-bc-link"
                    onClick={() => { setView('difficulty'); setSelectedDifficulty(null); setSelectedTopic(null); setTopics([]); setGroups([]); setSearch(''); setGameModeFilter('all'); }}
                  >{curFolder?.icon} {curFolder?.label}</span>
                  <span className="ap-bc-sep">›</span>
                  <span
                    className="ap-bc-item ap-bc-link"
                    onClick={() => { setView('topics'); setSelectedTopic(null); setSearch(''); setGameModeFilter('all'); }}
                  >
                    {selectedDifficulty === 'easy' ? '😊 Easy Mode' : '💀 Hard Mode'}
                  </span>
                  <span className="ap-bc-sep">›</span>
                  <span className="ap-bc-item ap-bc-cur">
                    {selectedTopic === 'unassigned' ? '📋 Unassigned' : `📁 ${selectedTopic?.name}`}
                  </span>
                </div>
              )}

              {/* Anki Importer */}
              {activeFolder === 'all' && (
                <div className="anki-importer">
                  <h3>📦 Import Anki Deck (.apkg)</h3>
                  <p className="admin-help-text">Upload an .apkg file to bulk import cards into your questions database.</p>

                  <div className="anki-upload-row">
                    <label className="anki-file-label">
                      {ankiFile ? `📁 ${ankiFile.name} (${(ankiFile.size / 1024 / 1024).toFixed(1)}MB)` : '📁 Choose .apkg file'}
                      <input
                        type="file"
                        accept=".apkg"
                        style={{display:'none'}}
                        onChange={e => { setAnkiFile(e.target.files[0]); setAnkiPreview(null); setAnkiResult(null); }}
                      />
                    </label>
                    {ankiFile && (
                      <>
                        <button
                          className="ap-btn-sec"
                          onClick={handleAnkiPreview}
                          disabled={ankiPreviewing}
                        >
                          {ankiPreviewing ? 'Loading...' : '👁 Preview'}
                        </button>
                        <button
                          className="ap-btn-pri"
                          onClick={handleAnkiImport}
                          disabled={ankiImporting}
                        >
                          {ankiImporting ? '⏳ Importing... (may take minutes)' : '📥 Import All'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Preview */}
                  {ankiPreview && !ankiPreview.error && (
                    <div className="anki-preview">
                      <p className="anki-preview-stats">
                        📊 <strong>{ankiPreview.totalCards?.toLocaleString()}</strong> cards found
                        {ankiPreview.deckNames?.length > 0 && ` | Decks: ${ankiPreview.deckNames.slice(0,3).join(', ')}${ankiPreview.deckNames.length > 3 ? '...' : ''}`}
                      </p>
                      <p className="anki-preview-label">Sample cards:</p>
                      {ankiPreview.preview?.map((card, i) => (
                        <div className="anki-preview-card" key={i}>
                          <p className="anki-field-names">Fields: {card.fields?.join(' | ')}</p>
                          {card.values?.slice(0,2).map((val, j) => (
                            <p key={j} className="anki-field-value"><strong>{card.fields?.[j] || `Field ${j+1}`}:</strong> {val.substring(0,150)}{val.length > 150 ? '...' : ''}</p>
                          ))}
                          {card.tags && <p className="anki-tags">Tags: {card.tags}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {ankiPreview?.error && (
                    <div className="anki-error">❌ Preview error: {ankiPreview.error}</div>
                  )}

                  {/* Import Result */}
                  {ankiResult && (
                    <div className={`anki-result ${ankiResult.success ? 'anki-result--success' : 'anki-result--error'}`}>
                      {ankiResult.success ? (
                        <>
                          <p>✅ Import complete!</p>
                          <p>📥 Imported: <strong>{ankiResult.imported?.toLocaleString()}</strong></p>
                          <p>⏭ Skipped: <strong>{ankiResult.skipped}</strong></p>
                          {ankiResult.duplicate > 0 && <p>🔄 Duplicates: <strong>{ankiResult.duplicate}</strong></p>}
                          <p>📊 Total cards in deck: <strong>{ankiResult.total?.toLocaleString()}</strong></p>
                          {ankiResult.errors?.length > 0 && (
                            <details>
                              <summary>⚠️ {ankiResult.errors.length} errors</summary>
                              {ankiResult.errors.map((e, i) => <p key={i} style={{fontSize:'11px',color:'rgba(255,150,150,0.7)'}}>{e}</p>)}
                            </details>
                          )}
                        </>
                      ) : (
                        <p>❌ Import failed: {ankiResult.error}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="ap-toolbar">
                <div className="ap-toolbar-left">
                  {isCatFolder(activeFolder) && (
                    <button className="ap-btn-back" onClick={() => { setView('topics'); setSelectedTopic(null); setSearch(''); setGameModeFilter('all'); }}>
                      ← Back
                    </button>
                  )}
                  <div className="ap-folder-heading">
                    <span className="ap-fh-icon">
                      {selectedTopic === 'unassigned' ? '📋' : selectedTopic ? '📁' : curFolder?.icon}
                    </span>
                    <span className="ap-fh-name">
                      {selectedTopic === 'unassigned' ? 'Unassigned' : selectedTopic ? selectedTopic.name : curFolder?.label}
                    </span>
                    <span className="ap-fh-count">{filtered.length}</span>
                  </div>
                  <select
                    className="ap-gm-filter"
                    value={gameModeFilter}
                    onChange={e => setGameModeFilter(e.target.value)}
                  >
                    <option value="all">All Modes</option>
                    {GAME_MODES.map(gm => (
                      <option key={gm.id} value={gm.id}>{gm.icon} {gm.label}</option>
                    ))}
                  </select>
                  <input
                    className="ap-search-input"
                    type="text"
                    placeholder="Search questions…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div className="ap-toolbar-right">
                  {bulkMsg && (
                    <span className={`ap-bulk-msg ${bulkMsg.startsWith('✓') ? 'ok' : 'err'}`}>{bulkMsg}</span>
                  )}
                  <button
                    className="ap-btn-sec"
                    onClick={handleExportQuestions}
                    title={`Export ${filtered.length} question${filtered.length !== 1 ? 's' : ''} as JSON`}
                  >
                    📤 Export
                  </button>
                  <button className="ap-btn-sec" onClick={() => setImportModal(true)}>
                    📥 Bulk Import
                  </button>
                  <button className="ap-btn-sec" onClick={() => setShowParser(true)}>
                    📋 Paste & Parse
                  </button>
                  <button className="ap-btn-pri" onClick={() => setModal('add')}>+ Add Question</button>
                </div>
              </div>

              {selectedBulk.size > 0 && (
                <div className="ap-bulk-actions">
                  <div className="ap-bulk-info">
                    <button className="ap-bulk-clear" onClick={() => setSelectedBulk(new Set())}>✕</button>
                    <span>{selectedBulk.size} question{selectedBulk.size !== 1 ? 's' : ''} selected</span>
                  </div>
                  <div className="ap-bulk-btns">
                    <button
                      className="ap-bulk-btn ap-bulk-btn--easy"
                      onClick={() => handleBulkDifficultyChange('easy')}
                      title="Set to Easy"
                    >
                      🟢 Set Easy
                    </button>
                    <button
                      className="ap-bulk-btn ap-bulk-btn--hard"
                      onClick={() => handleBulkDifficultyChange('hard')}
                      title="Set to Hard"
                    >
                      🔴 Set Hard
                    </button>
                    <div className="ap-bulk-move-wrap">
                      <button
                        className="ap-bulk-btn ap-bulk-btn--move"
                        onClick={() => setShowBulkMoveDropdown(v => !v)}
                      >
                        📁 Move to...
                      </button>
                      {showBulkMoveDropdown && (
                        <div className="ap-bulk-move-dropdown">
                          <p className="ap-bulk-move-label">SELECT DESTINATION:</p>
                          {topics.length > 0 && (
                            <>
                              <p className="ap-bulk-move-label" style={{marginTop: 8}}>TOPICS:</p>
                              {topics.map(t => (
                                <button
                                  key={t.id}
                                  className="ap-bulk-move-option"
                                  onClick={() => handleBulkMove(t.id, t.subject || activeFolder)}
                                >
                                  📁 {t.name}
                                </button>
                              ))}
                            </>
                          )}
                          <p className="ap-bulk-move-label" style={{marginTop: 8}}>SUBJECTS:</p>
                          {FOLDERS.filter(f => !f.special && !f.separator && !f.comingSoon).map(f => (
                            <button
                              key={f.id}
                              className="ap-bulk-move-option"
                              onClick={() => handleBulkMove(null, f.id)}
                            >
                              {f.icon} {f.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="ap-bulk-btn ap-bulk-btn--delete"
                      onClick={handleBulkDelete}
                    >
                      🗑 Delete {selectedBulk.size}
                    </button>
                  </div>
                </div>
              )}

              <div className="ap-table-wrap">
                <table className="ap-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, minWidth: 40, textAlign: 'center', padding: '4px 8px' }}>
                        <input
                          type="checkbox"
                          className="ap-checkbox"
                          checked={filtered.length > 0 && selectedBulk.size === filtered.length}
                          onChange={toggleSelectAll}
                          title="Select all"
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            display: 'block',
                            visibility: 'visible',
                            opacity: '1',
                            position: 'static',
                            accentColor: 'rgba(200,165,60,0.9)',
                            flexShrink: 0
                          }}
                        />
                      </th>
                      <th>ID</th>
                      <th>Subject</th>
                      <th>Difficulty</th>
                      <th>Image</th>
                      <th>Game Modes</th>
                      {isCatFolder(activeFolder) && <th>Topic</th>}
                      <th>Tower Floor</th>
                      <th>Question Preview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(q => {
                      const topicForQ = topics.find(t => t.id === q.topic_id);
                      const qId      = q.id      ?? '?';
                      const qSubj    = q.subject  ?? '';
                      const qDiff    = q.difficulty || 'easy';
                      const qModes   = Array.isArray(q.game_modes) ? q.game_modes : [];
                      const preview  = q.question || '';  // guard against missing question field
                      const isSelected = selectedBulk.has(String(qId));
                      return (
                        <tr key={qId} className={isSelected ? 'ap-q-row--selected' : ''}>
                          <td className="ap-col-check" onClick={e => e.stopPropagation()} style={{width:'40px', minWidth:'40px', textAlign:'center', verticalAlign:'middle', padding:'4px 8px'}}>
                            <input
                              type="checkbox"
                              className="ap-checkbox"
                              checked={isSelected}
                              onChange={e => setSelectedBulk(prev => {
                                const next = new Set(prev);
                                e.target.checked ? next.add(String(qId)) : next.delete(String(qId));
                                return next;
                              })}
                              style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                display: 'block',
                                visibility: 'visible',
                                opacity: '1',
                                position: 'static',
                                accentColor: 'rgba(200,165,60,0.9)',
                                flexShrink: 0
                              }}
                            />
                          </td>
                          <td className="ap-td-id"><span className="ap-id-pill">{qId}</span></td>
                          <td>
                            <span className={`ap-badge ap-subj-${qSubj}`}>
                              {FOLDERS.find(f => f.id === qSubj)?.icon} {qSubj}
                            </span>
                          </td>
                          <td>
                            <span className={`ap-badge ap-diff-${qDiff}`}>
                              {qDiff}
                            </span>
                          </td>
                          <td className="ap-td-thumb">
                            {q.image_url
                              ? <img src={q.image_url} alt="" className="ap-thumb" title={q.image_url} />
                              : <span className="ap-no-image">—</span>}
                          </td>
                          <td className="ap-td-modes">
                            <div className="ap-gm-badges">
                              {qModes.map(mode => {
                                const gm = GAME_MODES.find(g => g.id === mode);
                                return gm ? (
                                  <span key={mode} className={`ap-gm-badge ap-gm-badge-${mode}`} title={gm.label}>
                                    {gm.icon}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </td>
                          {isCatFolder(activeFolder) && (
                            <td className="ap-td-topic">
                              {topicForQ
                                ? <span className={`ap-topic-badge ap-tb-${activeFolder}`}>{topicForQ.name}</span>
                                : <span className="ap-topic-badge ap-tb-none">Unassigned</span>}
                            </td>
                          )}
                          <td className="ap-td-floor">
                            {qModes.includes('tower') && q.tower_floor
                              ? (
                                <div className="ap-floor-cell">
                                  <span className="ap-floor-pill">🏰 {q.tower_floor}</span>
                                  <span className="ap-floor-zone">{getTowerZone(q.tower_floor)}</span>
                                </div>
                              )
                              : <span className="ap-no-image">—</span>}
                          </td>
                          <td className="ap-td-preview" title={preview}>
                            {preview.length > 80 ? preview.slice(0, 80) + '…' : preview}
                          </td>
                          <td>
                            <div className="ap-row-actions">
                              <button className="ap-edit-btn" onClick={() => setModal(q)}>Edit</button>
                              {isCatFolder(activeFolder) && topics.length > 0 && (
                                <select
                                  className="ap-move-select"
                                  value=""
                                  title="Move to topic"
                                  onChange={e => {
                                    const val = e.target.value;
                                    if (val === '__un__') handleMoveQuestion(q.id, null);
                                    else if (val) handleMoveQuestion(q.id, val);
                                  }}
                                >
                                  <option value="">Move…</option>
                                  {topics.filter(t => t.id !== q.topic_id).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                  {q.topic_id && <option value="__un__">↩ Unassign</option>}
                                </select>
                              )}
                              <button className="ap-del-btn" onClick={() => setDeleteId(q.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={12} className="ap-empty">
                          {selectedTopic === 'unassigned'
                            ? 'All questions in this category are assigned to a topic.'
                            : selectedTopic
                            ? `No questions in "${selectedTopic?.name}" yet.`
                            : 'No questions in this category yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          </>)}
        </div>
      </div>

      {topicModal && (
        <TopicModal
          topic={topicModal === 'create' ? null : topicModal}
          onSave={handleSaveTopic}
          onClose={() => { setTopicModal(null); setTopicErr(''); }}
          error={topicErr}
        />
      )}

      {delTopic && (
        <div className="ap-backdrop" onClick={() => setDelTopic(null)}>
          <div className="ap-confirm" onClick={e => e.stopPropagation()}>
            <div className="ap-confirm-icon">📁</div>
            <h3>Delete "{delTopic.name}"?</h3>
            <p>This topic folder will be removed. Questions won't be deleted.</p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDelTopic(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDeleteTopic}>Delete Topic</button>
            </div>
          </div>
        </div>
      )}

      {groupModal && (
        <GroupModal
          group={(groupModal === 'create' || groupModal?.create) ? null : groupModal}
          parentName={groupModal?.parentName}
          promote={!!groupModal?.promoteTopicId}
          onSave={handleSaveGroup}
          onClose={() => { setGroupModal(null); setTopicErr(''); }}
          error={topicErr}
        />
      )}

      {delGroup && (
        <div className="ap-backdrop" onClick={() => setDelGroup(null)}>
          <div className="ap-confirm" onClick={e => e.stopPropagation()}>
            <div className="ap-confirm-icon">🗂️</div>
            <h3>Delete "{delGroup.name}"?</h3>
            <p>Topics inside will become ungrouped (not deleted).</p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDelGroup(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDeleteGroup}>Delete Group</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <QuestionModal
          question={modal === 'add' ? null : modal}
          defaultSubject={activeFolder}
          defaultTopicId={selectedTopic && selectedTopic !== 'unassigned' ? selectedTopic.id : ''}
          defaultDifficulty={selectedDifficulty || 'easy'}
          topics={isCatFolder(activeFolder) ? topics : []}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}

      {deleteId !== null && (
        <DeleteConfirm
          questionId={deleteId}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {importModal && (
        <BulkImportModal
          activeFolder={activeFolder}
          selectedTopic={selectedTopic}
          selectedDifficulty={selectedDifficulty}
          onImport={handleImportDone}
          onClose={() => setImportModal(false)}
        />
      )}

      {showParser && (
        <QuestionParser
          activeFolder={activeFolder}
          selectedTopic={selectedTopic}
          selectedDifficulty={selectedDifficulty}
          onImport={handleImportDone}
          onClose={() => setShowParser(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DAILY QUESTS PANEL
// ══════════════════════════════════════════════════════════════════════════════

const QUEST_ICONS = ['🎮', '❓', '⚔️', '🏆', '🔬', '💊', '🧠', '❤️', '🦠', '🔥', '📚', '⚡', '🏰'];
const QUEST_TYPES = [
  { id: 'play_games', label: 'Play X games' },
  { id: 'correct_answers', label: 'Answer X questions correctly' },
  { id: 'win_battle_royale', label: 'Win X Battle Royales' },
  { id: 'win_speed_race', label: 'Win X Speed Races' },
  { id: 'tower_floors', label: 'Complete X Tower floors' },
  { id: 'streak', label: 'Get X correct answers in a row' },
  { id: 'different_modes', label: 'Play X different game modes' },
];
const QUEST_DIFFICULTIES = ['easy', 'hard'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function QuestModal({ quest, onSave, onClose }) {
  const isEdit = !!quest;
  const [form, setForm] = useState({
    name: quest?.name || '',
    description: quest?.description || '',
    icon: quest?.icon || '🎮',
    quest_type: quest?.quest_type || 'play_games',
    target: quest?.target || 1,
    coin_reward: quest?.coin_reward || 100,
    gem_reward: quest?.gem_reward || 0,
    xp_reward: quest?.xp_reward || 50,
    difficulty: quest?.difficulty || 'easy',
    active: quest?.active !== false,
    pinned_day: quest?.pinned_day ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Quest name is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = isEdit
        ? await apiCall(`/admin/quests/${quest.id}`, { method: 'PUT', body: JSON.stringify(form) })
        : await apiCall('/admin/quests', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 600 }}>
        <div className="ap-modal-head">
          <h2>{isEdit ? 'Edit Quest' : 'Create New Quest'}</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">
          <div className="ap-row-2">
            <div className="ap-field">
              <label>Quest Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Play 3 games"
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="ap-field">
              <label>Icon</label>
              <select value={form.icon} onChange={e => set('icon', e.target.value)}>
                {QUEST_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="ap-field">
            <label>Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Optional longer description"
              maxLength={200}
            />
          </div>

          <div className="ap-row-2">
            <div className="ap-field">
              <label>Quest Type</label>
              <select value={form.quest_type} onChange={e => set('quest_type', e.target.value)}>
                {QUEST_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label>Target Number</label>
              <input
                type="number"
                value={form.target}
                onChange={e => set('target', parseInt(e.target.value) || 1)}
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="ap-row-3">
            <div className="ap-field">
              <label>🪙 Coin Reward</label>
              <input
                type="number"
                value={form.coin_reward}
                onChange={e => set('coin_reward', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="ap-field">
              <label>💎 Gem Reward</label>
              <input
                type="number"
                value={form.gem_reward}
                onChange={e => set('gem_reward', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div className="ap-field">
              <label>✨ XP Reward</label>
              <input
                type="number"
                value={form.xp_reward}
                onChange={e => set('xp_reward', parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>

          <div className="ap-row-3">
            <div className="ap-field">
              <label>Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
                {QUEST_DIFFICULTIES.map(d => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="ap-field">
              <label>Pin to Day</label>
              <select
                value={form.pinned_day ?? ''}
                onChange={e => set('pinned_day', e.target.value === '' ? null : parseInt(e.target.value))}
              >
                <option value="">Not pinned</option>
                {DAYS_OF_WEEK.map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            <div className="ap-field ap-field-toggle">
              <label>Active</label>
              <label className="ap-toggle">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => set('active', e.target.checked)}
                />
                <span className="ap-slider" />
              </label>
            </div>
          </div>

          {error && <div className="ap-err">{error}</div>}

          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Quest' : 'Create Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestsPanel() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | quest object
  const [deleteId, setDeleteId] = useState(null);
  const [todayQuests, setTodayQuests] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => { loadQuests(); }, []);

  async function loadQuests() {
    setLoading(true);
    try {
      const res = await apiCall('/admin/quests');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load quests');
      setQuests(data.quests || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleSave(savedQuest) {
    if (modal === 'create') {
      setQuests(qs => [savedQuest, ...qs]);
    } else {
      setQuests(qs => qs.map(q => q.id === savedQuest.id ? savedQuest : q));
    }
    setModal(null);
  }

  async function handleDelete() {
    try {
      const res = await apiCall(`/admin/quests/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setQuests(qs => qs.filter(q => q.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleToggleActive(quest) {
    try {
      const res = await apiCall(`/admin/quests/${quest.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !quest.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setQuests(qs => qs.map(q => q.id === quest.id ? data : q));
    } catch (err) {
      alert(err.message);
    }
  }

  async function loadTodayPreview() {
    setPreviewLoading(true);
    try {
      const res = await apiCall('/admin/daily-quests/preview');
      const data = await res.json();
      setTodayQuests(data.quests || []);
    } catch (err) {
      alert(err.message);
    }
    setPreviewLoading(false);
  }

  async function regenerateToday() {
    if (!confirm('Regenerate today\'s quests? This will randomly select 3 new quests for today.')) return;
    setPreviewLoading(true);
    try {
      const res = await apiCall('/admin/daily-quests/regenerate', { method: 'POST' });
      const data = await res.json();
      setTodayQuests(data.quests || []);
      alert(`Regenerated! ${data.quests?.length || 0} quests selected for today.`);
    } catch (err) {
      alert(err.message);
    }
    setPreviewLoading(false);
  }

  const activeCount = quests.filter(q => q.active).length;
  const getTypeLabel = (type) => QUEST_TYPES.find(t => t.id === type)?.label || type;

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>;

  return (
    <div className="ap-panel">
      <div className="ap-panel-head">
        <h2>📅 Daily Quests</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="ap-btn-sec" onClick={loadTodayPreview} disabled={previewLoading}>
            {previewLoading ? 'Loading…' : '👁️ Preview Today'}
          </button>
          <button className="ap-btn-pri" onClick={() => setModal('create')}>
            + Create Quest
          </button>
        </div>
      </div>

      {error && <div className="ap-err">{error}</div>}

      {/* Today's Quests Preview */}
      {todayQuests.length > 0 && (
        <div className="ap-card" style={{ marginBottom: 24, background: '#f0fdf4', border: '2px solid #22c55e' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#166534' }}>🎯 Today's Active Quests ({new Date().toLocaleDateString()})</h3>
            <button className="ap-btn-sec" onClick={regenerateToday} disabled={previewLoading} style={{ fontSize: 12 }}>
              🔄 Regenerate
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {todayQuests.map(q => (
              <div key={q.id} style={{
                background: '#fff',
                border: '1px solid #86efac',
                borderRadius: 8,
                padding: 12,
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{q.icon}</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{getTypeLabel(q.quest_type)} ({q.target})</div>
                <div style={{ fontSize: 12, color: '#ca8a04', marginTop: 4 }}>
                  🪙 {q.coin_reward} {q.gem_reward > 0 && `💎 ${q.gem_reward}`} ✨ {q.xp_reward} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="ap-stats-row" style={{ marginBottom: 24 }}>
        <div className="ap-stat-card">
          <div className="ap-stat-val">{quests.length}</div>
          <div className="ap-stat-label">Total Quests</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-val">{activeCount}</div>
          <div className="ap-stat-label">Active Quests</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-val">{quests.filter(q => q.difficulty === 'easy').length}</div>
          <div className="ap-stat-label">Easy</div>
        </div>
        <div className="ap-stat-card">
          <div className="ap-stat-val">{quests.filter(q => q.difficulty === 'hard').length}</div>
          <div className="ap-stat-label">Hard</div>
        </div>
      </div>

      {/* Quest Table */}
      {quests.length === 0 ? (
        <div className="ap-empty">
          <p>No quests created yet.</p>
          <button className="ap-btn-pri" onClick={() => setModal('create')}>Create First Quest</button>
        </div>
      ) : (
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Icon</th>
                <th>Quest Name</th>
                <th>Type</th>
                <th>Target</th>
                <th>Rewards</th>
                <th>Difficulty</th>
                <th>Pinned</th>
                <th>Active</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quests.map(q => (
                <tr key={q.id} style={{ opacity: q.active ? 1 : 0.5 }}>
                  <td style={{ fontSize: 24, textAlign: 'center' }}>{q.icon}</td>
                  <td>
                    <strong>{q.name}</strong>
                    {q.description && <div style={{ fontSize: 12, color: '#666' }}>{q.description}</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>{getTypeLabel(q.quest_type)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{q.target}</td>
                  <td style={{ fontSize: 12 }}>
                    🪙 {q.coin_reward}
                    {q.gem_reward > 0 && <span> 💎 {q.gem_reward}</span>}
                    <span> ✨ {q.xp_reward}</span>
                  </td>
                  <td>
                    <span className={`ap-diff-badge ap-diff-${q.difficulty}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {q.pinned_day != null ? DAYS_OF_WEEK[q.pinned_day] : '—'}
                  </td>
                  <td>
                    <label className="ap-toggle">
                      <input
                        type="checkbox"
                        checked={q.active}
                        onChange={() => handleToggleActive(q)}
                      />
                      <span className="ap-slider" />
                    </label>
                  </td>
                  <td>
                    <button className="ap-btn-icon" onClick={() => setModal(q)} title="Edit">✏️</button>
                    <button className="ap-btn-icon ap-btn-danger" onClick={() => setDeleteId(q.id)} title="Delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quest Modal */}
      {modal && (
        <QuestModal
          quest={modal === 'create' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="ap-backdrop" onClick={() => setDeleteId(null)}>
          <div className="ap-modal ap-modal-sm" onClick={e => e.stopPropagation()}>
            <h3>Delete Quest?</h3>
            <p>This cannot be undone.</p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Announcements Panel ────────────────────────────────────────────────────────

const ANN_CATEGORIES = ['Update', 'News', 'Maintenance', 'Event'];
const ANN_CAT_COLORS = { Update: '#3498db', News: '#9b59b6', Maintenance: '#e67e22', Event: '#27ae60' };

function AnnouncementModal({ announcement, onSave, onClose }) {
  const isEdit = !!announcement;
  const [form, setForm] = useState({
    title:    announcement?.title    || '',
    message:  announcement?.message  || '',
    category: announcement?.category || 'Update',
    pinned:   announcement?.pinned   || false,
    urgent:   announcement?.urgent   || false,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setError('Title and message are required.'); return; }
    setSaving(true); setError('');
    try {
      const res = isEdit
        ? await apiCall(`/admin/announcements/${announcement.id}`, { method: 'PUT', body: JSON.stringify(form) })
        : await apiCall('/admin/announcements', { method: 'POST', body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSave(data);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal ap-ann-modal">
        <div className="ap-modal-head">
          <h2>{isEdit ? 'Edit Announcement' : 'New Announcement'}</h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">
          <div className="ap-field">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Announcement title…"
              maxLength={200}
              required
              autoFocus
            />
          </div>
          <div className="ap-field">
            <label>Message</label>
            <textarea
              value={form.message}
              onChange={e => set('message', e.target.value)}
              rows={6}
              placeholder="Write your message here…"
              required
            />
          </div>
          <div className="ap-row-3">
            <div className="ap-field">
              <label>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                {ANN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="ap-field ap-field-toggle">
              <label>Pin to Top</label>
              <label className="ap-toggle">
                <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} />
                <span className="ap-slider" />
              </label>
            </div>
            <div className="ap-field ap-field-toggle">
              <label>Mark Urgent</label>
              <label className="ap-toggle">
                <input type="checkbox" checked={form.urgent} onChange={e => set('urgent', e.target.checked)} />
                <span className="ap-slider" />
              </label>
            </div>
          </div>
          {error && <div className="ap-error">{error}</div>}
          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnnouncementsPanel() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [delId,   setDelId]   = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res  = await apiCall('/api/announcements');
      const data = await res.json();
      setList(data.announcements || []);
    } catch { setError('Failed to load announcements.'); }
    setLoading(false);
  }

  async function handleDelete() {
    try {
      await apiCall(`/admin/announcements/${encodeURIComponent(delId)}`, { method: 'DELETE' });
      setList(a => a.filter(x => x.id !== delId));
    } catch { setError('Delete failed.'); }
    setDelId(null);
  }

  function handleSaved(saved) {
    setList(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = saved; return copy; }
      return [saved, ...prev];
    });
    setModal(null);
  }

  if (loading) return <div className="ap-loading">Loading announcements…</div>;

  return (
    <div className="ap-ann-panel">
      <div className="ap-ann-toolbar">
        <h2 className="ap-ann-title">📣 Announcements</h2>
        <button className="ap-btn-pri" onClick={() => setModal('new')}>+ New Announcement</button>
      </div>
      {error && <div className="ap-error">{error}</div>}

      <div className="ap-ann-list">
        {list.length === 0 && (
          <div className="ap-empty" style={{ textAlign: 'center', padding: 40 }}>
            No announcements yet. Create your first one!
          </div>
        )}
        {list.map(a => (
          <div key={a.id} className={`ap-ann-card${a.urgent ? ' ap-ann-urgent' : ''}${a.pinned ? ' ap-ann-pinned' : ''}`}>
            <div className="ap-ann-card-head">
              <div className="ap-ann-badges">
                {a.pinned && <span className="ap-ann-badge-pin">📌 Pinned</span>}
                {a.urgent && <span className="ap-ann-badge-urgent">🔴 Urgent</span>}
                <span className="ap-ann-badge-cat" style={{ background: ANN_CAT_COLORS[a.category] || '#555' }}>
                  {a.category}
                </span>
              </div>
              <div className="ap-ann-card-actions">
                <button className="ap-edit-btn" onClick={() => setModal(a)}>Edit</button>
                <button className="ap-del-btn" onClick={() => setDelId(a.id)}>Delete</button>
              </div>
            </div>
            <h3 className="ap-ann-card-title">{a.title}</h3>
            <p className="ap-ann-card-body">{a.message}</p>
            <div className="ap-ann-card-foot">
              <span className="ap-ann-card-date">
                {new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <AnnouncementModal
          announcement={modal === 'new' ? null : modal}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}

      {delId !== null && (
        <DeleteConfirm
          questionId="this announcement"
          onConfirm={handleDelete}
          onCancel={() => setDelId(null)}
        />
      )}
    </div>
  );
}

// ── Subjects Panel ─────────────────────────────────────────────────────────────

const MIN_QUESTIONS_TO_ACTIVATE = 5;

function SubjectCard({ subject, qCount, onToggle, saving }) {
  const folder  = FOLDERS.find(f => f.id === subject.id);
  const icon    = folder?.icon || subject.icon || '📚';
  const hasEnough = qCount >= MIN_QUESTIONS_TO_ACTIVATE;

  let badgeLabel, badgeCls;
  if (subject.active)    { badgeLabel = 'Active';      badgeCls = 'sj-badge-active';   }
  else if (qCount === 0) { badgeLabel = 'Coming Soon'; badgeCls = 'sj-badge-cs';       }
  else if (!hasEnough)   { badgeLabel = 'Low Content'; badgeCls = 'sj-badge-low';      }
  else                   { badgeLabel = 'Inactive';    badgeCls = 'sj-badge-inactive'; }

  return (
    <div className={`sj-card ${subject.active ? 'sj-card-on' : 'sj-card-off'}`}>
      <div className="sj-card-left">
        <span className="sj-icon">{icon}</span>
        <div className="sj-info">
          <span className="sj-name">{subject.name}</span>
          <div className="sj-meta">
            <span className="sj-qcount">{qCount} question{qCount !== 1 ? 's' : ''}</span>
            <span className={`sj-badge ${badgeCls}`}>{badgeLabel}</span>
          </div>
          {!subject.active && qCount === 0 && (
            <div className="sj-warn">⚠️ Add at least {MIN_QUESTIONS_TO_ACTIVATE} questions before activating</div>
          )}
          {!subject.active && qCount > 0 && !hasEnough && (
            <div className="sj-warn">⚠️ Add {MIN_QUESTIONS_TO_ACTIVATE - qCount} more question{MIN_QUESTIONS_TO_ACTIVATE - qCount !== 1 ? 's' : ''} before activating</div>
          )}
        </div>
      </div>
      <div className="sj-card-right">
        <span className="sj-toggle-label">{subject.active ? 'On' : 'Off'}</span>
        <label className={`ap-toggle${saving ? ' sj-saving' : ''}`} title={saving ? 'Saving…' : (subject.active ? 'Deactivate subject' : 'Activate subject')}>
          <input
            type="checkbox"
            checked={!!subject.active}
            disabled={saving}
            onChange={onToggle}
          />
          <span className="ap-slider" />
        </label>
      </div>
    </div>
  );
}

function SubjectsPanel({ subjects, setSubjects }) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState({});
  const [error,     setError]     = useState('');

  useEffect(() => {
    Promise.all([
      apiCall('/api/subjects').then(r => r.json()),
      apiCall('/admin/questions').then(r => r.json()),
    ])
      .then(([subData, qData]) => {
        setSubjects(subData.subjects || []);
        setQuestions(qData.questions || []);
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false));
  }, [setSubjects]);

  function qCount(subjectId) {
    return questions.filter(q => q.subject === subjectId).length;
  }

  async function toggleSubject(id, currentActive) {
    setSaving(s => ({ ...s, [id]: true }));
    setError('');
    try {
      const res  = await apiCall(`/admin/subjects/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body:   JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setSubjects(prev => prev.map(s => s.id === data.id ? { ...s, active: data.active } : s));
    } catch (err) {
      setError(err.message);
    }
    setSaving(s => ({ ...s, [id]: false }));
  }

  if (loading) return <div className="ap-loading">Loading subjects…</div>;

  const activeList   = subjects.filter(s =>  s.active);
  const inactiveList = subjects.filter(s => !s.active);
  const totalQ       = questions.length;

  return (
    <div className="sj-panel">
      {error && <div className="ap-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Summary */}
      <div className="sj-summary">
        <div className="sj-sum-stat">
          <span className="sj-sum-val" style={{ color: '#2ecc71' }}>{activeList.length}</span>
          <span className="sj-sum-lbl">active subjects</span>
        </div>
        <div className="sj-sum-div" />
        <div className="sj-sum-stat">
          <span className="sj-sum-val">{subjects.length}</span>
          <span className="sj-sum-lbl">total subjects</span>
        </div>
        <div className="sj-sum-div" />
        <div className="sj-sum-stat">
          <span className="sj-sum-val">{totalQ}</span>
          <span className="sj-sum-lbl">total questions</span>
        </div>
        <div className="sj-sum-hint">
          Toggle subjects on to make them selectable in-game. Subjects need at least {MIN_QUESTIONS_TO_ACTIVATE} questions to go live.
        </div>
      </div>

      {/* Active */}
      <div className="sj-section">
        <div className="sj-section-hd">
          <span className="sj-section-dot sj-dot-active" />
          <span className="sj-section-title">Active Subjects</span>
          <span className="sj-section-count">{activeList.length}</span>
        </div>
        <p className="sj-section-desc">These subjects appear as selectable options in-game right now.</p>
        <div className="sj-list">
          {activeList.length === 0 && (
            <div className="ap-empty" style={{ padding: 24 }}>No active subjects yet. Toggle a subject below to make it available to players.</div>
          )}
          {activeList.map(s => (
            <SubjectCard
              key={s.id}
              subject={s}
              qCount={qCount(s.id)}
              saving={!!saving[s.id]}
              onToggle={() => toggleSubject(s.id, s.active)}
            />
          ))}
        </div>
      </div>

      {/* Inactive */}
      <div className="sj-section">
        <div className="sj-section-hd">
          <span className="sj-section-dot sj-dot-inactive" />
          <span className="sj-section-title">Coming Soon / Inactive</span>
          <span className="sj-section-count">{inactiveList.length}</span>
        </div>
        <p className="sj-section-desc">Greyed out for players. Add questions then toggle on to activate.</p>
        <div className="sj-list">
          {inactiveList.map(s => (
            <SubjectCard
              key={s.id}
              subject={s}
              qCount={qCount(s.id)}
              saving={!!saving[s.id]}
              onToggle={() => toggleSubject(s.id, s.active)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Videos Panel ───────────────────────────────────────────────────────────────

// Client-side copy of the server's parseVideoUrl — live preview only.
// The server re-validates authoritatively on POST/PUT.
function parseVideoUrlClient(url) {
  if (typeof url !== 'string') return null;
  const s = url.trim();
  let m = s.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (m) return { video_type: 'youtube', embed_id: m[1] };
  m = s.match(/vimeo\.com\/(?:video\/)?(\d{6,12})/i);
  if (m) return { video_type: 'vimeo', embed_id: m[1] };
  return null;
}

const VIDEO_CATEGORIES = FOLDERS.filter(f => !f.special && !f.separator && f.id !== 'all');

function VideosPanel() {
  const [videos,   setVideos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [deleteVid, setDeleteVid] = useState(null); // video object
  const [editing,  setEditing]  = useState(null);   // null | video object
  const [saving,   setSaving]   = useState(false);

  // form fields
  const [title,      setTitle]      = useState('');
  const [url,        setUrl]        = useState('');
  const [attachMode, setAttachMode] = useState('category'); // 'category' | 'topic'
  const [category,   setCategory]   = useState(VIDEO_CATEGORIES[0]?.id || '');
  const [difficulty, setDifficulty] = useState('easy');
  const [topicId,    setTopicId]    = useState('');
  const [formTopics, setFormTopics] = useState([]);

  // One cached fetch per category, shared by the form's topic dropdown and the
  // list's topic-name labels. The promise is cached immediately so concurrent
  // callers never duplicate a request for the same category.
  const topicsCacheRef = useRef(new Map()); // category -> Promise<topics[]> | topics[]
  const [topicNameById, setTopicNameById] = useState(new Map());

  async function getTopicsForCategory(cat) {
    const cache = topicsCacheRef.current;
    if (cache.has(cat)) return cache.get(cat);
    const promise = (async () => {
      const res  = await apiCall(`/admin/topics?category=${encodeURIComponent(cat)}`);
      const data = await res.json();
      const topics = data.topics || [];
      setTopicNameById(prev => {
        const next = new Map(prev);
        topics.forEach(t => next.set(t.id, t.name));
        return next;
      });
      return topics;
    })();
    cache.set(cat, promise);
    return promise;
  }

  useEffect(() => { loadVideos(); }, []);

  async function loadVideos() {
    setLoading(true);
    try {
      const res = await apiCall('/admin/videos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load videos');
      setVideos(data.videos || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // Resolve topic names for topic-attached videos in the list (cache dedupes)
  useEffect(() => {
    const cats = [...new Set(videos.filter(v => v.topic_id && v.category).map(v => v.category))];
    cats.forEach(c => { getTopicsForCategory(c).catch(() => {}); });
  }, [videos]);

  // Populate the form's topic dropdown when in topic mode
  useEffect(() => {
    if (attachMode !== 'topic' || !category) { setFormTopics([]); return; }
    let stale = false;
    getTopicsForCategory(category)
      .then(ts => {
        if (stale) return;
        const filtered = ts.filter(t => (t.difficulty || 'easy') === difficulty);
        setFormTopics(filtered);
        setTopicId(cur => filtered.some(t => t.id === cur) ? cur : '');
      })
      .catch(() => { if (!stale) setFormTopics([]); });
    return () => { stale = true; };
  }, [attachMode, category, difficulty]);

  function resetForm() {
    setEditing(null);
    setTitle('');
    setUrl('');
    setTopicId('');
  }

  function startEdit(v) {
    setError('');
    setEditing(v);
    setTitle(v.title);
    setUrl(v.url);
    if (v.topic_id) {
      setAttachMode('topic');
      setCategory(v.category || VIDEO_CATEGORIES[0]?.id || '');
      setDifficulty(v.difficulty || 'easy');
      setTopicId(v.topic_id);
    } else {
      setAttachMode('category');
      setCategory(v.category || VIDEO_CATEGORIES[0]?.id || '');
      setDifficulty(v.difficulty || 'easy');
      setTopicId('');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let res, data;
      if (editing) {
        // PUT changed fields only — url triggers server-side re-parse,
        // attachment fields only when the attachment was actually touched
        const body = {};
        if (title.trim() !== editing.title) body.title = title.trim();
        if (url.trim()   !== editing.url)   body.url   = url.trim();
        if (attachMode === 'topic') {
          if (topicId !== (editing.topic_id || '')) body.topic_id = topicId;
        } else if (editing.topic_id || category !== editing.category || difficulty !== editing.difficulty) {
          body.topic_id   = null;
          body.category   = category;
          body.difficulty = difficulty;
        }
        if (Object.keys(body).length === 0) { resetForm(); setSaving(false); return; }
        res  = await apiCall(`/admin/videos/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save video');
        setVideos(vs => vs.map(v => v.id === editing.id ? data : v));
      } else {
        const body = attachMode === 'topic'
          ? { title: title.trim(), url: url.trim(), topic_id: topicId }
          : { title: title.trim(), url: url.trim(), category, difficulty };
        res  = await apiCall('/admin/videos', { method: 'POST', body: JSON.stringify(body) });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add video');
        setVideos(vs => [...vs, data]);
      }
      resetForm();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  async function handleDelete() {
    setError('');
    try {
      const res  = await apiCall(`/admin/videos/${deleteVid.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete video');
      setVideos(vs => vs.filter(v => v.id !== deleteVid.id));
      setDeleteVid(null);
    } catch (err) { setError(err.message); setDeleteVid(null); }
  }

  const parsed = parseVideoUrlClient(url);
  const canSave = !saving && title.trim() && parsed && (attachMode === 'category' || topicId);
  const capDiff = (d) => d === 'hard' ? 'Hard' : 'Easy';
  const folderFor = (id) => FOLDERS.find(f => f.id === id);

  // Group list by category
  const byCategory = videos.reduce((acc, v) => {
    const key = v.category || 'uncategorized';
    (acc[key] = acc[key] || []).push(v);
    return acc;
  }, {});

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>;

  return (
    <div className="ap-panel">
      <div className="ap-panel-head">
        <h2>🎬 Training Grounds Videos</h2>
      </div>

      {error && <div className="ap-error">{error}</div>}

      {/* Add / edit form */}
      <form onSubmit={handleSave} className="ap-qform ap-video-form">
        <h3 className="ap-video-form-title">{editing ? `✏️ Edit "${editing.title}"` : '➕ Add Video'}</h3>
        <div className="ap-field">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. P-Values Explained"
            maxLength={200}
          />
        </div>
        <div className="ap-field">
          <label>Video URL (YouTube or Vimeo)</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </div>

        {/* Live parse preview */}
        {url.trim() && (parsed ? (
          <div className="ap-video-preview">
            {parsed.video_type === 'youtube' ? (
              <img className="ap-video-thumb" src={`https://img.youtube.com/vi/${parsed.embed_id}/mqdefault.jpg`} alt="" />
            ) : (
              <div className="ap-video-thumb ap-video-thumb--placeholder">🎬</div>
            )}
            <span className={`ap-video-badge ap-video-badge--${parsed.video_type}`}>
              {parsed.video_type === 'youtube' ? '▶ YouTube' : '🎬 Vimeo'} · {parsed.embed_id}
            </span>
          </div>
        ) : (
          <div className="ap-video-invalid">⚠ Unrecognized link — only YouTube and Vimeo are supported</div>
        ))}

        {/* Attachment picker */}
        <div className="ap-field">
          <label>Attach to</label>
          <div className="ap-attach-toggle">
            <button type="button" className={attachMode === 'category' ? 'active' : ''} onClick={() => setAttachMode('category')}>
              📚 Whole category
            </button>
            <button type="button" className={attachMode === 'topic' ? 'active' : ''} onClick={() => setAttachMode('topic')}>
              📁 Specific topic
            </button>
          </div>
        </div>
        <div className="ap-video-attach-row">
          <div className="ap-field">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {VIDEO_CATEGORIES.map(f => <option key={f.id} value={f.id}>{f.icon} {f.label}</option>)}
            </select>
          </div>
          <div className="ap-field">
            <label>Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">😊 Easy</option>
              <option value="hard">💀 Hard</option>
            </select>
          </div>
          {attachMode === 'topic' && (
            <div className="ap-field">
              <label>Topic</label>
              <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={formTopics.length === 0}>
                <option value="">{formTopics.length === 0 ? 'No topics for this category/difficulty' : '— Select topic —'}</option>
                {formTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="ap-video-form-actions">
          {editing && <button type="button" className="ap-btn-sec" onClick={() => { setError(''); resetForm(); }}>Cancel</button>}
          <button type="submit" className="ap-btn-pri" disabled={!canSave}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Video'}
          </button>
        </div>
      </form>

      {/* Videos list grouped by category */}
      {videos.length === 0 ? (
        <div className="ap-topic-empty">
          <div className="ap-topic-empty-icon">🎬</div>
          <p>No videos yet. Paste a YouTube or Vimeo link above to add the first one.</p>
        </div>
      ) : (
        Object.keys(byCategory).sort().map(cat => {
          const folder = folderFor(cat);
          return (
            <div className="ap-video-group" key={cat}>
              <h3 className="ap-video-group-head">{folder?.icon || '📂'} {folder?.label || cat}</h3>
              {byCategory[cat].map(v => (
                <div className="ap-video-row" key={v.id}>
                  {v.video_type === 'youtube' ? (
                    <img className="ap-video-thumb" src={`https://img.youtube.com/vi/${v.embed_id}/mqdefault.jpg`} alt="" />
                  ) : (
                    <div className="ap-video-thumb ap-video-thumb--placeholder">🎬</div>
                  )}
                  <div className="ap-video-row-info">
                    <span className="ap-video-row-title">{v.title}</span>
                    <span className="ap-video-row-attach">
                      {v.topic_id
                        ? `📁 ${topicNameById.get(v.topic_id) || 'topic'} · ${capDiff(v.difficulty)}`
                        : `📚 Category · ${capDiff(v.difficulty)}`}
                    </span>
                  </div>
                  <span className={`ap-video-badge ap-video-badge--${v.video_type}`}>
                    {v.video_type === 'youtube' ? '▶ YouTube' : '🎬 Vimeo'}
                  </span>
                  <div className="ap-video-row-actions">
                    <button className="ap-topic-edit-btn" onClick={() => startEdit(v)} title="Edit">✏️</button>
                    <button className="ap-topic-del-btn" onClick={() => setDeleteVid(v)} title="Delete">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      {deleteVid && (
        <div className="ap-backdrop" onClick={() => setDeleteVid(null)}>
          <div className="ap-confirm" onClick={e => e.stopPropagation()}>
            <div className="ap-confirm-icon">🎬</div>
            <h3>Delete "{deleteVid.title}"?</h3>
            <p>The video link will be removed. Nothing happens to the topic or its questions.</p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDeleteVid(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDelete}>Delete Video</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── First Aid Journey Panel ─────────────────────────────────────────────────────

const BOSS_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const BOSS_EMPTY_FORM = {
  question: '', optionA: '', optionB: '', optionC: '', optionD: '', optionE: '', optionF: '',
  correct: 'A', explanation: '', why_others_wrong: '', explanation_image_url: '',
};

// Shared explanation-image control (upload OR paste URL) for the journey/boss
// question forms (JourneyPanel + JourneyEditor). Uploads to the same bucket as
// question images via /admin/upload-image. Controlled: value + onChange(url).
function ExplanationImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  async function onFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setErr('Only JPG, PNG, and WEBP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErr('Image must be under 5MB.'); return; }
    setErr(''); setBusy(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res  = await apiCall('/admin/upload-image', { method: 'POST', body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onChange(data.url);
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
    e.target.value = '';
  }
  return (
    <div className="ap-field ap-image-field">
      <label>Explanation Image <span className="ap-field-opt">(optional · shown when the answer is revealed)</span></label>
      {value ? (
        <div className="ap-image-preview-wrap">
          <img src={value} alt="Explanation preview" className="ap-image-preview" />
          <div className="ap-image-preview-actions">
            <label className="ap-btn-sec ap-file-label">
              🔄 Replace Image
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: 'none' }} />
            </label>
            <button type="button" className="ap-btn-danger ap-btn-sm" onClick={() => onChange('')}>Remove</button>
          </div>
        </div>
      ) : (
        <label className={`ap-image-upload-zone ${busy ? 'uploading' : ''}`}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} style={{ display: 'none' }} disabled={busy} />
          {busy
            ? (<><div className="ap-upload-spinner" /><span>Uploading…</span></>)
            : (<><span className="ap-upload-icon">📤</span><span>Click to upload explanation image</span><span className="ap-upload-hint">JPG, PNG, WEBP · max 5MB</span></>)}
        </label>
      )}
      {err && <div className="ap-error ap-upload-error">{err}</div>}
      {!value && !busy && (
        <div className="ap-image-url-alt">
          <label style={{ marginBottom: 4 }}>Or paste image URL directly:</label>
          <input type="url" value={value} onChange={e => onChange(e.target.value)} placeholder="https://…" className="ap-input-plain" />
        </div>
      )}
    </div>
  );
}

function JourneyPanel() {
  const [subject,  setSubject]  = useState(JOURNEY_SUBJECTS[0].id);
  const [chapters, setChapters] = useState([]);
  const [bossQs,   setBossQs]   = useState([]);   // subject-wide boss questions
  const [levelsByChapter, setLevelsByChapter] = useState({}); // chapter_id -> levels[] (lazy)
  const [expandedIds, setExpandedIds] = useState(() => new Set()); // chapter ids open (multi-expand)
  const [counts, setCounts] = useState({ levels: {}, chapters: {}, bosses: {} }); // from /admin/journey-counts
  const [settingsOpen, setSettingsOpen] = useState(false); // ⚙ Journey Settings disclosure (collapsed by default)
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Inline create/rename: { kind: 'chapter'|'level', id: null=new, chapterId?, value }
  const [nameEdit,   setNameEdit]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null); // { kind: 'chapter'|'level'|'question', row, chapterId? }

  // Editor view: null | { kind: 'level', level, chapter } | { kind: 'boss', chapter } | { kind: 'ultimate' }
  const [selected, setSelected] = useState(null);
  const [levelQs,  setLevelQs]  = useState([]);   // questions for the selected level
  const [editing,  setEditing]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [showParser, setShowParser] = useState(false);
  const [form,     setForm]     = useState(BOSS_EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Journey map background — stored via the landing-images slot system ('journey_bg')
  const [bgUrl,   setBgUrl]   = useState(null);
  const [bgBusy,  setBgBusy]  = useState(false);
  const [bgError, setBgError] = useState('');

  // Journey-only activate/deactivate — gameSettings.journeyActiveSubjects (default all 16)
  const [activeIds,  setActiveIds]  = useState(() => new Set(JOURNEY_SUBJECTS.map(s => s.id)));
  const [actSaving,  setActSaving]  = useState(false);
  const [actSaved,   setActSaved]   = useState(false);
  const [actError,   setActError]   = useState('');

  useEffect(() => { loadJourneyBg(); loadActiveSubjects(); }, []);

  async function loadActiveSubjects() {
    try {
      const res = await apiCall('/admin/settings');
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.journeyActiveSubjects)) {
        setActiveIds(new Set(data.journeyActiveSubjects));
      }
    } catch { /* keep default all-active */ }
  }

  async function saveActiveSubjects() {
    setActSaving(true); setActSaved(false); setActError('');
    try {
      const ids = JOURNEY_SUBJECTS.filter(s => activeIds.has(s.id)).map(s => s.id);
      const res = await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ journeyActiveSubjects: ids }),
      });
      if (!res.ok) throw new Error('Save failed');
      setActSaved(true);
      setTimeout(() => setActSaved(false), 2500);
    } catch (err) {
      setActError(err.message);
    }
    setActSaving(false);
  }

  function toggleSubjectActive(id, on) {
    setActiveIds(prev => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function loadJourneyBg() {
    try {
      const res = await apiCall('/admin/landing-images');
      if (!res.ok) return;
      const data = await res.json();
      const row  = (data.images || []).find(img => img.slot_name === 'journey_bg');
      setBgUrl(row?.image_url || null);
    } catch { /* non-fatal: the panel works without the preview */ }
  }

  async function handleBgUpload(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setBgError('Image must be under 5MB'); return; }
    setBgBusy(true);
    setBgError('');
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res  = await apiCall('/admin/landing-images', {
        method: 'POST',
        body: JSON.stringify({ slot_name: 'journey_bg', base64, filename: file.name, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setBgUrl(data.image_url);
    } catch (err) {
      setBgError(err.message);
    }
    setBgBusy(false);
  }

  async function handleBgRemove() {
    if (!window.confirm('Remove the journey background? It will be deleted from storage.')) return;
    setBgBusy(true);
    setBgError('');
    try {
      const res  = await apiCall('/admin/landing-images/journey_bg', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setBgUrl(null);
    } catch (err) {
      setBgError(err.message);
    }
    setBgBusy(false);
  }

  useEffect(() => { loadSubject(); }, [subject]);

  async function loadSubject() {
    setLoading(true);
    setError('');
    setSelected(null);
    setExpandedIds(new Set());
    setLevelsByChapter({});
    setNameEdit(null);
    resetForm();
    try {
      const [chRes, bossRes, countRes] = await Promise.all([
        apiCall(`/admin/journey-chapters?subject=${encodeURIComponent(subject)}`),
        apiCall(`/admin/boss-questions?subject=${encodeURIComponent(subject)}`),
        apiCall(`/admin/journey-counts?subject=${encodeURIComponent(subject)}`),
      ]);
      const chData    = await chRes.json();
      const bossData  = await bossRes.json();
      const countData = await countRes.json();
      if (!chRes.ok) throw new Error(chData.error || 'Failed to load chapters');
      setChapters(chData.chapters || []);
      setBossQs(bossData.questions || []);
      setCounts({
        levels:   countData.levels   || {},
        chapters: countData.chapters || {},
        bosses:   countData.bosses   || {},
      });
    } catch (err) {
      setError(err.message);
      setChapters([]);
      setBossQs([]);
      setCounts({ levels: {}, chapters: {}, bosses: {} });
    }
    setLoading(false);
  }

  // Levels load lazily, once per chapter, on first expand. Multiple chapters
  // can be open at once (expandedIds is a Set); the cache persists across toggles.
  async function toggleChapter(chapterId) {
    const isOpen = expandedIds.has(chapterId);
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (isOpen) next.delete(chapterId); else next.add(chapterId);
      return next;
    });
    if (!isOpen && !(chapterId in levelsByChapter)) {
      try {
        const res  = await apiCall(`/admin/journey-levels?chapter_id=${chapterId}`);
        const data = await res.json();
        setLevelsByChapter(prev => ({ ...prev, [chapterId]: data.levels || [] }));
      } catch {
        setLevelsByChapter(prev => ({ ...prev, [chapterId]: [] }));
      }
    }
  }

  // ── Chapter / level create + rename (inline rows) ─────────────────────────

  async function saveName() {
    const { kind, id, chapterId } = nameEdit;
    const name = nameEdit.value.trim();
    if (!name) return;
    setError('');
    const isCreate = !id;
    try {
      if (kind === 'chapter') {
        if (id) {
          const res  = await apiCall(`/admin/journey-chapters/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to rename chapter');
          setChapters(cs => cs.map(c => c.id === id ? data : c));
        } else {
          const res  = await apiCall('/admin/journey-chapters', { method: 'POST', body: JSON.stringify({ subject, name, sort_order: chapters.length }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create chapter');
          setChapters(cs => [...cs, data]);
          setCounts(c => ({ ...c, chapters: { ...c.chapters, [data.id]: 0 } }));
        }
      } else {
        if (id) {
          const res  = await apiCall(`/admin/journey-levels/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to rename level');
          setLevelsByChapter(prev => ({ ...prev, [chapterId]: (prev[chapterId] || []).map(l => l.id === id ? data : l) }));
        } else {
          const res  = await apiCall('/admin/journey-levels', { method: 'POST', body: JSON.stringify({ chapter_id: chapterId, name, sort_order: (levelsByChapter[chapterId] || []).length }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to create level');
          setLevelsByChapter(prev => ({ ...prev, [chapterId]: [...(prev[chapterId] || []), data] }));
          setCounts(c => ({
            ...c,
            levels:   { ...c.levels, [data.id]: 0 },
            chapters: { ...c.chapters, [chapterId]: (c.chapters[chapterId] || 0) + 1 },
          }));
        }
      }
      // Save-and-add-another: a create keeps the inline input open + cleared (it
      // stays focused since it never unmounts) so the next name is just type+Enter.
      // A rename closes the editor.
      if (isCreate) setNameEdit(ne => ({ ...ne, value: '' }));
      else setNameEdit(null);
    } catch (err) { setError(err.message); }
  }

  // ── Reorder: normalize sort_order = index across the whole list ──────────
  // (fresh rows all default to sort_order 0, so pairwise swaps alone could
  // interleave wrongly — writing indices for every changed row is robust)

  async function reorderRows(endpoint, list, index, dir, applyLocal) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const newList = [...list];
    [newList[index], newList[j]] = [newList[j], newList[index]];
    const normalized = newList.map((row, i) => ({ ...row, sort_order: i }));
    const prevById = new Map(list.map(r => [r.id, r.sort_order]));
    const changed  = normalized.filter(row => prevById.get(row.id) !== row.sort_order);
    applyLocal(normalized); // optimistic
    try {
      await Promise.all(changed.map(async row => {
        const res = await apiCall(`${endpoint}/${row.id}`, { method: 'PUT', body: JSON.stringify({ sort_order: row.sort_order }) });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Reorder failed');
        }
      }));
    } catch (err) {
      setError(err.message);
      applyLocal(list); // revert
    }
  }

  const reorderChapters = (i, dir) =>
    reorderRows('/admin/journey-chapters', chapters, i, dir, setChapters);
  const reorderLevels = (chapterId, i, dir) =>
    reorderRows('/admin/journey-levels', levelsByChapter[chapterId] || [], i, dir,
      arr => setLevelsByChapter(prev => ({ ...prev, [chapterId]: arr })));

  // "+ Add Level" from a chapter header: expand (lazy-loads levels) then open the
  // inline new-level input inside that chapter's body.
  function addLevelToChapter(chapterId) {
    if (!expandedIds.has(chapterId)) toggleChapter(chapterId);
    setNameEdit({ kind: 'level', id: null, chapterId, value: '' });
  }

  // ── Deletes (chapter / level / question share one confirm modal) ─────────

  async function handleDeleteItem() {
    const { kind, row, chapterId } = deleteItem;
    setError('');
    try {
      if (kind === 'chapter') {
        const res  = await apiCall(`/admin/journey-chapters/${row.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete chapter');
        setChapters(cs => cs.filter(c => c.id !== row.id));
        setBossQs(qs => qs.filter(q => q.boss_key !== `chapter:${row.id}`));
        setLevelsByChapter(prev => { const next = { ...prev }; delete next[row.id]; return next; });
        setCounts(c => { const chapters = { ...c.chapters }; delete chapters[row.id]; return { ...c, chapters }; });
        setExpandedIds(prev => { const next = new Set(prev); next.delete(row.id); return next; });
      } else if (kind === 'level') {
        const res  = await apiCall(`/admin/journey-levels/${row.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete level');
        setLevelsByChapter(prev => ({ ...prev, [chapterId]: (prev[chapterId] || []).filter(l => l.id !== row.id) }));
        setCounts(c => {
          const levels = { ...c.levels }; delete levels[row.id];
          return { ...c, levels, chapters: { ...c.chapters, [chapterId]: Math.max(0, (c.chapters[chapterId] || 0) - 1) } };
        });
      } else {
        const base = selected?.kind === 'level' ? '/admin/journey-questions' : '/admin/boss-questions';
        const res  = await apiCall(`${base}/${row.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete question');
        if (selected?.kind === 'level') {
          setLevelQs(qs => qs.filter(q => q.id !== row.id));
          const lid = selected.level.id;
          setCounts(c => ({ ...c, levels: { ...c.levels, [lid]: Math.max(0, (c.levels[lid] || 0) - 1) } }));
        } else {
          setBossQs(qs => qs.filter(q => q.id !== row.id));
        }
        if (editing?.id === row.id) resetForm();
      }
      setDeleteItem(null);
    } catch (err) { setError(err.message); setDeleteItem(null); }
  }

  // ── Editor open / question form (form mechanics reused from J2) ──────────

  function resetForm() {
    setEditing(null);
    setForm(BOSS_EMPTY_FORM);
  }

  async function openLevel(level, chapter) {
    setError('');
    resetForm();
    setSelected({ kind: 'level', level, chapter });
    setLevelQs([]);
    try {
      const res  = await apiCall(`/admin/journey-questions?level_id=${level.id}`);
      const data = await res.json();
      setLevelQs(data.questions || []);
    } catch { setLevelQs([]); }
  }

  function openBoss(chapter) { setError(''); resetForm(); setSelected({ kind: 'boss', chapter }); }
  function openUltimate()    { setError(''); resetForm(); setSelected({ kind: 'ultimate' }); }

  const bossKeyFor = (sel) => sel.kind === 'ultimate' ? 'ultimate' : `chapter:${sel.chapter.id}`;
  const editorQuestions = !selected ? [] :
    selected.kind === 'level' ? levelQs : bossQs.filter(q => q.boss_key === bossKeyFor(selected));

  // Paste & Parse bulk import: sequential POSTs to the selected target.
  // Never aborts on failure — collects errors and reports an honest summary.
  async function importParsed(parsedQuestions) {
    const isLevel  = selected.kind === 'level';
    const base     = isLevel ? '/admin/journey-questions' : '/admin/boss-questions';
    const idFields = isLevel
      ? { level_id: selected.level.id }
      : { subject, boss_key: bossKeyFor(selected) };
    const existingCount = editorQuestions.length;
    let imported = 0;
    const errors = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      try {
        const res = await apiCall(base, {
          method: 'POST',
          body: JSON.stringify({
            ...idFields,
            question: q.question,
            options: q.choices,             // parser emits letter-prefixed choices
            correct: q.correct,
            explanation: q.explanation || null,
            why_others_wrong: q.why_others_wrong || null,
            image_url: q.image_url || null,
            sort_order: existingCount + i,  // preserve paste order
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Import failed');
        if (isLevel) setLevelQs(qs => [...qs, data]);
        else setBossQs(qs => [...qs, data]);
        imported++;
      } catch (err) {
        errors.push(`Q${i + 1} ("${q.question.slice(0, 40)}…"): ${err.message}`);
      }
    }
    if (isLevel && imported > 0) {
      const lid = selected.level.id;
      setCounts(c => ({ ...c, levels: { ...c.levels, [lid]: (c.levels[lid] || 0) + imported } }));
    }
    return { imported, failed: errors.length, errors };
  }

  function startEdit(q) {
    setError('');
    setEditing(q);
    setForm({
      question: q.question,
      optionA: q.options[0] || '',
      optionB: q.options[1] || '',
      optionC: q.options[2] || '',
      optionD: q.options[3] || '',
      optionE: q.options[4] || '',
      optionF: q.options[5] || '',
      correct: q.correct || 'A',
      explanation: q.explanation || '',
      why_others_wrong: typeof q.why_others_wrong === 'string' ? q.why_others_wrong : '',
      explanation_image_url: q.explanation_image_url || '',
    });
  }

  // Letters offered by the correct-select: A-D always, E/F once filled
  const offeredLetters = BOSS_LETTERS.filter((l, i) => i < 4 || form[`option${l}`].trim() !== '');
  const assembledOptions = BOSS_LETTERS.map(l => form[`option${l}`].trim()).filter(o => o !== '');
  const canSave = !saving && form.question.trim() && assembledOptions.length >= 2 && offeredLetters.includes(form.correct);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const isLevel = selected.kind === 'level';
    const base    = isLevel ? '/admin/journey-questions' : '/admin/boss-questions';
    const applyQs = isLevel ? setLevelQs : setBossQs;
    try {
      let res, data;
      if (editing) {
        // PUT changed fields only — server validates the merged row
        const body = {};
        if (form.question.trim() !== editing.question) body.question = form.question.trim();
        if (JSON.stringify(assembledOptions) !== JSON.stringify(editing.options)) body.options = assembledOptions;
        if (form.correct !== editing.correct) body.correct = form.correct;
        if (form.explanation.trim() !== (editing.explanation || '')) body.explanation = form.explanation.trim() || null;
        const prevWhy = typeof editing.why_others_wrong === 'string' ? editing.why_others_wrong : '';
        if (form.why_others_wrong.trim() !== prevWhy) body.why_others_wrong = form.why_others_wrong.trim() || null;
        if ((form.explanation_image_url || '') !== (editing.explanation_image_url || '')) body.explanation_image_url = form.explanation_image_url || null;
        if (Object.keys(body).length === 0) { resetForm(); setSaving(false); return; }
        res  = await apiCall(`${base}/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save question');
        applyQs(qs => qs.map(q => q.id === editing.id ? data : q));
      } else {
        const idFields = isLevel
          ? { level_id: selected.level.id }
          : { subject, boss_key: bossKeyFor(selected) };
        const body = {
          ...idFields,
          question: form.question.trim(),
          options: assembledOptions,
          correct: form.correct,
          explanation: form.explanation.trim() || null,
          why_others_wrong: form.why_others_wrong.trim() || null,
          explanation_image_url: form.explanation_image_url || null,
        };
        res  = await apiCall(base, { method: 'POST', body: JSON.stringify(body) });
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add question');
        applyQs(qs => [...qs, data]);
        if (isLevel) {
          const lid = selected.level.id;
          setCounts(c => ({ ...c, levels: { ...c.levels, [lid]: (c.levels[lid] || 0) + 1 } }));
        }
      }
      resetForm();
    } catch (err) { setError(err.message); }
    setSaving(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const folder = JOURNEY_SUBJECTS.find(s => s.id === subject);
  const ultCount = bossQs.filter(q => q.boss_key === 'ultimate').length;

  const renderNameInput = (placeholder) => (
    <span className="ap-jtree-nameedit">
      <input
        autoFocus
        value={nameEdit.value}
        placeholder={placeholder}
        onChange={e => setNameEdit(ne => ({ ...ne, value: e.target.value }))}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); saveName(); }
          if (e.key === 'Escape') setNameEdit(null);
        }}
      />
      <button className="ap-btn-pri" onClick={saveName} disabled={!nameEdit.value.trim()}>✓</button>
      <button className="ap-btn-sec" onClick={() => setNameEdit(null)}>✕</button>
    </span>
  );

  const editorTitle = !selected ? '' :
    selected.kind === 'level'
      ? `${selected.chapter.name} › 📄 ${selected.level.name}`
      : selected.kind === 'boss'
        ? `⚔ ${selected.chapter.name} Boss`
        : '👑 Ultimate Boss';

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>;

  return (
    <div className="ap-panel ap-journey-admin">
      <div className="ap-panel-head ap-journey-head">
        <span className="ap-journey-head-icon">🚑</span>
        <h2>First Aid Journey</h2>
      </div>

      {/* Subject scope (no difficulty in the journey) — authoring works for hidden subjects too.
          Kept at the top so the dropdown + chapter tree are immediately reachable. */}
      <div className="ap-journey-scope">
        <div className="ap-field">
          <label>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            {JOURNEY_SUBJECTS.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.label}{activeIds.has(s.id) ? '' : ' (hidden)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ⚙ Journey Settings: map background + active subjects, tucked away (collapsed by default) */}
      <div className="ap-journey-settings">
        <button
          type="button"
          className="ap-journey-settings-toggle"
          onClick={() => setSettingsOpen(o => !o)}
          aria-expanded={settingsOpen}
        >
          <span>⚙ Journey Settings</span>
          <span className="ap-journey-settings-chevron">{settingsOpen ? '▾' : '▸'}</span>
        </button>

        {settingsOpen && (
          <div className="ap-journey-settings-body">
            {/* Journey map background (landing-images slot 'journey_bg') */}
            <div className="li-slot ap-journey-bg" style={{ maxWidth: 440, marginBottom: 18 }}>
              <div className="li-slot-header">
                <span className="li-slot-label">Journey Map Background</span>
                <span className="li-slot-desc">Full backdrop behind the player's parchment map. JPG/PNG/WEBP, under 5MB.</span>
              </div>

              <div className="li-slot-preview">
                {bgUrl ? (
                  <img src={bgUrl} alt="Journey background" className="li-slot-img" />
                ) : (
                  <div className="li-slot-empty">
                    <span className="li-slot-empty-icon">🖼️</span>
                    <span>No image uploaded</span>
                  </div>
                )}
              </div>

              {bgError && <div className="ap-error">{bgError}</div>}

              <div className="li-slot-actions">
                <label className={`li-upload-btn ${bgBusy ? 'uploading' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => { handleBgUpload(e.target.files?.[0]); e.target.value = ''; }}
                    disabled={bgBusy}
                    style={{ display: 'none' }}
                  />
                  {bgBusy ? 'Working…' : '📤 Upload Image'}
                </label>

                {bgUrl && (
                  <button className="li-remove-btn" onClick={handleBgRemove} disabled={bgBusy}>
                    🗑 Remove
                  </button>
                )}
              </div>
            </div>

            {/* Journey-only activate/deactivate (gameSettings.journeyActiveSubjects) */}
            <div className="ap-settings-section" style={{ maxWidth: 640 }}>
              <div className="ap-section-hd">
                <div className="ap-section-icon">🗺️</div>
                <div>
                  <h2 className="ap-section-title-lg">Active Subjects</h2>
                  <p className="ap-section-subtitle">Players only see active subjects on the Journey page. Hidden subjects can still be authored below.</p>
                </div>
              </div>
              {JOURNEY_SECTIONS.map(sec => (
                <div key={sec.id} className="ap-settings-rows">
                  <h3 className="ap-journey-section-label">{sec.label}</h3>
                  {JOURNEY_SUBJECTS.filter(s => s.section === sec.id).map(s => (
                    <ToggleRow
                      key={s.id}
                      label={`${s.icon} ${s.label}`}
                      desc={activeIds.has(s.id) ? 'Visible on the player Journey page' : 'Hidden from players'}
                      checked={activeIds.has(s.id)}
                      onChange={on => toggleSubjectActive(s.id, on)}
                    />
                  ))}
                </div>
              ))}
              <SectionSaveBtn saving={actSaving} saved={actSaved} error={actError} onSave={saveActiveSubjects} />
            </div>
          </div>
        )}
      </div>

      {error && <div className="ap-error">{error}</div>}

      {!selected ? (
        /* ── CHAPTER CARDS: chapters → levels + bosses ────────────── */
        <>
          {chapters.length === 0 && !(nameEdit?.kind === 'chapter' && !nameEdit.id) ? (
            <div className="ap-topic-empty">
              <div className="ap-topic-empty-icon">🚑</div>
              <p>No chapters yet for {folder?.label}. Create the first chapter to start building the journey.</p>
              <button className="ap-btn-pri" onClick={() => setNameEdit({ kind: 'chapter', id: null, value: '' })}>
                ➕ Add Chapter
              </button>
            </div>
          ) : (
            <div className="ap-jcards">
              {chapters.map((ch, i) => {
                const expanded   = expandedIds.has(ch.id);
                const levels     = levelsByChapter[ch.id];
                const bossCount  = bossQs.filter(q => q.boss_key === `chapter:${ch.id}`).length;
                // Loaded level array is authoritative when open; counts map covers collapsed chapters
                const levelCount = levels?.length ?? counts.chapters[ch.id] ?? 0;
                const renaming   = nameEdit?.kind === 'chapter' && nameEdit.id === ch.id;
                return (
                  <div className={`ap-jcard${expanded ? ' is-open' : ''}`} key={ch.id}>
                    <div className="ap-jcard-head">
                      <span className="ap-jcard-icon">📖</span>
                      {renaming ? (
                        <div className="ap-jcard-rename">{renderNameInput('Chapter name')}</div>
                      ) : (
                        <button className="ap-jcard-title" onClick={() => toggleChapter(ch.id)}>
                          <span className="ap-jcard-name">Chapter {i + 1}: {ch.name}</span>
                          <span className="ap-jcard-sub">{levelCount} level{levelCount !== 1 ? 's' : ''}</span>
                        </button>
                      )}
                      {!renaming && (
                        <div className="ap-jcard-actions">
                          <button className="ap-jcard-addlevel" onClick={() => addLevelToChapter(ch.id)} title="Add a level to this chapter">
                            + Add Level
                          </button>
                          <span className="ap-jreorder">
                            <button className="ap-jicon" onClick={() => reorderChapters(i, -1)} disabled={i === 0} title="Move chapter up">↑</button>
                            <button className="ap-jicon" onClick={() => reorderChapters(i, +1)} disabled={i === chapters.length - 1} title="Move chapter down">↓</button>
                          </span>
                          <button className="ap-jicon" onClick={() => setNameEdit({ kind: 'chapter', id: ch.id, value: ch.name })} title="Rename chapter">✏️</button>
                          <button className="ap-jicon ap-jicon-del" onClick={() => setDeleteItem({ kind: 'chapter', row: ch })} title="Delete chapter">🗑️</button>
                          <button className="ap-jicon ap-jcard-chevron" onClick={() => toggleChapter(ch.id)} title={expanded ? 'Collapse' : 'Expand'}>{expanded ? '▾' : '▸'}</button>
                        </div>
                      )}
                    </div>

                    {expanded && (
                      <div className="ap-jcard-body">
                        {levels === undefined ? (
                          <div className="ap-jtree-note">Loading levels…</div>
                        ) : (
                          <>
                            {levels.map((lv, li) => {
                              const qCount = counts.levels[lv.id] ?? 0;
                              const lvRenaming = nameEdit?.kind === 'level' && nameEdit.id === lv.id;
                              return (
                              <div className="ap-jlevel" key={lv.id}>
                                <span className="ap-jlevel-num">{li + 1}</span>
                                {lvRenaming ? (
                                  <div className="ap-jlevel-rename">{renderNameInput('Level name')}</div>
                                ) : (
                                  <button className="ap-jlevel-name" onClick={() => openLevel(lv, ch)}>
                                    Level {li + 1}: {lv.name}
                                  </button>
                                )}
                                {!lvRenaming && (
                                  <div className="ap-jlevel-right">
                                    {qCount > 0
                                      ? <span className="ap-jpill">{qCount} question{qCount !== 1 ? 's' : ''}</span>
                                      : <span className="ap-jpill ap-jpill--empty">needs questions</span>}
                                    <span className="ap-jreorder">
                                      <button className="ap-jicon" onClick={() => reorderLevels(ch.id, li, -1)} disabled={li === 0} title="Move level up">↑</button>
                                      <button className="ap-jicon" onClick={() => reorderLevels(ch.id, li, +1)} disabled={li === levels.length - 1} title="Move level down">↓</button>
                                    </span>
                                    <button className="ap-jicon" onClick={() => setNameEdit({ kind: 'level', id: lv.id, chapterId: ch.id, value: lv.name })} title="Rename level">✏️</button>
                                    <button className="ap-jicon ap-jicon-del" onClick={() => setDeleteItem({ kind: 'level', row: lv, chapterId: ch.id })} title="Delete level">🗑️</button>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                            {levels.length === 0 && !(nameEdit?.kind === 'level' && !nameEdit.id && nameEdit.chapterId === ch.id) && (
                              <div className="ap-jtree-note">No levels yet — add the first one.</div>
                            )}
                            {nameEdit?.kind === 'level' && !nameEdit.id && nameEdit.chapterId === ch.id ? (
                              <div className="ap-jlevel ap-jlevel--new">{renderNameInput('New level name')}</div>
                            ) : (
                              <button className="ap-jadd" onClick={() => addLevelToChapter(ch.id)}>
                                + Add Level
                              </button>
                            )}

                            <button className="ap-jboss" onClick={() => openBoss(ch)}>
                              <span className="ap-jboss-label"><span className="ap-jboss-icon">⚔️</span> Chapter Boss</span>
                              {bossCount > 0
                                ? <span className="ap-jpill">{bossCount} question{bossCount !== 1 ? 's' : ''}</span>
                                : <span className="ap-jboss-skip">⚡ Auto-skips in game</span>}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {chapters.length > 0 && (
            nameEdit?.kind === 'chapter' && !nameEdit.id ? (
              <div className="ap-jcard ap-jcard--new">{renderNameInput('New chapter name')}</div>
            ) : (
              <button className="ap-jadd ap-jadd--chapter" onClick={() => setNameEdit({ kind: 'chapter', id: null, value: '' })}>
                + Add Chapter
              </button>
            )
          )}
          {chapters.length === 0 && nameEdit?.kind === 'chapter' && !nameEdit.id && (
            <div className="ap-jcard ap-jcard--new">{renderNameInput('New chapter name')}</div>
          )}

          <button className="ap-jultimate" onClick={openUltimate}>
            <span className="ap-jultimate-icon">👑</span>
            <span className="ap-jultimate-text">
              <span className="ap-jultimate-name">Ultimate Boss</span>
              {ultCount > 0
                ? <span className="ap-jultimate-meta">{ultCount} question{ultCount !== 1 ? 's' : ''}</span>
                : <span className="ap-jultimate-skip">⚡ Auto-skips in game</span>}
            </span>
            <span className="ap-jultimate-chevron">›</span>
          </button>
        </>
      ) : (
        /* ── EDITOR: shared question form + list ──────────────────── */
        <>
          <div className="ap-journey-editor-head">
            <button className="ap-btn-back" onClick={() => { setError(''); resetForm(); setSelected(null); }}>← Back</button>
            <span className="ap-journey-editor-title">
              {folder?.icon} {folder?.label} › {editorTitle}
            </span>
            <button className="ap-btn-sec ap-journey-parse-btn" onClick={() => setShowParser(true)}>
              📋 Paste &amp; Parse
            </button>
          </div>

          <form onSubmit={handleSave} className="ap-qform ap-video-form">
            <h3 className="ap-video-form-title">{editing ? '✏️ Edit Question' : '➕ Add Question'}</h3>

            <div className="ap-field">
              <label>Question</label>
              <textarea
                value={form.question}
                onChange={e => set('question', e.target.value)}
                placeholder="Question text…"
                rows={3}
              />
            </div>

            <div className="ap-options-grid">
              {BOSS_LETTERS.map((l, idx) => {
                const isRequired = idx < 4;
                const hasValue = form[`option${l}`].trim() !== '';
                const showField = isRequired || hasValue || (idx > 0 && form[`option${BOSS_LETTERS[idx - 1]}`].trim() !== '');
                if (!showField) return null;
                return (
                  <div key={l} className="ap-field">
                    <label>
                      <span className={`ap-letter ${l === form.correct ? 'ap-letter-correct' : 'ap-letter-plain'}`}>{l}</span>
                      {' '}Answer {l}
                      {!isRequired && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}> (optional)</span>}
                    </label>
                    <input
                      type="text"
                      value={form[`option${l}`]}
                      onChange={e => set(`option${l}`, e.target.value)}
                      placeholder={`Answer choice ${l}`}
                      required={isRequired}
                    />
                  </div>
                );
              })}
            </div>

            <div className="ap-field">
              <label>Correct Answer</label>
              <select value={form.correct} onChange={e => set('correct', e.target.value)}>
                {offeredLetters.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="ap-field">
              <label>Explanation</label>
              <textarea
                value={form.explanation}
                onChange={e => set('explanation', e.target.value)}
                placeholder="Explain why the correct answer is correct…"
                rows={3}
              />
            </div>

            <div className="ap-field">
              <label>Why Others Are Wrong <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>(optional)</span></label>
              <textarea
                value={form.why_others_wrong}
                onChange={e => set('why_others_wrong', e.target.value)}
                placeholder="Explain why each incorrect option is wrong..."
                rows={3}
              />
              {form.why_others_wrong && (
                <div className="explanation-preview">
                  <p className="explanation-preview-label">Preview:</p>
                  <div className="explanation-rich explanation-preview-box">
                    {parseRichText(form.why_others_wrong)}
                  </div>
                </div>
              )}
            </div>

            <ExplanationImageField value={form.explanation_image_url} onChange={url => set('explanation_image_url', url)} />

            <div className="ap-video-form-actions">
              {editing && <button type="button" className="ap-btn-sec" onClick={() => { setError(''); resetForm(); }}>Cancel</button>}
              <button type="submit" className="ap-btn-pri" disabled={!canSave}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Question'}
              </button>
            </div>
          </form>

          {editorQuestions.length === 0 ? (
            <div className="ap-topic-empty">
              <div className="ap-topic-empty-icon">{selected.kind === 'level' ? '📄' : selected.kind === 'boss' ? '⚔' : '👑'}</div>
              <p>
                {selected.kind === 'level'
                  ? "Players can't pass a level with no questions — add some."
                  : 'No questions yet — this boss auto-skips in game until you add some.'}
              </p>
            </div>
          ) : (
            <div className="ap-journey-q-list">
              <p className="ap-journey-q-caption">
                {editorQuestions.length} question{editorQuestions.length !== 1 ? 's' : ''}
              </p>
              {editorQuestions.map(q => (
                <div className="ap-journey-q-row" key={q.id}>
                  <span className="ap-journey-q-correct">{q.correct}</span>
                  <span className="ap-journey-q-text">{q.question}</span>
                  <div className="ap-video-row-actions">
                    <button className="ap-topic-edit-btn" onClick={() => startEdit(q)} title="Edit">✏️</button>
                    <button className="ap-topic-del-btn" onClick={() => setDeleteItem({ kind: 'question', row: q })} title="Delete">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {deleteItem && (
        <div className="ap-backdrop" onClick={() => setDeleteItem(null)}>
          <div className="ap-confirm" onClick={e => e.stopPropagation()}>
            <div className="ap-confirm-icon">{deleteItem.kind === 'chapter' ? '🗂️' : deleteItem.kind === 'level' ? '📄' : '🚑'}</div>
            <h3>
              {deleteItem.kind === 'chapter' ? `Delete chapter "${deleteItem.row.name}"?`
                : deleteItem.kind === 'level' ? `Delete level "${deleteItem.row.name}"?`
                : 'Delete this question?'}
            </h3>
            <p>
              {deleteItem.kind === 'chapter'
                ? 'Deletes this chapter, all its levels and their questions, and its boss questions.'
                : deleteItem.kind === 'level'
                  ? 'Deletes this level and all its questions.'
                  : `"${deleteItem.row.question.slice(0, 80)}${deleteItem.row.question.length > 80 ? '…' : ''}"`}
            </p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDeleteItem}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showParser && selected && (
        <QuestionParser
          activeFolder={subject}
          selectedTopic={null}
          selectedDifficulty="easy"
          customImport={importParsed}
          onImport={() => {}}
          onClose={() => setShowParser(false)}
        />
      )}
    </div>
  );
}

// ── First Aid Journey: clean inline editor (Question Manager sidebar) ──────────
// From-scratch, fully inline: subject -> chapters -> levels -> questions, all
// expanding in place (no view-swapping). Reuses the existing journey endpoints,
// the shared QuestionParser, and the standard question-form idioms.
function JourneyEditor() {
  const [subject,  setSubject]  = useState(JOURNEY_SUBJECTS[0].id);
  const [chapters, setChapters] = useState([]);
  const [bossQs,   setBossQs]   = useState([]);                       // all boss questions for the subject
  const [counts,   setCounts]   = useState({ levels: {}, chapters: {}, bosses: {} });
  const [levelsByChapter,   setLevelsByChapter]   = useState({});     // chapter_id -> levels[] (lazy)
  const [questionsByLevel,  setQuestionsByLevel]  = useState({});     // level_id   -> questions[] (lazy)
  const [expandedChapters,  setExpandedChapters]  = useState(() => new Set());
  const [expandedTargets,   setExpandedTargets]   = useState(() => new Set()); // 'level:ID' | 'boss:KEY'
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // Inline create/rename: { kind:'chapter'|'level', id, chapterId?, value }
  const [nameEdit,   setNameEdit]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null); // { kind, row, chapterId?, target? }

  // One shared question form across targets (only one open at a time)
  const [qEditor, setQEditor] = useState(null); // { targetKey, target, mode:'add'|'edit', id? }
  const [form,    setForm]    = useState(BOSS_EMPTY_FORM);
  const [qSaving, setQSaving] = useState(false);
  const [parserTarget, setParserTarget] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { loadSubject(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [subject]);

  async function loadSubject() {
    setLoading(true); setError('');
    setExpandedChapters(new Set()); setExpandedTargets(new Set());
    setLevelsByChapter({}); setQuestionsByLevel({});
    setNameEdit(null); closeForm();
    try {
      const [chRes, bossRes, countRes] = await Promise.all([
        apiCall(`/admin/journey-chapters?subject=${encodeURIComponent(subject)}`),
        apiCall(`/admin/boss-questions?subject=${encodeURIComponent(subject)}`),
        apiCall(`/admin/journey-counts?subject=${encodeURIComponent(subject)}`),
      ]);
      const chData    = await chRes.json();
      const bossData  = await bossRes.json();
      const countData = await countRes.json();
      if (!chRes.ok) throw new Error(chData.error || 'Failed to load chapters');
      setChapters(chData.chapters || []);
      setBossQs(bossData.questions || []);
      setCounts({ levels: countData.levels || {}, chapters: countData.chapters || {}, bosses: countData.bosses || {} });
    } catch (err) {
      setError(err.message); setChapters([]); setBossQs([]); setCounts({ levels: {}, chapters: {}, bosses: {} });
    }
    setLoading(false);
  }

  // ── Target helpers (a "target" is a level or a boss that owns questions) ──────
  const targetKey       = (t) => t.kind === 'level' ? `level:${t.levelId}` : `boss:${t.bossKey}`;
  const targetBase      = (t) => t.kind === 'level' ? '/admin/journey-questions' : '/admin/boss-questions';
  const targetIdFields  = (t) => t.kind === 'level' ? { level_id: t.levelId } : { subject, boss_key: t.bossKey };
  const targetQuestions = (t) => t.kind === 'level' ? (questionsByLevel[t.levelId] || []) : bossQs.filter(q => q.boss_key === t.bossKey);

  // ── Expansion (lazy-load + cache) ─────────────────────────────────────────────
  async function toggleChapter(id) {
    const open = expandedChapters.has(id);
    setExpandedChapters(prev => { const n = new Set(prev); if (open) n.delete(id); else n.add(id); return n; });
    if (!open && !(id in levelsByChapter)) {
      try {
        const res  = await apiCall(`/admin/journey-levels?chapter_id=${id}`);
        const data = await res.json();
        setLevelsByChapter(prev => ({ ...prev, [id]: data.levels || [] }));
      } catch { setLevelsByChapter(prev => ({ ...prev, [id]: [] })); }
    }
  }

  async function toggleTarget(target) {
    const key  = targetKey(target);
    const open = expandedTargets.has(key);
    setExpandedTargets(prev => { const n = new Set(prev); if (open) n.delete(key); else n.add(key); return n; });
    if (!open && target.kind === 'level' && !(target.levelId in questionsByLevel)) {
      try {
        const res  = await apiCall(`/admin/journey-questions?level_id=${target.levelId}`);
        const data = await res.json();
        setQuestionsByLevel(prev => ({ ...prev, [target.levelId]: data.questions || [] }));
      } catch { setQuestionsByLevel(prev => ({ ...prev, [target.levelId]: [] })); }
    }
  }

  // ── Chapter / level create + rename (save-and-add-another on create) ──────────
  async function saveName() {
    const { kind, id, chapterId } = nameEdit;
    const name = nameEdit.value.trim();
    if (!name) return;
    setError('');
    const isCreate = !id;
    try {
      if (kind === 'chapter') {
        if (id) {
          const res  = await apiCall(`/admin/journey-chapters/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Rename failed');
          setChapters(cs => cs.map(c => c.id === id ? data : c));
        } else {
          const res  = await apiCall('/admin/journey-chapters', { method: 'POST', body: JSON.stringify({ subject, name, sort_order: chapters.length }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Create failed');
          setChapters(cs => [...cs, data]);
          setCounts(c => ({ ...c, chapters: { ...c.chapters, [data.id]: 0 } }));
        }
      } else {
        if (id) {
          const res  = await apiCall(`/admin/journey-levels/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Rename failed');
          setLevelsByChapter(prev => ({ ...prev, [chapterId]: (prev[chapterId] || []).map(l => l.id === id ? data : l) }));
        } else {
          const res  = await apiCall('/admin/journey-levels', { method: 'POST', body: JSON.stringify({ chapter_id: chapterId, name, sort_order: (levelsByChapter[chapterId] || []).length }) });
          const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Create failed');
          setLevelsByChapter(prev => ({ ...prev, [chapterId]: [...(prev[chapterId] || []), data] }));
          setCounts(c => ({ ...c, levels: { ...c.levels, [data.id]: 0 }, chapters: { ...c.chapters, [chapterId]: (c.chapters[chapterId] || 0) + 1 } }));
        }
      }
      // A create keeps the inline input open + cleared (stays focused) for rapid entry; a rename closes.
      if (isCreate) setNameEdit(ne => ({ ...ne, value: '' })); else setNameEdit(null);
    } catch (err) { setError(err.message); }
  }

  // ── Deletes (chapter / level / question share one confirm modal) ──────────────
  async function handleDeleteItem() {
    const { kind, row, chapterId, target } = deleteItem;
    setError('');
    try {
      if (kind === 'chapter') {
        const res  = await apiCall(`/admin/journey-chapters/${row.id}`, { method: 'DELETE' });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Delete failed');
        setChapters(cs => cs.filter(c => c.id !== row.id));
        setBossQs(qs => qs.filter(q => q.boss_key !== `chapter:${row.id}`));
        setLevelsByChapter(prev => { const n = { ...prev }; delete n[row.id]; return n; });
        setCounts(c => { const ch = { ...c.chapters }; delete ch[row.id]; return { ...c, chapters: ch }; });
        setExpandedChapters(prev => { const n = new Set(prev); n.delete(row.id); return n; });
      } else if (kind === 'level') {
        const res  = await apiCall(`/admin/journey-levels/${row.id}`, { method: 'DELETE' });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Delete failed');
        setLevelsByChapter(prev => ({ ...prev, [chapterId]: (prev[chapterId] || []).filter(l => l.id !== row.id) }));
        setQuestionsByLevel(prev => { const n = { ...prev }; delete n[row.id]; return n; });
        setCounts(c => {
          const lv = { ...c.levels }; delete lv[row.id];
          return { ...c, levels: lv, chapters: { ...c.chapters, [chapterId]: Math.max(0, (c.chapters[chapterId] || 0) - 1) } };
        });
        setExpandedTargets(prev => { const n = new Set(prev); n.delete(`level:${row.id}`); return n; });
      } else { // question
        const t    = target;
        const res  = await apiCall(`${targetBase(t)}/${row.id}`, { method: 'DELETE' });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Delete failed');
        if (t.kind === 'level') {
          setQuestionsByLevel(prev => ({ ...prev, [t.levelId]: (prev[t.levelId] || []).filter(q => q.id !== row.id) }));
          setCounts(c => ({ ...c, levels: { ...c.levels, [t.levelId]: Math.max(0, (c.levels[t.levelId] || 0) - 1) } }));
        } else {
          setBossQs(qs => qs.filter(q => q.id !== row.id));
        }
        if (qEditor?.mode === 'edit' && qEditor.id === row.id) closeForm();
      }
      setDeleteItem(null);
    } catch (err) { setError(err.message); setDeleteItem(null); }
  }

  // ── Question form ─────────────────────────────────────────────────────────────
  function closeForm() { setQEditor(null); setForm(BOSS_EMPTY_FORM); }
  function openAdd(target) { setError(''); setForm(BOSS_EMPTY_FORM); setQEditor({ targetKey: targetKey(target), target, mode: 'add' }); }
  function openEdit(target, q) {
    setError('');
    setForm({
      question: q.question,
      optionA: q.options[0] || '', optionB: q.options[1] || '', optionC: q.options[2] || '',
      optionD: q.options[3] || '', optionE: q.options[4] || '', optionF: q.options[5] || '',
      correct: q.correct || 'A',
      explanation: q.explanation || '',
      why_others_wrong: typeof q.why_others_wrong === 'string' ? q.why_others_wrong : '',
      explanation_image_url: q.explanation_image_url || '',
    });
    setQEditor({ targetKey: targetKey(target), target, mode: 'edit', id: q.id });
  }

  const offeredLetters   = BOSS_LETTERS.filter((l, i) => i < 4 || form[`option${l}`].trim() !== '');
  const assembledOptions = BOSS_LETTERS.map(l => form[`option${l}`].trim()).filter(o => o !== '');
  const canSaveQ = !qSaving && form.question.trim() && assembledOptions.length >= 2 && offeredLetters.includes(form.correct);

  async function saveQuestion(e) {
    e.preventDefault();
    if (!qEditor) return;
    const t = qEditor.target;
    setError(''); setQSaving(true);
    const fields = {
      question: form.question.trim(),
      options: assembledOptions,
      correct: form.correct,
      explanation: form.explanation.trim() || null,
      why_others_wrong: form.why_others_wrong.trim() || null,
      explanation_image_url: form.explanation_image_url || null,
    };
    try {
      if (qEditor.mode === 'edit') {
        const res  = await apiCall(`${targetBase(t)}/${qEditor.id}`, { method: 'PUT', body: JSON.stringify(fields) });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Save failed');
        if (t.kind === 'level') setQuestionsByLevel(prev => ({ ...prev, [t.levelId]: (prev[t.levelId] || []).map(q => q.id === data.id ? data : q) }));
        else setBossQs(qs => qs.map(q => q.id === data.id ? data : q));
      } else {
        const res  = await apiCall(targetBase(t), { method: 'POST', body: JSON.stringify({ ...targetIdFields(t), ...fields }) });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Add failed');
        if (t.kind === 'level') {
          setQuestionsByLevel(prev => ({ ...prev, [t.levelId]: [...(prev[t.levelId] || []), data] }));
          setCounts(c => ({ ...c, levels: { ...c.levels, [t.levelId]: (c.levels[t.levelId] || 0) + 1 } }));
        } else {
          setBossQs(qs => [...qs, data]);
        }
      }
      closeForm();
    } catch (err) { setError(err.message); }
    setQSaving(false);
  }

  // Paste & Parse: sequential POSTs to the parser's target; honest error summary
  async function importParsed(parsed) {
    if (!parserTarget) return { imported: 0, failed: 0, errors: [] };
    const t = parserTarget;
    const existing = targetQuestions(t).length;
    let imported = 0;
    const errors = [];
    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      try {
        const res = await apiCall(targetBase(t), {
          method: 'POST',
          body: JSON.stringify({
            ...targetIdFields(t),
            question: q.question,
            options: q.choices,
            correct: q.correct,
            explanation: q.explanation || null,
            why_others_wrong: q.why_others_wrong || null,
            image_url: q.image_url || null,
            sort_order: existing + i,
          }),
        });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Import failed');
        if (t.kind === 'level') setQuestionsByLevel(prev => ({ ...prev, [t.levelId]: [...(prev[t.levelId] || []), data] }));
        else setBossQs(qs => [...qs, data]);
        imported++;
      } catch (err) {
        errors.push(`Q${i + 1} ("${q.question.slice(0, 40)}…"): ${err.message}`);
      }
    }
    if (t.kind === 'level' && imported > 0) {
      setCounts(c => ({ ...c, levels: { ...c.levels, [t.levelId]: (c.levels[t.levelId] || 0) + imported } }));
    }
    return { imported, failed: errors.length, errors };
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const folder = JOURNEY_SUBJECTS.find(s => s.id === subject);

  const renderNameInput = (placeholder) => (
    <span className="ap-jtree-nameedit">
      <input
        autoFocus
        value={nameEdit.value}
        placeholder={placeholder}
        onChange={e => setNameEdit(ne => ({ ...ne, value: e.target.value }))}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); saveName(); }
          if (e.key === 'Escape') setNameEdit(null);
        }}
      />
      <button className="ap-btn-pri" onClick={saveName} disabled={!nameEdit.value.trim()}>✓</button>
      <button className="ap-btn-sec" onClick={() => setNameEdit(null)}>✕</button>
    </span>
  );

  const renderQuestionForm = (target) => (
    <form onSubmit={saveQuestion} className="ap-qform je-qform">
      <h3 className="ap-video-form-title">{qEditor.mode === 'edit' ? '✏️ Edit Question' : '➕ Add Question'}</h3>
      <div className="ap-field">
        <label>Question</label>
        <textarea value={form.question} onChange={e => set('question', e.target.value)} placeholder="Question text…" rows={3} />
      </div>
      <div className="ap-options-grid">
        {BOSS_LETTERS.map((l, idx) => {
          const isRequired = idx < 4;
          const hasValue   = form[`option${l}`].trim() !== '';
          const showField  = isRequired || hasValue || (idx > 0 && form[`option${BOSS_LETTERS[idx - 1]}`].trim() !== '');
          if (!showField) return null;
          return (
            <div key={l} className="ap-field">
              <label>
                <span className={`ap-letter ${l === form.correct ? 'ap-letter-correct' : 'ap-letter-plain'}`}>{l}</span>
                {' '}Answer {l}
                {!isRequired && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}> (optional)</span>}
              </label>
              <input type="text" value={form[`option${l}`]} onChange={e => set(`option${l}`, e.target.value)} placeholder={`Answer choice ${l}`} required={isRequired} />
            </div>
          );
        })}
      </div>
      <div className="ap-field">
        <label>Correct Answer</label>
        <select value={form.correct} onChange={e => set('correct', e.target.value)}>
          {offeredLetters.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div className="ap-field">
        <label>Explanation</label>
        <textarea value={form.explanation} onChange={e => set('explanation', e.target.value)} placeholder="Explain why the correct answer is correct…" rows={3} />
      </div>
      <div className="ap-field">
        <label>Why Others Are Wrong <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>(optional)</span></label>
        <textarea value={form.why_others_wrong} onChange={e => set('why_others_wrong', e.target.value)} placeholder="Explain why each incorrect option is wrong..." rows={3} />
        {form.why_others_wrong && (
          <div className="explanation-preview">
            <p className="explanation-preview-label">Preview:</p>
            <div className="explanation-rich explanation-preview-box">{parseRichText(form.why_others_wrong)}</div>
          </div>
        )}
      </div>
      <ExplanationImageField value={form.explanation_image_url} onChange={url => set('explanation_image_url', url)} />
      <div className="ap-video-form-actions">
        <button type="button" className="ap-btn-sec" onClick={closeForm}>Cancel</button>
        <button type="submit" className="ap-btn-pri" disabled={!canSaveQ}>{qSaving ? 'Saving…' : qEditor.mode === 'edit' ? 'Save Changes' : 'Add Question'}</button>
      </div>
    </form>
  );

  const renderTargetBody = (target) => {
    if (target.kind === 'level' && !(target.levelId in questionsByLevel)) {
      return <div className="ap-jtree-note">Loading questions…</div>;
    }
    const key      = targetKey(target);
    const qs       = targetQuestions(target);
    const formHere = qEditor && qEditor.targetKey === key;
    return (
      <>
        {qs.length === 0 ? (
          <div className="ap-jtree-note">No questions yet{target.kind === 'level' ? ' — players cannot pass an empty level.' : ' — this boss auto-skips in game until you add some.'}</div>
        ) : (
          <div className="je-qlist">
            {qs.map(q => (
              <div className="ap-journey-q-row" key={q.id}>
                <span className="ap-journey-q-correct">{q.correct}</span>
                <span className="ap-journey-q-text">{q.question}</span>
                <div className="ap-video-row-actions">
                  <button className="ap-topic-edit-btn" onClick={() => openEdit(target, q)} title="Edit">✏️</button>
                  <button className="ap-topic-del-btn" onClick={() => setDeleteItem({ kind: 'question', row: q, target })} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {formHere ? renderQuestionForm(target) : (
          <div className="je-target-actions">
            <button className="ap-btn-pri" onClick={() => openAdd(target)}>➕ Add question</button>
            <button className="ap-btn-sec" onClick={() => setParserTarget(target)}>📋 Paste &amp; Parse</button>
          </div>
        )}
      </>
    );
  };

  const renderBossBlock = (target, label, cls) => {
    const open  = expandedTargets.has(targetKey(target));
    const count = targetQuestions(target).length;
    return (
      <div className={`je-bossblock ${cls}`}>
        <button className="je-boss-head" onClick={() => toggleTarget(target)}>
          <span className="je-caret">{open ? '▾' : '▸'}</span>
          <span className="je-boss-label">{label}</span>
          {count > 0
            ? <span className="ap-jtree-count">{count} question{count !== 1 ? 's' : ''}</span>
            : <span className="ap-journey-boss-hint">auto-skips in game</span>}
        </button>
        {open && <div className="je-target-body">{renderTargetBody(target)}</div>}
      </div>
    );
  };

  const renderLevel = (ch, lv, li) => {
    const target = { kind: 'level', levelId: lv.id, chapterId: ch.id };
    const open   = expandedTargets.has(targetKey(target));
    const qCount = counts.levels[lv.id] ?? 0;
    return (
      <div className="je-level" key={lv.id}>
        <div className="je-level-head">
          {nameEdit?.kind === 'level' && nameEdit.id === lv.id ? (
            <span className="je-level-nameedit">{renderNameInput('Level name')}</span>
          ) : (
            <button className="je-level-name" onClick={() => toggleTarget(target)}>
              <span className="je-caret">{open ? '▾' : '▸'}</span>
              📄 {li + 1}. {lv.name}
              {qCount > 0
                ? <span className="ap-jtree-count"> · {qCount} question{qCount !== 1 ? 's' : ''}</span>
                : <span className="ap-jtree-empty-badge">needs questions</span>}
            </button>
          )}
          <div className="je-row-actions">
            <button className="ap-topic-edit-btn" onClick={() => setNameEdit({ kind: 'level', id: lv.id, chapterId: ch.id, value: lv.name })} title="Rename">✏️</button>
            <button className="ap-topic-del-btn" onClick={() => setDeleteItem({ kind: 'level', row: lv, chapterId: ch.id })} title="Delete">🗑️</button>
          </div>
        </div>
        {open && <div className="je-target-body je-level-body">{renderTargetBody(target)}</div>}
      </div>
    );
  };

  const renderChapter = (ch, ci) => {
    const open       = expandedChapters.has(ch.id);
    const levels     = levelsByChapter[ch.id];
    const levelCount = levels?.length ?? counts.chapters[ch.id] ?? 0;
    return (
      <div className="je-chapter" key={ch.id}>
        <div className="je-chapter-head">
          <button className="je-expand" onClick={() => toggleChapter(ch.id)}>{open ? '▾' : '▸'}</button>
          {nameEdit?.kind === 'chapter' && nameEdit.id === ch.id ? (
            renderNameInput('Chapter name')
          ) : (
            <span className="je-chapter-name" onClick={() => toggleChapter(ch.id)}>
              Chapter {ci + 1}: {ch.name}
              <span className="ap-jtree-count"> · {levelCount} level{levelCount !== 1 ? 's' : ''}</span>
            </span>
          )}
          <div className="je-row-actions">
            <button className="ap-topic-edit-btn" onClick={() => setNameEdit({ kind: 'chapter', id: ch.id, value: ch.name })} title="Rename">✏️</button>
            <button className="ap-topic-del-btn" onClick={() => setDeleteItem({ kind: 'chapter', row: ch })} title="Delete">🗑️</button>
          </div>
        </div>
        {open && (
          <div className="je-chapter-body">
            {levels === undefined ? (
              <div className="ap-jtree-note">Loading levels…</div>
            ) : (
              <>
                {levels.map((lv, li) => renderLevel(ch, lv, li))}
                {levels.length === 0 && !(nameEdit?.kind === 'level' && !nameEdit.id && nameEdit.chapterId === ch.id) && (
                  <div className="ap-jtree-note">No levels yet — add the first one.</div>
                )}
                {nameEdit?.kind === 'level' && !nameEdit.id && nameEdit.chapterId === ch.id ? (
                  <div className="je-nameedit-row">{renderNameInput('New level name')}</div>
                ) : (
                  <button className="ap-jtree-add" onClick={() => setNameEdit({ kind: 'level', id: null, chapterId: ch.id, value: '' })}>➕ New Level</button>
                )}
                {renderBossBlock({ kind: 'boss', bossKey: `chapter:${ch.id}` }, '⚔ Chapter Boss', 'je-boss')}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="ap-loading"><div className="ap-spinner" /></div>;

  return (
    <div className="je-root">
      <div className="ap-panel-head">
        <h2>🚑 First Aid Journey</h2>
      </div>

      <div className="ap-journey-scope">
        <div className="ap-field">
          <label>Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}>
            {JOURNEY_SECTIONS.map(sec => (
              <optgroup key={sec.id} label={sec.label}>
                {JOURNEY_SUBJECTS.filter(s => s.section === sec.id).map(s => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="ap-error">{error}</div>}

      {chapters.length === 0 && !(nameEdit?.kind === 'chapter' && !nameEdit.id) ? (
        <div className="ap-topic-empty">
          <div className="ap-topic-empty-icon">🚑</div>
          <p>No chapters yet for {folder?.label}. Create the first chapter to start building the journey.</p>
          <button className="ap-btn-pri" onClick={() => setNameEdit({ kind: 'chapter', id: null, value: '' })}>➕ New Chapter</button>
        </div>
      ) : (
        <div className="je-chapters">
          {chapters.map((ch, ci) => renderChapter(ch, ci))}
        </div>
      )}

      {chapters.length > 0 && (
        nameEdit?.kind === 'chapter' && !nameEdit.id
          ? <div className="je-nameedit-row">{renderNameInput('New chapter name')}</div>
          : <button className="ap-jtree-add" onClick={() => setNameEdit({ kind: 'chapter', id: null, value: '' })}>➕ New Chapter</button>
      )}
      {chapters.length === 0 && nameEdit?.kind === 'chapter' && !nameEdit.id && (
        <div className="je-nameedit-row">{renderNameInput('New chapter name')}</div>
      )}

      {renderBossBlock({ kind: 'boss', bossKey: 'ultimate' }, '👑 Ultimate Boss', 'je-ultimate')}

      {deleteItem && (
        <div className="ap-backdrop" onClick={() => setDeleteItem(null)}>
          <div className="ap-confirm" onClick={e => e.stopPropagation()}>
            <div className="ap-confirm-icon">{deleteItem.kind === 'chapter' ? '🗂️' : deleteItem.kind === 'level' ? '📄' : '🚑'}</div>
            <h3>
              {deleteItem.kind === 'chapter' ? `Delete chapter "${deleteItem.row.name}"?`
                : deleteItem.kind === 'level' ? `Delete level "${deleteItem.row.name}"?`
                : 'Delete this question?'}
            </h3>
            <p>
              {deleteItem.kind === 'chapter'
                ? 'Deletes this chapter, all its levels and their questions, and its boss questions.'
                : deleteItem.kind === 'level'
                  ? 'Deletes this level and all its questions.'
                  : `"${deleteItem.row.question.slice(0, 80)}${deleteItem.row.question.length > 80 ? '…' : ''}"`}
            </p>
            <div className="ap-modal-foot">
              <button className="ap-btn-sec" onClick={() => setDeleteItem(null)}>Cancel</button>
              <button className="ap-btn-danger" onClick={handleDeleteItem}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {parserTarget && (
        <QuestionParser
          activeFolder={subject}
          selectedTopic={null}
          selectedDifficulty="easy"
          customImport={importParsed}
          onImport={() => {}}
          onClose={() => setParserTarget(null)}
        />
      )}
    </div>
  );
}

// ── Tower Editor ──────────────────────────────────────────────────────────────

const TE_ZONES = [
  { id: 1,  start: 1,  end: 10,  name: 'The Basement',            subject: 'biochemistry',     color: '#6c5ce7', icon: '🧱' },
  { id: 2,  start: 11, end: 20,  name: 'The Laboratory',          subject: 'microbiology',     color: '#00b894', icon: '🧫' },
  { id: 3,  start: 21, end: 30,  name: 'The Ward',                subject: 'pharmacology',     color: '#0984e3', icon: '💊' },
  { id: 4,  start: 31, end: 40,  name: 'The Clinic',              subject: 'neurology',        color: '#fd79a8', icon: '🧠' },
  { id: 5,  start: 41, end: 50,  name: 'The Cardio Unit',         subject: 'cardiology',       color: '#e17055', icon: '❤️' },
  { id: 6,  start: 51, end: 60,  name: 'The Research Floor',      subject: 'biostatistics',    color: '#00cec9', icon: '📊' },
  { id: 7,  start: 61, end: 70,  name: 'The GI Tract',            subject: 'gastroenterology', color: '#fdcb6e', icon: '🫃' },
  { id: 8,  start: 71, end: 80,  name: 'The Lungs',               subject: 'pulmonology',      color: '#74b9ff', icon: '🫁' },
  { id: 9,  start: 81, end: 90,  name: 'The Reproductive System', subject: 'reproductive',     color: '#e84393', icon: '👶' },
  { id: 10, start: 91, end: 100, name: 'The Summit',              subject: 'all',              color: '#f5c518', icon: '🏆' },
];

const TE_BOSS_NAMES = {
  10: 'The Biochemistry Titan',    20: 'The Microbiology Overlord',
  30: 'The Pharmacology Guardian', 40: 'The Neural Nexus',
  50: 'The Cardiac Colossus',      60: 'The Statistics Sage',
  70: 'The GI Guardian',           80: 'The Pulmonary Sentinel',
  90: 'The Obstetric Warden',      100: 'The Supreme Physician',
};

function teFloorType(f) {
  if (f % 10 === 0) return 'boss';
  if (f % 5 === 0) return 'challenge';
  return 'normal';
}

const TE_REQUIRED = { normal: 3, challenge: 5, boss: 10 };

function teFloorName(floor) {
  const type = teFloorType(floor);
  if (type === 'boss') return TE_BOSS_NAMES[floor] || `Boss Floor ${floor}`;
  if (type === 'challenge') return `Floor ${floor} — Challenge`;
  return `Floor ${floor}`;
}

function TowerEditorPanel() {
  const [questions, setQuestions]   = useState([]);
  const [loading,   setLoading]     = useState(true);
  const [search,    setSearch]      = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [collapsed, setCollapsed]   = useState({});
  const [addingTo,  setAddingTo]    = useState(null);
  const [addSearch, setAddSearch]   = useState('');
  const [updating,  setUpdating]    = useState({});
  const [busyZone,  setBusyZone]    = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res  = await apiCall('/admin/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } finally {
      setLoading(false);
    }
  }

  // Build floor→questions map
  const floorMap = {};
  for (let i = 1; i <= 100; i++) floorMap[i] = [];
  for (const q of questions) {
    const f = q.tower_floor;
    if (f >= 1 && f <= 100) floorMap[f].push(q);
  }

  // Summary
  let readyFloors = 0;
  let neededTotal = 0;
  for (let i = 1; i <= 100; i++) {
    const req = TE_REQUIRED[teFloorType(i)];
    if (floorMap[i].length >= req) readyFloors++;
    else neededTotal += req - floorMap[i].length;
  }

  async function patchFloor(question, newFloor) {
    const id  = question.id;
    setUpdating(u => ({ ...u, [id]: true }));
    try {
      const modes    = Array.isArray(question.game_modes) ? question.game_modes : [];
      const newModes = newFloor != null && !modes.includes('tower') ? [...modes, 'tower'] : modes;
      const body     = { tower_floor: newFloor ?? null };
      if (newFloor != null) body.game_modes = newModes;
      const res  = await apiCall(`/admin/questions/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body:   JSON.stringify(body),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Update failed');
      setQuestions(qs => qs.map(q => q.id === updated.id ? updated : q));
      return updated;
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUpdating(u => ({ ...u, [id]: false }));
    }
  }

  async function clearFloor(floor) {
    const assigned = floorMap[floor];
    if (!assigned.length) return;
    if (!window.confirm(`Remove all ${assigned.length} question(s) from Floor ${floor}?`)) return;
    for (const q of assigned) await patchFloor(q, null);
  }

  async function autoAssignZone(zone) {
    const pool = questions.filter(q => {
      const isSubj  = zone.subject === 'all' || q.subject === zone.subject;
      const tf      = q.tower_floor;
      const inZone  = tf >= zone.start && tf <= zone.end;
      const unset   = !tf || tf < 1 || tf > 100;
      return isSubj && (inZone || unset);
    });

    if (!pool.length) {
      alert(`No questions available for ${zone.name}. Add questions for "${zone.subject === 'all' ? 'any subject' : zone.subject}" in Question Manager first.`);
      return;
    }

    const floorList  = Array.from({ length: 10 }, (_, i) => zone.start + i);
    const totalSlots = floorList.reduce((s, f) => s + TE_REQUIRED[teFloorType(f)], 0);
    if (!window.confirm(`Auto-assign ${pool.length} question(s) across floors ${zone.start}–${zone.end} (${totalSlots} slots total)? Existing zone assignments will be cleared first.`)) return;

    setBusyZone(zone.id);

    // Clear zone
    for (const f of floorList) {
      for (const q of [...floorMap[f]]) await patchFloor(q, null);
    }

    // Assign round-robin
    let pi = 0;
    for (const floor of floorList) {
      const req = TE_REQUIRED[teFloorType(floor)];
      for (let j = 0; j < req && pi < pool.length; j++, pi++) {
        await patchFloor(pool[pi], floor);
      }
    }

    setBusyZone(null);
  }

  function shouldShowFloor(floor) {
    const type  = teFloorType(floor);
    const req   = TE_REQUIRED[type];
    const count = floorMap[floor]?.length || 0;
    const ready = count >= req;
    if (search) return String(floor).includes(search.trim());
    if (floorFilter === 'ready')     return ready;
    if (floorFilter === 'incomplete') return !ready;
    if (floorFilter === 'boss')      return type === 'boss';
    if (floorFilter === 'challenge') return type === 'challenge';
    return true;
  }

  if (loading) return <div className="ap-loading">Loading Tower Editor…</div>;

  return (
    <div className="te-panel">

      {/* ── Summary bar ─────────────────────────────────────── */}
      <div className="te-summary">
        <div className="te-summary-left">
          <div className="te-summary-stat">
            <span className="te-sum-val te-sum-green">{readyFloors}</span>
            <span className="te-sum-lbl">/ 100 floors ready</span>
          </div>
          <div className="te-summary-divider" />
          <div className="te-summary-stat">
            <span className="te-sum-val te-sum-red">{neededTotal}</span>
            <span className="te-sum-lbl">questions still needed</span>
          </div>
        </div>
        <div className="te-summary-right">
          <div className="te-sum-bar-wrap">
            <div className="te-sum-bar">
              <div className="te-sum-fill" style={{ width: `${readyFloors}%` }} />
            </div>
            <span className="te-sum-pct">{readyFloors}%</span>
          </div>
          <button className="ap-btn-sec te-reload-btn" onClick={loadAll}>↺ Reload</button>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────── */}
      <div className="te-controls">
        <div className="te-search-wrap">
          <span className="te-search-icon">🔍</span>
          <input
            type="number"
            min={1} max={100}
            className="te-search-input"
            placeholder="Jump to floor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="te-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="te-filter-pills">
          {[
            { id: 'all',        label: 'All Floors'   },
            { id: 'ready',      label: '✅ Ready'      },
            { id: 'incomplete', label: '⚠️ Incomplete' },
            { id: 'boss',       label: '🔴 Boss Only'  },
            { id: 'challenge',  label: '🟡 Challenge'  },
          ].map(f => (
            <button
              key={f.id}
              className={`te-filter-pill ${floorFilter === f.id ? 'active' : ''}`}
              onClick={() => setFloorFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Zone sections ───────────────────────────────────── */}
      {TE_ZONES.map(zone => {
        const visibleFloors = Array.from({ length: 10 }, (_, i) => zone.start + i).filter(shouldShowFloor);
        if (!visibleFloors.length) return null;

        const zoneReady  = visibleFloors.filter(f => floorMap[f].length >= TE_REQUIRED[teFloorType(f)]).length;
        const isCollapsed = collapsed[zone.id];
        const isBusy     = busyZone === zone.id;

        return (
          <div key={zone.id} className="te-zone" style={{ '--zc': zone.color }}>
            <div className="te-zone-head" onClick={() => setCollapsed(c => ({ ...c, [zone.id]: !c[zone.id] }))}>
              <div className="te-zone-head-l">
                <span className="te-zone-icon">{zone.icon}</span>
                <div className="te-zone-meta">
                  <span className="te-zone-title">Zone {zone.id} — {zone.name}</span>
                  <span className="te-zone-subj">{zone.subject === 'all' ? 'All Subjects' : zone.subject.charAt(0).toUpperCase() + zone.subject.slice(1)}</span>
                </div>
                <span className={`te-zone-badge ${zoneReady === visibleFloors.length ? 'all-ready' : ''}`}>
                  {zoneReady}/{visibleFloors.length} ready
                </span>
              </div>
              <div className="te-zone-head-r" onClick={e => e.stopPropagation()}>
                <button
                  className="te-auto-btn"
                  onClick={() => autoAssignZone(zone)}
                  disabled={isBusy}
                >
                  {isBusy ? '⏳ Assigning…' : '⚡ Auto Assign'}
                </button>
                <span className="te-chevron" onClick={e => { e.stopPropagation(); setCollapsed(c => ({ ...c, [zone.id]: !c[zone.id] })); }}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="te-floor-grid">
                {visibleFloors.map(floor => {
                  const type     = teFloorType(floor);
                  const req      = TE_REQUIRED[type];
                  const assigned = floorMap[floor] || [];
                  const count    = assigned.length;
                  const ready    = count >= req;
                  const pct      = Math.min(100, (count / req) * 100);
                  const isHere   = addingTo === floor;

                  const available = questions.filter(q => {
                    const isSubj = zone.subject === 'all' || q.subject === zone.subject;
                    return isSubj && q.tower_floor !== floor;
                  }).filter(q => {
                    if (!addSearch.trim()) return true;
                    const s = addSearch.toLowerCase();
                    return String(q.id).toLowerCase().includes(s) || q.question.toLowerCase().includes(s);
                  });

                  return (
                    <div key={floor} className={`te-floor-card te-ft-${type} ${ready ? 'te-ready' : 'te-incomplete'}`}>
                      {/* Floor header */}
                      <div className="te-fc-head">
                        <div className="te-fc-head-l">
                          <span className="te-floor-num">Floor {floor}</span>
                          <span className={`te-type-badge te-tb-${type}`}>{type.toUpperCase()}</span>
                        </div>
                        <button
                          className="te-clear-btn"
                          onClick={() => clearFloor(floor)}
                          disabled={count === 0 || isBusy}
                          title="Remove all questions from this floor"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Floor name */}
                      <div className="te-floor-name">{teFloorName(floor)}</div>

                      {/* Progress */}
                      <div className="te-fc-progress">
                        <div className="te-fc-bar"><div className="te-fc-fill" style={{ width: `${pct}%` }} /></div>
                        <div className="te-fc-pinfo">
                          <span className="te-fc-count">{count}/{req} questions</span>
                          {ready
                            ? <span className="te-status-ok">✅ Ready</span>
                            : <span className="te-status-warn">⚠️ Needs {req - count} more</span>}
                        </div>
                      </div>

                      {/* Assigned questions */}
                      <div className="te-q-list">
                        {assigned.length === 0 && (
                          <div className="te-q-empty">No questions assigned yet</div>
                        )}
                        {assigned.map(q => (
                          <div key={q.id} className="te-q-row">
                            <div className="te-q-info">
                              <span className="te-q-id">{q.id}</span>
                              <span className="te-q-preview" title={q.question}>
                                {q.question.length > 60 ? q.question.slice(0, 60) + '…' : q.question}
                              </span>
                            </div>
                            <button
                              className="te-remove-btn"
                              onClick={() => patchFloor(q, null)}
                              disabled={!!updating[q.id] || isBusy}
                            >
                              {updating[q.id] ? '…' : 'Remove'}
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add question */}
                      {isHere ? (
                        <div className="te-add-panel">
                          <div className="te-add-search-row">
                            <input
                              type="text"
                              className="te-add-search"
                              placeholder="Search by ID or question text…"
                              value={addSearch}
                              onChange={e => setAddSearch(e.target.value)}
                              autoFocus
                            />
                            <button className="te-add-cancel" onClick={() => { setAddingTo(null); setAddSearch(''); }}>✕</button>
                          </div>
                          <div className="te-add-list">
                            {available.slice(0, 25).map(q => (
                              <button
                                key={q.id}
                                className="te-add-opt"
                                onClick={() => { patchFloor(q, floor); setAddingTo(null); setAddSearch(''); }}
                                disabled={!!updating[q.id]}
                              >
                                <span className="te-add-opt-id">{q.id}</span>
                                <span className="te-add-opt-txt">{q.question.slice(0, 75)}{q.question.length > 75 ? '…' : ''}</span>
                                {q.tower_floor ? (
                                  <span className="te-add-opt-cur">Currently Floor {q.tower_floor}</span>
                                ) : null}
                              </button>
                            ))}
                            {available.length === 0 && (
                              <div className="te-add-empty">No matching questions found for this zone's subject</div>
                            )}
                            {available.length > 25 && (
                              <div className="te-add-more">Showing 25 of {available.length} — refine search to narrow</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          className="te-add-btn"
                          onClick={() => { setAddingTo(floor); setAddSearch(''); }}
                          disabled={isBusy}
                        >
                          + Add Question
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Settings helpers ───────────────────────────────────────────────────────────

function withDefaults(raw) {
  return {
    // legacy compat
    hardModeEnabled:          raw.hardModeEnabled         ?? false,
    step2Enabled:             raw.step2Enabled            ?? false,
    timerDuration:            raw.timerDefault            ?? raw.timerDuration            ?? 20,
    startingLives:            raw.battleRoyaleLives       ?? raw.startingLives            ?? 3,
    // Easy Mode settings
    easyModeTimer:            raw.easyModeTimer           ?? 30,
    easyModeExplanationTime:  raw.easyModeExplanationTime ?? 15,
    easyModeHideExplanations: raw.easyModeHideExplanations ?? false,
    easyModeDescription:      raw.easyModeDescription     ?? 'Perfect for learning. Questions present straightforward clinical scenarios with detailed explanations to build your foundation.',
    easyModeLabel:            raw.easyModeLabel           ?? 'Easy Mode',
    // Hard Mode settings
    hardModeTimer:            raw.hardModeTimer           ?? 30,  // HARDCODED: 30s for hard mode
    hardModeExplanationTime:  raw.hardModeExplanationTime ?? 20,  // HARDCODED: 20s explanation
    hardModeHideExplanations: raw.hardModeHideExplanations ?? false,
    hardModeDescription:      raw.hardModeDescription     ?? 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.',
    hardModeLabel:            raw.hardModeLabel           ?? 'Hard Mode',
    // Section 1: Question settings
    timerDefault:             raw.timerDefault            ?? raw.timerDuration            ?? 20,
    timerSpeedRace:           raw.timerSpeedRace          ?? 10,
    timerTriviaPursuit:       raw.timerTriviaPursuit      ?? 25,
    timerScanMaster:          raw.timerScanMaster         ?? 25,
    explanationTime:          raw.explanationTime         ?? 5,
    speedRaceQuestions:       raw.speedRaceQuestions      ?? 20,
    battleRoyaleMaxQ:         raw.battleRoyaleMaxQ        ?? 0,
    minQuestionsPerCategory:  raw.minQuestionsPerCategory ?? 5,
    // Section 2: Lives & difficulty
    battleRoyaleLives:        raw.battleRoyaleLives       ?? raw.startingLives            ?? 3,
    suddenDeathTrigger:       raw.suddenDeathTrigger      ?? 2,
    suddenDeathTimer:         raw.suddenDeathTimer        ?? 5,
    towerFloorLives:          raw.towerFloorLives         ?? 3,
    bossTolerance:            raw.bossTolerance           ?? 0,
    journeyThreshold:         raw.journeyThreshold        ?? 80,
    // Section 3: Lobby
    maxPlayersPerLobby:       raw.maxPlayersPerLobby      ?? 10,
    minPlayersToStart:        raw.minPlayersToStart       ?? 2,
    maxBotsPerLobby:          raw.maxBotsPerLobby         ?? 3,
    lobbyAutoStart:           raw.lobbyAutoStart          ?? 0,
    allowGuests:              raw.allowGuests             ?? true,
    allowQuickJoin:           raw.allowQuickJoin          ?? true,
    // Section 4: XP & Progression
    xpFirst:                  raw.xpFirst                 ?? 100,
    xpSecond:                 raw.xpSecond                ?? 70,
    xpThird:                  raw.xpThird                 ?? 50,
    xpOther:                  raw.xpOther                 ?? 25,
    xpPerCorrect:             raw.xpPerCorrect            ?? 5,
    xpDailyChallenge:         raw.xpDailyChallenge        ?? 50,
    xpPerLevel:               raw.xpPerLevel              ?? 500,
    streakBonusMultiplier:    raw.streakBonusMultiplier   ?? 2,
    // Section 5: Game modes
    modesBattleRoyale:        raw.modesBattleRoyale       ?? true,
    modesSpeedRace:           raw.modesSpeedRace          ?? true,
    modesTriviaPursuit:       raw.modesTriviaPursuit      ?? true,
    modesScanMaster:          raw.modesScanMaster         ?? true,
    modesTower:               raw.modesTower              ?? true,
    dailyChallengeEnabled:    raw.dailyChallengeEnabled   ?? true,
    weeklyTournamentEnabled:  raw.weeklyTournamentEnabled ?? false,
    powerUpsEnabled:          raw.powerUpsEnabled         ?? true,
    // Section 6: Maintenance
    maintenanceMode:          raw.maintenanceMode         ?? false,
    maintenanceMessage:       raw.maintenanceMessage      ?? '',
    maxConcurrentLobbies:     raw.maxConcurrentLobbies    ?? 0,
    // Section 7: UI
    showStreakCounter:         raw.showStreakCounter        ?? true,
    showPlayerCount:          raw.showPlayerCount         ?? true,
    showCorrectAnswer:        raw.showCorrectAnswer       ?? true,
    showGameLeaderboard:      raw.showGameLeaderboard     ?? true,
    soundEffectsEnabled:      raw.soundEffectsEnabled     ?? true,
    backgroundMusicEnabled:   raw.backgroundMusicEnabled  ?? true,
    // Section 8: Tower / Story Mode
    towerQuestionsNormal:     raw.towerQuestionsNormal    ?? 3,
    towerQuestionsChallenge:  raw.towerQuestionsChallenge ?? 5,
    towerQuestionsBoss:       raw.towerQuestionsBoss      ?? 10,
    towerQuestionTimer:       raw.towerQuestionTimer      ?? 20,
    towerXpNormal:            raw.towerXpNormal           ?? 30,
    towerXpChallenge:         raw.towerXpChallenge        ?? 60,
    towerXpBoss:              raw.towerXpBoss             ?? 150,
    towerXpPerfectBonus:      raw.towerXpPerfectBonus     ?? 20,
    towerXpZoneBonus:         raw.towerXpZoneBonus        ?? 200,
    towerTotalFloors:         raw.towerTotalFloors        ?? 100,
    towerChallengeInterval:   raw.towerChallengeInterval  ?? 5,
    towerBossInterval:        raw.towerBossInterval       ?? 10,
    ...Object.fromEntries(
      DEFAULT_TOWER_ZONES.flatMap((z, i) => [
        [`towerZone${i + 1}Name`, raw[`towerZone${i + 1}Name`] ?? z.name],
        [`towerZone${i + 1}Desc`, raw[`towerZone${i + 1}Desc`] ?? z.desc],
      ])
    ),
  };
}

function SliderRow({ label, desc, min, max, step, unit, value, onChange }) {
  return (
    <div className="ap-srow">
      <div className="ap-srow-info">
        <div className="ap-srow-label">{label}</div>
        <div className="ap-srow-desc">{desc}</div>
      </div>
      <div className="ap-srow-ctrl">
        <div className="ap-slider-ctrl">
          <input
            type="range"
            min={min} max={max} step={step} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="ap-range"
          />
          <div className="ap-range-val">
            <input
              type="number"
              min={min} max={max} value={value}
              onChange={e => {
                const v = Math.max(min, Math.min(max, Number(e.target.value)));
                if (!isNaN(v)) onChange(v);
              }}
              className="ap-range-num"
            />
            <span className="ap-range-unit">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="ap-srow">
      <div className="ap-srow-info">
        <div className="ap-srow-label">{label}</div>
        <div className="ap-srow-desc">{desc}</div>
      </div>
      <div className="ap-srow-ctrl">
        <label className="ap-toggle">
          <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
          <span className="ap-slider" />
        </label>
      </div>
    </div>
  );
}

function SectionSaveBtn({ saving, saved, error, onSave }) {
  const cls = saved ? 'saved' : error ? 'error' : '';
  const label = saving ? 'Saving…' : saved ? '✓ Saved!' : error ? '✗ Failed — try again' : 'Save Settings';
  return (
    <div className="ap-section-footer">
      {error && <span className="ap-section-save-err">{error}</span>}
      <button className={`ap-section-save-btn ${cls}`} onClick={onSave} disabled={saving}>
        {label}
      </button>
    </div>
  );
}

function TextareaRow({ label, desc, value, onChange, placeholder }) {
  return (
    <div className="ap-srow ap-srow-tall">
      <div className="ap-srow-info">
        <div className="ap-srow-label">{label}</div>
        <div className="ap-srow-desc">{desc}</div>
      </div>
      <div className="ap-srow-ctrl ap-srow-ctrl-wide">
        <textarea
          className="ap-settings-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
        />
      </div>
    </div>
  );
}

function ZoneRow({ zoneNum, name, desc, onNameChange, onDescChange }) {
  return (
    <div className="ap-zone-row">
      <div className="ap-zone-header">
        <span className="ap-zone-badge">Zone {zoneNum}</span>
      </div>
      <div className="ap-zone-fields">
        <input
          type="text"
          className="ap-input-plain"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={`Zone ${zoneNum} name`}
          maxLength={100}
        />
        <textarea
          className="ap-settings-textarea"
          value={desc}
          onChange={e => onDescChange(e.target.value)}
          placeholder="Zone description…"
          rows={2}
          maxLength={500}
        />
      </div>
    </div>
  );
}

// ── Landing Images Panel ─────────────────────────────────────────────────────────

const LANDING_IMAGE_SLOTS = [
  { id: 'hero_bg',       label: 'Hero Background Image',      desc: 'Full-bleed background image for the hero section' },
  { id: 'battle_royale', label: 'Battle Royale Card Image',   desc: 'Image for the Battle Royale game mode card' },
  { id: 'speed_race',    label: 'Speed Race Card Image',      desc: 'Image for the Speed Race game mode card' },
  { id: 'tower',         label: 'The Tower Card Image',       desc: 'Image for The Tower game mode card' },
  { id: 'more_to_come',  label: 'More to Come Card Image',    desc: 'Image for the More to Come placeholder card' },
];

function LandingImagesPanel() {
  const [images, setImages]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError]       = useState('');
  const [navbarBlur, setNavbarBlur] = useState(true);
  const [savingNav, setSavingNav] = useState(false);
  const [navSaveMsg, setNavSaveMsg] = useState('');

  // Hero background dimming settings
  const [heroBgDimEnabled, setHeroBgDimEnabled] = useState(false);  // OFF by default
  const [heroBgDimOpacity, setHeroBgDimOpacity] = useState(40);
  const [savingDim, setSavingDim] = useState(false);
  const [dimSaveMsg, setDimSaveMsg] = useState('');

  useEffect(() => {
    loadImages();
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await apiCall('/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setNavbarBlur(data.navbarBlurEnabled !== false);
        setHeroBgDimEnabled(data.hero_bg_dim_enabled !== false);
        setHeroBgDimOpacity(data.hero_bg_dim_opacity || 40);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  async function saveNavbarSettings() {
    setSavingNav(true);
    setNavSaveMsg('');
    try {
      await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ navbarBlurEnabled: navbarBlur }),
      });
      setNavSaveMsg('success');
      setTimeout(() => setNavSaveMsg(''), 3000);
    } catch (err) {
      setNavSaveMsg('error');
      setTimeout(() => setNavSaveMsg(''), 3000);
    }
    setSavingNav(false);
  }


  async function saveDimSettings() {
    setSavingDim(true);
    setDimSaveMsg('');
    try {
      await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          hero_bg_dim_enabled: heroBgDimEnabled,
          hero_bg_dim_opacity: heroBgDimOpacity,
        }),
      });
      setDimSaveMsg('success');
      setTimeout(() => setDimSaveMsg(''), 3000);
    } catch (err) {
      setDimSaveMsg('error');
      setTimeout(() => setDimSaveMsg(''), 3000);
    }
    setSavingDim(false);
  }

  async function loadImages() {
    setLoading(true);
    try {
      const res = await apiCall('/admin/landing-images');
      if (!res.ok) throw new Error('Failed to load images');
      const data = await res.json();
      const map = {};
      (data.images || []).forEach(img => { map[img.slot_name] = img.image_url; });
      setImages(map);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleUpload(slot, file) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image must be under 5MB');
      return;
    }

    setUploading(u => ({ ...u, [slot]: true }));
    setError('');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await apiCall('/admin/landing-images', {
        method: 'POST',
        body: JSON.stringify({
          slot_name: slot,
          base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setImages(prev => ({ ...prev, [slot]: data.image_url }));
    } catch (err) {
      setError(err.message);
    }

    setUploading(u => ({ ...u, [slot]: false }));
  }

  async function handleRemove(slot) {
    if (!window.confirm('Remove this image? It will be deleted from storage.')) return;

    setUploading(u => ({ ...u, [slot]: true }));
    setError('');

    try {
      const res = await apiCall(`/admin/landing-images/${slot}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setImages(prev => {
        const copy = { ...prev };
        delete copy[slot];
        return copy;
      });
    } catch (err) {
      setError(err.message);
    }

    setUploading(u => ({ ...u, [slot]: false }));
  }

  if (loading) return <div className="ap-loading">Loading Landing Images…</div>;

  return (
    <div className="li-panel">
      <div className="li-header">
        <div className="li-header-icon">🖼️</div>
        <div>
          <h2 className="li-header-title">Landing Page</h2>
          <p className="li-header-desc">Manage images and settings for the public landing page.</p>
        </div>
      </div>

      {error && <div className="li-error">{error}</div>}

      {/* Navigation Bar Settings Section */}
      <div className="li-settings-section">
        <h3 className="li-settings-title">🔲 Navigation Bar Settings</h3>
        <div className="li-setting-row">
          <div className="li-setting-info">
            <span className="li-setting-label">Navigation Bar Overlay</span>
            <span className="li-setting-desc">When enabled, the navbar has a dark semi-transparent background with blur effect. When disabled, links float directly over the background image.</span>
          </div>
          <button
            className={`li-toggle ${navbarBlur ? 'on' : 'off'}`}
            onClick={() => setNavbarBlur(!navbarBlur)}
            disabled={savingNav}
          >
            <span className="li-toggle-slider"></span>
            <span className="li-toggle-label">{navbarBlur ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="li-save-row">
          <button
            className="li-save-btn"
            onClick={saveNavbarSettings}
            disabled={savingNav}
          >
            {savingNav ? '⏳ Saving...' : '💾 Save Navigation Settings'}
          </button>
          {navSaveMsg === 'success' && <span className="li-save-success">✓ Saved successfully</span>}
          {navSaveMsg === 'error' && <span className="li-save-error">✗ Failed to save</span>}
        </div>
      </div>

      {/* Hero Background Dimming Settings Section */}
      <div className="li-settings-section">
        <h3 className="li-settings-title">🌙 Hero Background Dimming</h3>

        <div className="li-setting-row">
          <div className="li-setting-info">
            <span className="li-setting-label">Dim Background Image</span>
            <span className="li-setting-desc">Apply a dark overlay on the hero background image to improve text readability</span>
          </div>
          <button
            className={`li-toggle ${heroBgDimEnabled ? 'on' : 'off'}`}
            onClick={() => setHeroBgDimEnabled(!heroBgDimEnabled)}
            disabled={savingDim}
          >
            <span className="li-toggle-slider"></span>
            <span className="li-toggle-label">{heroBgDimEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {heroBgDimEnabled && (
          <div className="li-setting-row li-setting-slider-row">
            <div className="li-setting-info">
              <span className="li-setting-label">Dim Intensity</span>
              <span className="li-setting-desc">Adjust how dark the overlay appears (0% = no dimming, 80% = very dark)</span>
            </div>
            <div className="li-slider-control">
              <input
                type="range"
                min="0"
                max="80"
                value={heroBgDimOpacity}
                onChange={(e) => setHeroBgDimOpacity(parseInt(e.target.value))}
                className="li-slider"
              />
              <span className="li-slider-value">{heroBgDimOpacity}%</span>
            </div>
          </div>
        )}

        <div className="li-save-row">
          <button
            className="li-save-btn"
            onClick={saveDimSettings}
            disabled={savingDim}
          >
            {savingDim ? '⏳ Saving...' : '💾 Save Dimming Settings'}
          </button>
          {dimSaveMsg === 'success' && <span className="li-save-success">✓ Saved successfully</span>}
          {dimSaveMsg === 'error' && <span className="li-save-error">✗ Failed to save</span>}
        </div>
      </div>

      {/* Images Section */}
      <h3 className="li-images-title">🖼️ Landing Page Images</h3>

      <div className="li-grid">
        {LANDING_IMAGE_SLOTS.map(slot => (
          <div key={slot.id} className="li-slot">
            <div className="li-slot-header">
              <span className="li-slot-label">{slot.label}</span>
              <span className="li-slot-desc">{slot.desc}</span>
            </div>

            <div className="li-slot-preview">
              {images[slot.id] ? (
                <img src={images[slot.id]} alt={slot.label} className="li-slot-img" />
              ) : (
                <div className="li-slot-empty">
                  <span className="li-slot-empty-icon">🖼️</span>
                  <span>No image uploaded</span>
                </div>
              )}
            </div>

            <div className="li-slot-actions">
              <label className={`li-upload-btn ${uploading[slot.id] ? 'uploading' : ''}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => handleUpload(slot.id, e.target.files?.[0])}
                  disabled={uploading[slot.id]}
                  style={{ display: 'none' }}
                />
                {uploading[slot.id] ? 'Uploading…' : '📤 Upload Image'}
              </label>

              {images[slot.id] && (
                <button
                  className="li-remove-btn"
                  onClick={() => handleRemove(slot.id)}
                  disabled={uploading[slot.id]}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const SECTIONS = ['questions', 'lives', 'lobby', 'xp', 'modes', 'easyMode', 'hardMode', 'maintenance', 'ui', 'tower'];
  const sectionInit = () => Object.fromEntries(SECTIONS.map(k => [k, false]));
  const sectionErrInit = () => Object.fromEntries(SECTIONS.map(k => [k, '']));

  const [settings,    setSettings]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(sectionInit);
  const [saved,       setSaved]       = useState(sectionInit);
  const [saveErr,     setSaveErr]     = useState(sectionErrInit);
  const [savingAll,   setSavingAll]   = useState(false);
  const [savedAll,    setSavedAll]    = useState(false);
  const [saveErrAll,  setSaveErrAll]  = useState('');
  const [resetMsg,    setResetMsg]    = useState('');
  const [loadErr,     setLoadErr]     = useState('');

  useEffect(() => {
    apiCall('/admin/settings')
      .then(r => r.json())
      .then(raw => setSettings(withDefaults(raw)))
      .catch(() => setLoadErr('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function doSave() {
    const res  = await apiCall('/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    setSettings(withDefaults(data));
  }

  async function saveSection(section) {
    setSaving(s  => ({ ...s, [section]: true }));
    setSaved(s   => ({ ...s, [section]: false }));
    setSaveErr(s => ({ ...s, [section]: '' }));
    try {
      await doSave();
      setSaved(s => ({ ...s, [section]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [section]: false })), 3000);
    } catch (err) {
      setSaveErr(s => ({ ...s, [section]: err.message }));
      setTimeout(() => setSaveErr(s => ({ ...s, [section]: '' })), 5000);
    }
    setSaving(s => ({ ...s, [section]: false }));
  }

  async function saveAll() {
    setSavingAll(true);
    setSavedAll(false);
    setSaveErrAll('');
    try {
      await doSave();
      setSavedAll(true);
      setTimeout(() => setSavedAll(false), 3000);
    } catch (err) {
      setSaveErrAll(err.message);
      setTimeout(() => setSaveErrAll(''), 5000);
    }
    setSavingAll(false);
  }

  async function handleReset(endpoint, confirmMsg, successMsg) {
    if (!window.confirm(confirmMsg)) return;
    setResetMsg('');
    try {
      const res  = await apiCall(endpoint, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setResetMsg(`✓ ${successMsg}`);
    } catch (err) {
      setResetMsg(`✗ ${err.message}`);
    }
    setTimeout(() => setResetMsg(''), 4000);
  }

  function upd(key, val) { setSettings(s => ({ ...s, [key]: val })); }

  if (loading)   return <div className="ap-loading">Loading settings…</div>;
  if (!settings) return <div className="ap-error">{loadErr || 'Failed to load settings.'}</div>;

  return (
    <div className="ap-settings-v2">

      {/* ── SAVE ALL BANNER ───────────────────────────────────────────── */}
      <div className="ap-save-all-bar">
        <div className="ap-save-all-info">
          <span className="ap-save-all-title">Game Settings</span>
          <span className="ap-save-all-sub">Changes are applied live — each section has its own save button, or save everything at once below.</span>
        </div>
        <div className="ap-save-all-actions">
          {saveErrAll && <span className="ap-section-save-err">{saveErrAll}</span>}
          {savedAll   && <span className="ap-save-all-ok">✓ All settings saved!</span>}
          <button
            className={`ap-section-save-btn ap-save-all-btn ${savedAll ? 'saved' : ''} ${saveErrAll ? 'error' : ''}`}
            onClick={saveAll}
            disabled={savingAll}
          >
            {savingAll ? 'Saving…' : savedAll ? '✓ Saved!' : saveErrAll ? '✗ Failed — try again' : '💾 Save All Settings'}
          </button>
        </div>
      </div>

      {/* ── 1. QUESTION SETTINGS ──────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">❓</div>
          <div>
            <h2 className="ap-section-title-lg">Question Settings</h2>
            <p className="ap-section-subtitle">Timer durations and question counts per game mode</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <SliderRow label="Default Question Timer"
            desc="Fallback timer for modes without a specific setting"
            min={5} max={60} step={1} unit="sec"
            value={settings.timerDefault}
            onChange={v => upd('timerDefault', v)} />

          <SliderRow label="Speed Race Timer"
            desc="Seconds per question in Speed Race mode"
            min={5} max={30} step={1} unit="sec"
            value={settings.timerSpeedRace}
            onChange={v => upd('timerSpeedRace', v)} />

          <SliderRow label="Trivia Pursuit Timer"
            desc="Seconds per question in Trivia Pursuit"
            min={10} max={60} step={1} unit="sec"
            value={settings.timerTriviaPursuit}
            onChange={v => upd('timerTriviaPursuit', v)} />

          <SliderRow label="Scan Master Timer"
            desc="Seconds per question in Scan Master mode"
            min={15} max={60} step={1} unit="sec"
            value={settings.timerScanMaster}
            onChange={v => upd('timerScanMaster', v)} />

          <SliderRow label="Explanation Display Time"
            desc="How long to show the answer explanation before moving on"
            min={3} max={30} step={1} unit="sec"
            value={settings.explanationTime}
            onChange={v => upd('explanationTime', v)} />

          <SliderRow label="Speed Race Question Count"
            desc="Number of correct answers needed to win a Speed Race game"
            min={5} max={50} step={5} unit="questions"
            value={settings.speedRaceQuestions}
            onChange={v => upd('speedRaceQuestions', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Battle Royale Max Questions</div>
              <div className="ap-srow-desc">Cap the total questions per game, or leave unlimited (game ends when 1 player remains)</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[
                  { label: 'Unlimited', value: 0 },
                  { label: '50',  value: 50  },
                  { label: '100', value: 100 },
                  { label: '150', value: 150 },
                  { label: '200', value: 200 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`ap-chip ${settings.battleRoyaleMaxQ === opt.value ? 'active' : ''}`}
                    onClick={() => upd('battleRoyaleMaxQ', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SliderRow label="Minimum Questions per Category"
            desc="A category is hidden in mode select if it has fewer questions than this threshold"
            min={1} max={20} step={1} unit="questions"
            value={settings.minQuestionsPerCategory}
            onChange={v => upd('minQuestionsPerCategory', v)} />
        </div>

        <SectionSaveBtn saving={saving.questions} saved={saved.questions} error={saveErr.questions} onSave={() => saveSection('questions')} />
      </div>

      {/* ── 2. LIVES & DIFFICULTY ─────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">❤️</div>
          <div>
            <h2 className="ap-section-title-lg">Lives &amp; Difficulty</h2>
            <p className="ap-section-subtitle">Lives, sudden death, and boss floor mechanics</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Battle Royale Starting Lives</div>
              <div className="ap-srow-desc">How many lives each player starts with in Battle Royale</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[1, 2, 3, 5].map(n => (
                  <button
                    key={n}
                    className={`ap-chip ap-chip-lg ${settings.battleRoyaleLives === n ? 'active' : ''}`}
                    onClick={() => upd('battleRoyaleLives', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SliderRow label="Sudden Death Trigger"
            desc="Sudden death activates when this many players remain"
            min={2} max={10} step={1} unit="players"
            value={settings.suddenDeathTrigger}
            onChange={v => upd('suddenDeathTrigger', v)} />

          <SliderRow label="Sudden Death Timer"
            desc="Seconds per question during sudden death phase"
            min={3} max={10} step={1} unit="sec"
            value={settings.suddenDeathTimer}
            onChange={v => upd('suddenDeathTimer', v)} />

          <SliderRow label="Tower Floor Lives"
            desc="Lives per floor in The Tower mode (normal and challenge floors)"
            min={1} max={5} step={1} unit="lives"
            value={settings.towerFloorLives}
            onChange={v => upd('towerFloorLives', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Boss Floor Tolerance</div>
              <div className="ap-srow-desc">How many wrong answers are allowed before failing a boss floor</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                <button
                  className={`ap-chip ${settings.bossTolerance === 0 ? 'active' : ''}`}
                  onClick={() => upd('bossTolerance', 0)}
                >
                  Zero mistakes
                </button>
                <button
                  className={`ap-chip ${settings.bossTolerance === 1 ? 'active' : ''}`}
                  onClick={() => upd('bossTolerance', 1)}
                >
                  Allow 1 mistake
                </button>
              </div>
            </div>
          </div>

          <SliderRow label="Journey Unlock Threshold"
            desc="First Aid Journey: % score needed to complete a level and unlock the next"
            min={50} max={100} step={5} unit="%"
            value={settings.journeyThreshold}
            onChange={v => upd('journeyThreshold', v)} />
        </div>

        <SectionSaveBtn saving={saving.lives} saved={saved.lives} error={saveErr.lives} onSave={() => saveSection('lives')} />
      </div>

      {/* ── 3. LOBBY SETTINGS ─────────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">🏠</div>
          <div>
            <h2 className="ap-section-title-lg">Lobby Settings</h2>
            <p className="ap-section-subtitle">Player limits, bots, and join behaviour</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <SliderRow label="Maximum Players per Lobby"
            desc="Hard cap on how many players can join a single lobby"
            min={2} max={20} step={1} unit="players"
            value={settings.maxPlayersPerLobby}
            onChange={v => upd('maxPlayersPerLobby', v)} />

          <SliderRow label="Minimum Players to Start"
            desc="A game cannot start until at least this many players are ready"
            min={1} max={5} step={1} unit="players"
            value={settings.minPlayersToStart}
            onChange={v => upd('minPlayersToStart', v)} />

          <SliderRow label="Maximum Bots per Lobby"
            desc="Bots fill empty slots automatically — set to 0 to disable bots entirely"
            min={0} max={5} step={1} unit="bots"
            value={settings.maxBotsPerLobby}
            onChange={v => upd('maxBotsPerLobby', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Lobby Auto-Start Timer</div>
              <div className="ap-srow-desc">Automatically start the game after this delay once minimum players have joined</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[
                  { label: 'Off',   value: 0   },
                  { label: '30s',   value: 30  },
                  { label: '1 min', value: 60  },
                  { label: '2 min', value: 120 },
                  { label: '5 min', value: 300 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`ap-chip ${settings.lobbyAutoStart === opt.value ? 'active' : ''}`}
                    onClick={() => upd('lobbyAutoStart', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ToggleRow label="Allow Guests"
            desc="Let players join without creating an account"
            checked={settings.allowGuests}
            onChange={v => upd('allowGuests', v)} />

          <ToggleRow label="Allow Quick Join"
            desc="Enable the Quick Join button globally — players can jump into any open lobby"
            checked={settings.allowQuickJoin}
            onChange={v => upd('allowQuickJoin', v)} />
        </div>

        <SectionSaveBtn saving={saving.lobby} saved={saved.lobby} error={saveErr.lobby} onSave={() => saveSection('lobby')} />
      </div>

      {/* ── 4. XP & PROGRESSION ───────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">⚡</div>
          <div>
            <h2 className="ap-section-title-lg">XP &amp; Progression</h2>
            <p className="ap-section-subtitle">Experience points awarded per game outcome and level thresholds</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <SliderRow label="XP for 1st Place"
            desc="XP awarded to the winner of a multiplayer game"
            min={10} max={500} step={5} unit="XP"
            value={settings.xpFirst}
            onChange={v => upd('xpFirst', v)} />

          <SliderRow label="XP for 2nd Place"
            desc="XP awarded to the runner-up"
            min={5} max={400} step={5} unit="XP"
            value={settings.xpSecond}
            onChange={v => upd('xpSecond', v)} />

          <SliderRow label="XP for 3rd Place"
            desc="XP awarded to the third-place player"
            min={5} max={300} step={5} unit="XP"
            value={settings.xpThird}
            onChange={v => upd('xpThird', v)} />

          <SliderRow label="XP for 4th Place and Below"
            desc="XP awarded to all other players who participated"
            min={0} max={200} step={5} unit="XP"
            value={settings.xpOther}
            onChange={v => upd('xpOther', v)} />

          <SliderRow label="XP per Correct Answer Bonus"
            desc="Bonus XP added for each correct answer during a game"
            min={0} max={50} step={1} unit="XP"
            value={settings.xpPerCorrect}
            onChange={v => upd('xpPerCorrect', v)} />

          <SliderRow label="XP per Daily Challenge"
            desc="XP awarded for completing the daily challenge"
            min={10} max={500} step={10} unit="XP"
            value={settings.xpDailyChallenge}
            onChange={v => upd('xpDailyChallenge', v)} />

          <SliderRow label="XP Required per Level"
            desc="Total XP needed to advance from one level to the next"
            min={100} max={5000} step={100} unit="XP"
            value={settings.xpPerLevel}
            onChange={v => upd('xpPerLevel', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Streak Bonus Multiplier</div>
              <div className="ap-srow-desc">XP multiplier applied when a player answers 3+ correct in a row</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`ap-chip ap-chip-lg ${settings.streakBonusMultiplier === n ? 'active' : ''}`}
                    onClick={() => upd('streakBonusMultiplier', n)}
                  >
                    {n}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SectionSaveBtn saving={saving.xp} saved={saved.xp} error={saveErr.xp} onSave={() => saveSection('xp')} />
      </div>

      {/* ── 5. GAME MODE SETTINGS ─────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">🎮</div>
          <div>
            <h2 className="ap-section-title-lg">Game Mode Settings</h2>
            <p className="ap-section-subtitle">Enable or disable individual game modes and features globally</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <div className="ap-srow-divider">Game Modes</div>
          <ToggleRow label="⚔️ Battle Royale"
            desc="Last doctor standing elimination mode"
            checked={settings.modesBattleRoyale}
            onChange={v => upd('modesBattleRoyale', v)} />
          <ToggleRow label="⚡ Speed Race"
            desc="First to 20 correct answers wins"
            checked={settings.modesSpeedRace}
            onChange={v => upd('modesSpeedRace', v)} />
          <ToggleRow label="🎯 Trivia Pursuit"
            desc="Collect all 6 subject wedges to win"
            checked={settings.modesTriviaPursuit}
            onChange={v => upd('modesTriviaPursuit', v)} />
          <ToggleRow label="🔬 Scan Master"
            desc="Identify conditions from medical images"
            checked={settings.modesScanMaster}
            onChange={v => upd('modesScanMaster', v)} />
          <ToggleRow label="🏰 The Tower"
            desc="Solo 100-floor climbing challenge"
            checked={settings.modesTower}
            onChange={v => upd('modesTower', v)} />

          <div className="ap-srow-divider">Features</div>
          <ToggleRow label="Hard Mode"
            desc="Enable Hard Mode for players (shorter timer, no explanations, harder presentation - uses all questions)"
            checked={settings.hardModeEnabled}
            onChange={v => upd('hardModeEnabled', v)} />
          <ToggleRow label="Step 2 Questions"
            desc="Include Step 2 level questions in the question pool"
            checked={settings.step2Enabled}
            onChange={v => upd('step2Enabled', v)} />
          <ToggleRow label="Daily Challenge"
            desc="Enable the daily challenge mode for all players"
            checked={settings.dailyChallengeEnabled}
            onChange={v => upd('dailyChallengeEnabled', v)} />
          <ToggleRow label="Weekly Tournament"
            desc="Enable weekly ranked tournament events"
            checked={settings.weeklyTournamentEnabled}
            onChange={v => upd('weeklyTournamentEnabled', v)} />
          <ToggleRow label="Power-Ups"
            desc="Enable the power-up system globally across all game modes"
            checked={settings.powerUpsEnabled}
            onChange={v => upd('powerUpsEnabled', v)} />
        </div>

        <SectionSaveBtn saving={saving.modes} saved={saved.modes} error={saveErr.modes} onSave={() => saveSection('modes')} />
      </div>

      {/* ── 5.5 HARD MODE SETTINGS ────────────────────────────────────── */}
      {/* ══════════════ EASY MODE SETTINGS ══════════════ */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">😊</div>
          <div>
            <h2 className="ap-section-title-lg">Easy Mode Settings</h2>
            <p className="ap-section-subtitle">Configure Easy Mode timer, explanations, and presentation</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <SliderRow label="Question Timer (Easy Mode)"
            desc="Seconds per question when Easy Mode is selected"
            min={10} max={60} step={1} unit="sec"
            value={settings.easyModeTimer}
            onChange={v => upd('easyModeTimer', v)} />

          <ToggleRow label="Hide Explanations Completely"
            desc="When ON, no explanations are shown in Easy Mode (not recommended for learning)"
            checked={settings.easyModeHideExplanations}
            onChange={v => upd('easyModeHideExplanations', v)} />

          {!settings.easyModeHideExplanations && (
            <SliderRow label="Explanation Display Time (Easy Mode)"
              desc="How long to show the answer explanation in Easy Mode (0 to skip)"
              min={0} max={45} step={1} unit="sec"
              value={settings.easyModeExplanationTime}
              onChange={v => upd('easyModeExplanationTime', v)} />
          )}

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Easy Mode Label</div>
              <div className="ap-srow-desc">The name displayed to players (e.g., "Easy Mode", "Learning Mode", "Beginner Mode")</div>
            </div>
            <div className="ap-srow-ctrl">
              <input
                type="text"
                className="ap-text-input"
                value={settings.easyModeLabel}
                onChange={e => upd('easyModeLabel', e.target.value)}
                placeholder="Easy Mode"
                maxLength={30}
              />
            </div>
          </div>

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Easy Mode Description</div>
              <div className="ap-srow-desc">Description shown on difficulty selection screen (200 char limit)</div>
            </div>
            <div className="ap-srow-ctrl">
              <textarea
                className="ap-textarea"
                value={settings.easyModeDescription}
                onChange={e => upd('easyModeDescription', e.target.value.slice(0, 200))}
                placeholder="Perfect for learning..."
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
        </div>

        <button
          className="ap-save-btn"
          onClick={() => saveSection('easyMode')}
          disabled={saving.easyMode}
        >
          {saving.easyMode ? '💾 Saving…' : saved.easyMode ? '✓ Saved' : '💾 Save Easy Mode Settings'}
        </button>
        {saveErr.easyMode && <div className="ap-save-error">{saveErr.easyMode}</div>}
      </div>

      {/* ══════════════ HARD MODE SETTINGS ══════════════ */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">💀</div>
          <div>
            <h2 className="ap-section-title-lg">Hard Mode Settings</h2>
            <p className="ap-section-subtitle">Configure Hard Mode timer, explanations, and presentation</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <ToggleRow label="Hard Mode Active"
            desc="Enable Hard Mode for players — when OFF, shows 'Coming Soon' to players"
            checked={settings.hardModeEnabled}
            onChange={v => upd('hardModeEnabled', v)} />

          <SliderRow label="Question Timer (Hard Mode)"
            desc="Seconds per question when Hard Mode is selected"
            min={5} max={120} step={1} unit="sec"
            value={settings.hardModeTimer}
            onChange={v => upd('hardModeTimer', v)} />

          <ToggleRow label="Hide Explanations Completely"
            desc="When ON, no explanations are shown in Hard Mode (overrides timer below)"
            checked={settings.hardModeHideExplanations}
            onChange={v => upd('hardModeHideExplanations', v)} />

          {!settings.hardModeHideExplanations && (
            <SliderRow label="Explanation Display Time (Hard Mode)"
              desc="How long to show the answer explanation in Hard Mode (set to 0 to skip)"
              min={0} max={60} step={1} unit="sec"
              value={settings.hardModeExplanationTime}
              onChange={v => upd('hardModeExplanationTime', v)} />
          )}

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Hard Mode Label</div>
              <div className="ap-srow-desc">The name displayed to players (e.g., "Hard Mode", "Expert Mode", "Challenge Mode")</div>
            </div>
            <div className="ap-srow-ctrl">
              <input
                type="text"
                className="ap-text-input"
                value={settings.hardModeLabel}
                onChange={e => upd('hardModeLabel', e.target.value)}
                placeholder="Hard Mode"
                maxLength={30}
              />
            </div>
          </div>

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Hard Mode Description</div>
              <div className="ap-srow-desc">Description shown on difficulty selection screen (200 char limit)</div>
            </div>
            <div className="ap-srow-ctrl">
              <textarea
                className="ap-textarea"
                value={settings.hardModeDescription}
                onChange={e => upd('hardModeDescription', e.target.value.substring(0, 200))}
                placeholder="For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding."
                rows={3}
                maxLength={200}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                {settings.hardModeDescription?.length || 0}/200 characters
              </div>
            </div>
          </div>

          <div className="ap-srow" style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', border: '1px solid #e0e0e0' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
              Preview (as shown to players):
            </div>
            <div style={{ padding: '12px', background: 'white', borderRadius: '4px', border: '2px solid #d32f2f' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '4px' }}>
                💀 {settings.hardModeLabel || 'Hard Mode'}
              </div>
              <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.4' }}>
                {settings.hardModeDescription || 'For advanced students. Questions present concepts in tricky and complex clinical scenarios that challenge your deeper understanding.'}
              </div>
            </div>
          </div>
        </div>

        <SectionSaveBtn saving={saving.hardMode} saved={saved.hardMode} error={saveErr.hardMode} onSave={() => saveSection('hardMode')} />
      </div>

      {/* ── 6. MAINTENANCE ────────────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">🔧</div>
          <div>
            <h2 className="ap-section-title-lg">Maintenance</h2>
            <p className="ap-section-subtitle">Maintenance mode, lobby limits, and data resets</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <ToggleRow label="Maintenance Mode"
            desc="When on, all users see a maintenance page instead of the game"
            checked={settings.maintenanceMode}
            onChange={v => upd('maintenanceMode', v)} />

          <TextareaRow label="Maintenance Message"
            desc="Custom message shown to users during maintenance"
            value={settings.maintenanceMessage}
            onChange={v => upd('maintenanceMessage', v)}
            placeholder="We'll be back shortly. Thank you for your patience." />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Max Concurrent Lobbies</div>
              <div className="ap-srow-desc">Cap on how many active lobbies can run simultaneously (0 = unlimited)</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[
                  { label: 'Unlimited', value: 0   },
                  { label: '10',        value: 10  },
                  { label: '25',        value: 25  },
                  { label: '50',        value: 50  },
                  { label: '100',       value: 100 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`ap-chip ${settings.maxConcurrentLobbies === opt.value ? 'active' : ''}`}
                    onClick={() => upd('maxConcurrentLobbies', opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SectionSaveBtn saving={saving.maintenance} saved={saved.maintenance} error={saveErr.maintenance} onSave={() => saveSection('maintenance')} />

        <div className="ap-danger-zone">
          <div className="ap-danger-zone-title">⚠️ Danger Zone</div>
          <p className="ap-danger-zone-desc">These actions are irreversible. They will affect all players immediately.</p>
          <div className="ap-danger-actions">
            <button
              className="ap-btn-danger"
              onClick={() => handleReset(
                '/admin/reset-leaderboards',
                'Reset ALL player XP and levels to zero? This cannot be undone.',
                'All leaderboards reset successfully.',
              )}
            >
              🗑️ Reset All Leaderboards
            </button>
            <button
              className="ap-btn-danger"
              onClick={() => handleReset(
                '/admin/reset-tower-progress',
                'Reset ALL player Tower progress to Floor 1? This cannot be undone.',
                'All Tower progress reset successfully.',
              )}
            >
              🏰 Reset All Tower Progress
            </button>
          </div>
          {resetMsg && (
            <div className={`ap-reset-msg ${resetMsg.startsWith('✓') ? 'ok' : 'err'}`}>
              {resetMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── 7. UI SETTINGS ────────────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">🎨</div>
          <div>
            <h2 className="ap-section-title-lg">UI Settings</h2>
            <p className="ap-section-subtitle">Control what players see and hear during gameplay</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <ToggleRow label="Show Streak Counter"
            desc="Display the consecutive correct answer streak counter during games"
            checked={settings.showStreakCounter}
            onChange={v => upd('showStreakCounter', v)} />
          <ToggleRow label="Show Player Count in Lobby"
            desc="Show how many players are in a lobby before the game starts"
            checked={settings.showPlayerCount}
            onChange={v => upd('showPlayerCount', v)} />
          <ToggleRow label="Show Correct Answer After Question"
            desc="Reveal the correct answer and explanation after each question"
            checked={settings.showCorrectAnswer}
            onChange={v => upd('showCorrectAnswer', v)} />
          <ToggleRow label="Show Leaderboard During Game"
            desc="Display the live player ranking panel during gameplay"
            checked={settings.showGameLeaderboard}
            onChange={v => upd('showGameLeaderboard', v)} />
          <ToggleRow label="Sound Effects"
            desc="Enable in-game sound effects globally (correct, wrong, tick, etc.)"
            checked={settings.soundEffectsEnabled}
            onChange={v => upd('soundEffectsEnabled', v)} />
          <ToggleRow label="Background Music"
            desc="Enable background music globally across all screens"
            checked={settings.backgroundMusicEnabled}
            onChange={v => upd('backgroundMusicEnabled', v)} />
        </div>

        <SectionSaveBtn saving={saving.ui} saved={saved.ui} error={saveErr.ui} onSave={() => saveSection('ui')} />
      </div>

      {/* ── 8. TOWER / STORY MODE ─────────────────────────────────────── */}
      <div className="ap-settings-section">
        <div className="ap-section-hd">
          <div className="ap-section-icon">🏰</div>
          <div>
            <h2 className="ap-section-title-lg">Tower / Story Mode</h2>
            <p className="ap-section-subtitle">Floor structure, XP rewards, zone customisation, and floor type intervals</p>
          </div>
        </div>

        <div className="ap-settings-rows">
          <div className="ap-srow-divider">Mode Toggle</div>
          <ToggleRow label="🏰 Enable The Tower"
            desc="Allow players to access The Tower solo climbing mode"
            checked={settings.modesTower}
            onChange={v => upd('modesTower', v)} />

          <div className="ap-srow-divider">Floor Structure</div>
          <SliderRow label="Questions per Normal Floor"
            desc="How many correct answers are required to clear a standard floor"
            min={1} max={10} step={1} unit="questions"
            value={settings.towerQuestionsNormal}
            onChange={v => upd('towerQuestionsNormal', v)} />

          <SliderRow label="Questions per Challenge Floor"
            desc="Correct answers required on every 5th floor (challenge)"
            min={3} max={15} step={1} unit="questions"
            value={settings.towerQuestionsChallenge}
            onChange={v => upd('towerQuestionsChallenge', v)} />

          <SliderRow label="Questions per Boss Floor"
            desc="Correct answers required on every 10th floor (boss) — all must be correct"
            min={5} max={20} step={1} unit="questions"
            value={settings.towerQuestionsBoss}
            onChange={v => upd('towerQuestionsBoss', v)} />

          <SliderRow label="Lives per Floor"
            desc="How many lives players start with on each normal and challenge floor"
            min={1} max={5} step={1} unit="lives"
            value={settings.towerFloorLives}
            onChange={v => upd('towerFloorLives', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Boss Floor Tolerance</div>
              <div className="ap-srow-desc">How many wrong answers are allowed before failing a boss floor</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                <button
                  className={`ap-chip ${settings.bossTolerance === 0 ? 'active' : ''}`}
                  onClick={() => upd('bossTolerance', 0)}
                >
                  Zero mistakes
                </button>
                <button
                  className={`ap-chip ${settings.bossTolerance === 1 ? 'active' : ''}`}
                  onClick={() => upd('bossTolerance', 1)}
                >
                  Allow 1 mistake
                </button>
              </div>
            </div>
          </div>

          <SliderRow label="Question Timer per Floor"
            desc="Seconds allowed per question inside The Tower"
            min={10} max={60} step={5} unit="sec"
            value={settings.towerQuestionTimer}
            onChange={v => upd('towerQuestionTimer', v)} />

          <div className="ap-srow">
            <div className="ap-srow-info">
              <div className="ap-srow-label">Total Number of Floors</div>
              <div className="ap-srow-desc">Total floors in The Tower — changing this resets any existing progress thresholds</div>
            </div>
            <div className="ap-srow-ctrl">
              <div className="ap-chip-group">
                {[50, 100, 200].map(n => (
                  <button
                    key={n}
                    className={`ap-chip ap-chip-lg ${settings.towerTotalFloors === n ? 'active' : ''}`}
                    onClick={() => upd('towerTotalFloors', n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ap-srow-divider">Floor Type Intervals</div>
          <SliderRow label="Challenge Floor Every X Floors"
            desc="A challenge floor appears every X floors (e.g. 5 = floors 5, 10, 15…)"
            min={3} max={10} step={1} unit="floors"
            value={settings.towerChallengeInterval}
            onChange={v => upd('towerChallengeInterval', v)} />

          <SliderRow label="Boss Floor Every Y Floors"
            desc="A boss floor appears every Y floors (e.g. 10 = floors 10, 20, 30…)"
            min={5} max={20} step={5} unit="floors"
            value={settings.towerBossInterval}
            onChange={v => upd('towerBossInterval', v)} />

          <div className="ap-srow-divider">XP Rewards</div>
          <SliderRow label="XP for Normal Floor"
            desc="Base XP awarded when a standard floor is cleared"
            min={10} max={200} step={5} unit="XP"
            value={settings.towerXpNormal}
            onChange={v => upd('towerXpNormal', v)} />

          <SliderRow label="XP for Challenge Floor"
            desc="Base XP awarded when a challenge floor is cleared"
            min={20} max={300} step={10} unit="XP"
            value={settings.towerXpChallenge}
            onChange={v => upd('towerXpChallenge', v)} />

          <SliderRow label="XP for Boss Floor"
            desc="Base XP awarded when a boss floor is defeated"
            min={50} max={500} step={10} unit="XP"
            value={settings.towerXpBoss}
            onChange={v => upd('towerXpBoss', v)} />

          <SliderRow label="Perfect Run Bonus XP"
            desc="Extra XP added when a floor is cleared without losing any lives"
            min={0} max={100} step={5} unit="XP"
            value={settings.towerXpPerfectBonus}
            onChange={v => upd('towerXpPerfectBonus', v)} />

          <SliderRow label="Zone Completion Bonus XP"
            desc="Extra XP awarded on boss floors for completing an entire zone"
            min={0} max={500} step={25} unit="XP"
            value={settings.towerXpZoneBonus}
            onChange={v => upd('towerXpZoneBonus', v)} />
        </div>

        <SectionSaveBtn saving={saving.tower} saved={saved.tower} error={saveErr.tower} onSave={() => saveSection('tower')} />

        {/* Zone customisation */}
        <div className="ap-zone-editor">
          <div className="ap-zone-editor-title">Zone Names &amp; Descriptions</div>
          <p className="ap-zone-editor-desc">Customise the name and flavour text shown to players as they enter each zone.</p>
          <div className="ap-zone-list">
            {DEFAULT_TOWER_ZONES.map((_, i) => (
              <ZoneRow
                key={i}
                zoneNum={i + 1}
                name={settings[`towerZone${i + 1}Name`]}
                desc={settings[`towerZone${i + 1}Desc`]}
                onNameChange={v => upd(`towerZone${i + 1}Name`, v)}
                onDescChange={v => upd(`towerZone${i + 1}Desc`, v)}
              />
            ))}
          </div>
          <div className="ap-section-footer">
            {saveErr.tower && <span className="ap-section-save-err">{saveErr.tower}</span>}
            <button
              className={`ap-section-save-btn ${saved.tower ? 'saved' : ''} ${saveErr.tower ? 'error' : ''}`}
              onClick={() => saveSection('tower')}
              disabled={saving.tower}
            >
              {saving.tower ? 'Saving…' : saved.tower ? '✓ Saved!' : saveErr.tower ? '✗ Failed — try again' : 'Save Zone Names'}
            </button>
          </div>
        </div>

        {/* Reset danger action */}
        <div className="ap-danger-zone" style={{ margin: '0 24px 24px' }}>
          <div className="ap-danger-zone-title">⚠️ Danger Zone</div>
          <p className="ap-danger-zone-desc">Resets all player Tower progress to Floor 1. This cannot be undone.</p>
          <div className="ap-danger-actions">
            <button
              className="ap-btn-danger"
              onClick={() => handleReset(
                '/admin/reset-tower-progress',
                'Reset ALL player Tower progress to Floor 1? This cannot be undone.',
                'All Tower progress reset successfully.',
              )}
            >
              🏰 Reset All Tower Progress
            </button>
          </div>
          {resetMsg && (
            <div className={`ap-reset-msg ${resetMsg.startsWith('✓') ? 'ok' : 'err'}`}>
              {resetMsg}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Home Page Panel ────────────────────────────────────────────────────────────

function HomePagePanel() {
  const [homeImages, setHomeImages] = useState({
    dashboard_bg: '',
    footer_bg: '',
    icon_home: '',
    icon_leaderboards: '',
    icon_clans: '',
    icon_news: '',
    icon_play: '',
    icon_coins: '',
    icon_gems: '',
    icon_notification: '',
    icon_settings: '',
    icon_friends: '',
    profile_panel_bg: '',
    stats_panel_bg: '',
    quests_panel_bg: '',
    recent_games_panel_bg: '',
    chest_image: '',
  });
  const [uploading, setUploading] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadHomeImages();
  }, []);

  async function loadHomeImages() {
    try {
      const res = await apiCall('/admin/home-images');
      if (res.ok) {
        const data = await res.json();
        setHomeImages(data.images || homeImages);
      }
    } catch (err) {
      console.error('Failed to load home images:', err);
    }
    setLoading(false);
  }

  async function handleUpload(slot, file) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image must be under 5MB');
      return;
    }

    setUploading(u => ({ ...u, [slot]: true }));

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await apiCall('/admin/home-images', {
        method: 'POST',
        body: JSON.stringify({
          slot_name: slot,
          base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setHomeImages(prev => ({ ...prev, [slot]: data.image_url }));
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }

    setUploading(u => ({ ...u, [slot]: false }));
  }

  async function handleRemove(slot) {
    if (!window.confirm('Remove this image?')) return;

    setUploading(u => ({ ...u, [slot]: true }));

    try {
      const res = await apiCall(`/admin/home-images/${slot}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setHomeImages(prev => ({ ...prev, [slot]: '' }));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }

    setUploading(u => ({ ...u, [slot]: false }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiCall('/admin/home-images/save', {
        method: 'POST',
        body: JSON.stringify({ images: homeImages }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('error');
      setTimeout(() => setSaveMsg(''), 3000);
    }
    setSaving(false);
  }

  if (loading) return <div className="ap-loading">Loading...</div>;

  const imageSlots = [
    { id: 'dashboard_bg', label: 'Dashboard Background', desc: 'Background image for home page dashboard' },
    { id: 'footer_bg', label: 'Footer Background', desc: 'Background image for bottom navigation bar' },
  ];

  const iconSlots = [
    { id: 'icon_home', label: 'HOME Icon', desc: 'Navigation icon for Home tab' },
    { id: 'icon_leaderboards', label: 'LEADERBOARDS Icon', desc: 'Navigation icon for Leaderboards' },
    { id: 'icon_clans', label: 'CLANS Icon', desc: 'Navigation icon for Clans' },
    { id: 'icon_news', label: 'NEWS Icon', desc: 'Navigation icon for News' },
    { id: 'icon_play', label: 'PLAY Icon', desc: 'Navigation icon for Play button' },
    { id: 'icon_coins', label: 'Coins Icon', desc: 'Icon for coin currency display' },
    { id: 'icon_gems', label: 'Gems Icon', desc: 'Icon for gem currency display' },
    { id: 'icon_notification', label: 'Notification Icon', desc: 'Icon for notification button in header' },
    { id: 'icon_friends', label: 'Friends Icon', desc: 'Icon for friends button in header (between notifications and settings)' },
    { id: 'icon_settings', label: 'Settings Icon', desc: 'Icon for settings button in header' },
  ];

  return (
    <div className="li-panel">
      <div className="li-header">
        <div className="li-header-icon">🏠</div>
        <div>
          <h2 className="li-header-title">Home Page</h2>
          <p className="li-header-desc">Customize dashboard background and navigation icons.</p>
        </div>
      </div>

      {/* Background Images */}
      <h3 className="li-images-title">🖼️ Background Images</h3>
      <div className="li-grid">
        {imageSlots.map(slot => (
          <div key={slot.id} className="li-slot">
            <div className="li-slot-header">
              <span className="li-slot-label">{slot.label}</span>
              <span className="li-slot-desc">{slot.desc}</span>
            </div>

            <div className="li-slot-preview">
              {homeImages[slot.id] ? (
                <img src={homeImages[slot.id]} alt={slot.label} className="li-slot-img" />
              ) : (
                <div className="li-slot-empty">
                  <span className="li-slot-empty-icon">🖼️</span>
                  <span>No image uploaded</span>
                </div>
              )}
            </div>

            <div className="li-slot-actions">
              <label className={`li-upload-btn ${uploading[slot.id] ? 'uploading' : ''}`}>
                {uploading[slot.id] ? 'Uploading...' : homeImages[slot.id] ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(slot.id, e.target.files[0])}
                  disabled={uploading[slot.id]}
                  style={{ display: 'none' }}
                />
              </label>
              {homeImages[slot.id] && (
                <button
                  className="li-remove-btn"
                  onClick={() => handleRemove(slot.id)}
                  disabled={uploading[slot.id]}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Icons */}
      <h3 className="li-images-title">🎨 Navigation Icons</h3>
      <div className="li-grid">
        {iconSlots.map(slot => (
          <div key={slot.id} className="li-slot">
            <div className="li-slot-header">
              <span className="li-slot-label">{slot.label}</span>
              <span className="li-slot-desc">{slot.desc}</span>
            </div>

            <div className="li-slot-preview" style={{ height: '80px' }}>
              {homeImages[slot.id] ? (
                <img src={homeImages[slot.id]} alt={slot.label} className="li-slot-img" style={{ objectFit: 'contain' }} />
              ) : (
                <div className="li-slot-empty">
                  <span className="li-slot-empty-icon">🎨</span>
                  <span>No icon uploaded</span>
                </div>
              )}
            </div>

            <div className="li-slot-actions">
              <label className={`li-upload-btn ${uploading[slot.id] ? 'uploading' : ''}`}>
                {uploading[slot.id] ? 'Uploading...' : homeImages[slot.id] ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => handleUpload(slot.id, e.target.files[0])}
                  disabled={uploading[slot.id]}
                  style={{ display: 'none' }}
                />
              </label>
              {homeImages[slot.id] && (
                <button
                  className="li-remove-btn"
                  onClick={() => handleRemove(slot.id)}
                  disabled={uploading[slot.id]}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Panel Backgrounds */}
      <h3 className="li-images-title">📋 Panel Backgrounds</h3>
      <div className="li-grid">
        {[
          { id: 'profile_panel_bg', label: 'Player Profile Panel', desc: 'Background for player profile panel' },
          { id: 'stats_panel_bg', label: 'Stats Overview Panel', desc: 'Background for stats overview panel' },
          { id: 'quests_panel_bg', label: 'Daily Quests Panel', desc: 'Background for daily quests panel' },
          { id: 'recent_games_panel_bg', label: 'Recent Games Panel', desc: 'Background for recent games panel' },
        ].map(slot => (
          <div key={slot.id} className="li-slot">
            <div className="li-slot-header">
              <span className="li-slot-label">{slot.label}</span>
              <span className="li-slot-desc">{slot.desc}</span>
            </div>

            <div className="li-slot-preview">
              {homeImages[slot.id] ? (
                <img src={homeImages[slot.id]} alt={slot.label} className="li-slot-img" />
              ) : (
                <div className="li-slot-empty">
                  <span className="li-slot-empty-icon">🖼️</span>
                  <span>No image uploaded</span>
                </div>
              )}
            </div>

            <div className="li-slot-actions">
              <label className={`li-upload-btn ${uploading[slot.id] ? 'uploading' : ''}`}>
                {uploading[slot.id] ? 'Uploading...' : homeImages[slot.id] ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(slot.id, e.target.files[0])}
                  disabled={uploading[slot.id]}
                  style={{ display: 'none' }}
                />
              </label>
              {homeImages[slot.id] && (
                <button
                  className="li-remove-btn"
                  onClick={() => handleRemove(slot.id)}
                  disabled={uploading[slot.id]}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Widget Images */}
      <h3 className="li-images-title">🎁 Widget Images</h3>
      <div className="li-grid">
        <div className="li-slot">
          <div className="li-slot-header">
            <span className="li-slot-label">Reward Chest Image</span>
            <span className="li-slot-desc">Image shown in the Rewards widget on the homepage</span>
          </div>

          <div className="li-slot-preview" style={{ height: '80px' }}>
            {homeImages.chest_image ? (
              <img src={homeImages.chest_image} alt="Reward Chest" className="li-slot-img" style={{ objectFit: 'contain' }} />
            ) : (
              <div className="li-slot-empty">
                <span className="li-slot-empty-icon">🎁</span>
                <span>No chest image uploaded</span>
              </div>
            )}
          </div>

          <div className="li-slot-actions">
            <label className={`li-upload-btn ${uploading.chest_image ? 'uploading' : ''}`}>
              {uploading.chest_image ? 'Uploading...' : homeImages.chest_image ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload('chest_image', e.target.files[0])}
                disabled={uploading.chest_image}
                style={{ display: 'none' }}
              />
            </label>
            {homeImages.chest_image && (
              <button
                className="li-remove-btn"
                onClick={() => handleRemove('chest_image')}
                disabled={uploading.chest_image}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="li-save-row" style={{ marginTop: '32px' }}>
        <button
          className="li-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳ Saving...' : '💾 Save All Changes'}
        </button>
        {saveMsg === 'success' && <span className="li-save-success">✓ Saved successfully</span>}
        {saveMsg === 'error' && <span className="li-save-error">✗ Failed to save</span>}
      </div>
    </div>
  );
}

// ── Error Boundary ─────────────────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('QuestionsPanel crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:'40px', color:'white', background:'#1a1a1a', minHeight:'400px'}}>
          <h2 style={{color:'red'}}>Question Manager Error</h2>
          <pre style={{color:'orange', fontSize:'12px', whiteSpace:'pre-wrap'}}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{marginTop:'20px', padding:'10px 20px', cursor:'pointer'}}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Root Admin App ─────────────────────────────────────────────────────────────

// ── Journey Page Editor: live preview of the player's Journey page ────────────
// Two modes:
//  • Page Text — click-to-edit UI text + chapter/level names (saves immediately).
//  • Elements  — visual builder: add/drag/edit/delete free-placed text panels in a
//    local DRAFT; nothing reaches players until Save. UI text saves to
//    ui_text_overrides, names reuse the journey endpoints, panels use
//    journey_custom_elements. See JourneyMode.jsx for the editor wiring.

const ELEMENT_SCOPES = [
  { id: 'all', label: 'All subjects (shown everywhere)' },
  ...JOURNEY_SUBJECTS.map(s => ({ id: s.id, label: `${s.icon} ${s.label}` })),
];

// Identity-independent fingerprint of the draft, for the "unsaved changes" flag.
function fingerprintElements(arr) {
  return JSON.stringify(
    (arr || []).map(e => ({ id: e.id || null, text: e.text, x: Number(e.pos_x), y: Number(e.pos_y) }))
  );
}

function JourneyPageEditor() {
  const [mode, setMode] = useState('text'); // 'text' | 'elements'

  // Elements-mode state
  const [scope,    setScope]    = useState('all');   // subject id or 'all' (→ global/null)
  const [draft,    setDraft]    = useState([]);      // working copy
  const [snapshot, setSnapshot] = useState([]);      // last-saved baseline
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');

  const dirty = fingerprintElements(draft) !== fingerprintElements(snapshot);
  // First active journey subject — the map shown as backdrop when editing global panels.
  const previewSubjectId = mode === 'elements'
    ? (scope === 'all' ? JOURNEY_SUBJECTS[0]?.id : scope)
    : null;

  async function loadElements(forScope) {
    setLoading(true);
    setSaveMsg('');
    try {
      const res  = await apiCall(`/admin/journey-elements?subject=${encodeURIComponent(forScope)}`);
      const data = await res.json();
      const els  = (data.elements || []).map(e => ({ ...e }));
      setDraft(els.map(e => ({ ...e })));
      setSnapshot(els.map(e => ({ ...e })));
    } catch {
      setDraft([]); setSnapshot([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (mode === 'elements') loadElements(scope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scope]);

  function addPanel() {
    setDraft(d => [
      ...d,
      {
        _localId: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        subject: scope === 'all' ? null : scope,
        text: 'New panel',
        pos_x: 40,
        pos_y: 40,
      },
    ]);
  }
  const matchId = (e, id) => (e.id ?? e._localId) === id;
  const moveElement = (id, x, y) => setDraft(d => d.map(e => matchId(e, id) ? { ...e, pos_x: x, pos_y: y } : e));
  const editElement = (id, text) => setDraft(d => d.map(e => matchId(e, id) ? { ...e, text } : e));
  const deleteElement = (id) => setDraft(d => d.filter(e => !matchId(e, id)));

  async function save() {
    setSaving(true);
    setSaveMsg('');
    try {
      const draftIds = new Set(draft.filter(e => e.id).map(e => e.id));
      const snapById = new Map(snapshot.map(e => [e.id, e]));
      // Deletions: rows in the snapshot the draft no longer contains.
      for (const e of snapshot) {
        if (!draftIds.has(e.id)) {
          const res = await apiCall(`/admin/journey-elements/${e.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('delete failed');
        }
      }
      // Creates + updates.
      for (const e of draft) {
        const body = {
          subject: scope === 'all' ? 'all' : scope,
          text: e.text,
          pos_x: e.pos_x,
          pos_y: e.pos_y,
        };
        if (e.id) {
          const orig = snapById.get(e.id);
          const changed = !orig
            || orig.text !== e.text
            || Number(orig.pos_x) !== Number(e.pos_x)
            || Number(orig.pos_y) !== Number(e.pos_y);
          if (changed) {
            const res = await apiCall(`/admin/journey-elements/${e.id}`, { method: 'PUT', body: JSON.stringify(body) });
            if (!res.ok) throw new Error('update failed');
          }
        } else {
          const res = await apiCall('/admin/journey-elements', { method: 'POST', body: JSON.stringify(body) });
          if (!res.ok) throw new Error('create failed');
        }
      }
      await loadElements(scope); // re-sync ids + baseline
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('error');
    }
    setSaving(false);
  }

  return (
    <div className="jpe-panel">
      <div className="jpe-head">
        <h2 className="jpe-title">🗺️ Journey Page Editor</h2>
        <div className="jpe-modes">
          <button
            className={`jpe-modebtn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >✏️ Page Text</button>
          <button
            className={`jpe-modebtn ${mode === 'elements' ? 'active' : ''}`}
            onClick={() => setMode('elements')}
          >🧩 Elements</button>
        </div>
        {mode === 'text' ? (
          <p className="jpe-desc">
            Click any <strong>highlighted</strong> text to edit it — UI labels save instantly,
            chapter/level names update the journey content. Open a subject to edit its map names.
          </p>
        ) : (
          <p className="jpe-desc">
            Add free-placed text panels over the map. Drag by the top bar, click the text to edit,
            × to delete. Changes are a <strong>draft</strong> — players only see them after you press
            Save.
          </p>
        )}
      </div>

      {mode === 'elements' && (
        <div className="jpe-toolbar">
          <label className="jpe-tool-label">
            Subject:
            <select className="jpe-select" value={scope} onChange={e => setScope(e.target.value)}>
              {ELEMENT_SCOPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <button className="jpe-btn" onClick={addPanel} disabled={loading}>+ Add Panel</button>
          <span className="jpe-spacer" />
          {dirty && <span className="jpe-unsaved">● Unsaved changes</span>}
          {saveMsg === 'success' && <span className="jpe-saved">✓ Saved — live for players</span>}
          {saveMsg === 'error' && <span className="jpe-error">✗ Save failed</span>}
          <button className="jpe-btn jpe-btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      )}

      <div className="jpe-frame">
        <JourneyMode
          editorMode
          username=""
          onBack={() => {}}
          onPlayLevel={() => {}}
          journeyReentry={null}
          onReentryConsumed={() => {}}
          {...(mode === 'elements' ? {
            editorElements: draft,
            onElementMove: moveElement,
            onElementText: editElement,
            onElementDelete: deleteElement,
            previewSubjectId,
          } : {})}
        />
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(AUTH_KEY));
  const [tab, setTab] = useState('stats');
  const [sharedSubjects, setSharedSubjects] = useState([]);
  // Admin-only light/dark theme. Defaults to 'dark' so the current look is
  // unchanged until the user toggles. Persisted in localStorage.
  const [adminTheme, setAdminTheme] = useState(() => {
    try { return localStorage.getItem('mr_admin_theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  useEffect(() => {
    try { localStorage.setItem('mr_admin_theme', adminTheme); } catch {}
  }, [adminTheme]);

  useEffect(() => {
    if (authed) {
      apiCall('/api/subjects')
        .then(r => r.json())
        .then(data => setSharedSubjects(data.subjects || []))
        .catch(e => console.error('Failed to load subjects:', e));
    }
  }, [authed]);

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="ap-root" data-admin-theme={adminTheme}>
      <header className="ap-header">
        <div className="ap-header-left">
          <span className="ap-header-logo">⚕️</span>
          <span className="ap-header-title">USMLE Battle Royale</span>
          <span className="ap-header-badge">Admin Panel</span>
        </div>
        <div className="ap-header-right">
          <button
            className="ap-theme-toggle"
            onClick={() => setAdminTheme(t => (t === 'light' ? 'dark' : 'light'))}
            title={`Switch to ${adminTheme === 'light' ? 'dark' : 'light'} theme`}
          >
            {adminTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button className="ap-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="ap-nav">
        <button className={`ap-nav-btn ${tab === 'stats'         ? 'active' : ''}`} onClick={() => setTab('stats')}>
          📊 Stats Dashboard
        </button>
        <button className={`ap-nav-btn ${tab === 'questions'     ? 'active' : ''}`} onClick={() => setTab('questions')}>
          📋 Question Manager
        </button>
        <button className={`ap-nav-btn ${tab === 'subjects'        ? 'active' : ''}`} onClick={() => setTab('subjects')}>
          📚 Subjects
        </button>
        <button className={`ap-nav-btn ${tab === 'tower'          ? 'active' : ''}`} onClick={() => setTab('tower')}>
          🏰 Tower Editor
        </button>
        <button className={`ap-nav-btn ${tab === 'quests'        ? 'active' : ''}`} onClick={() => setTab('quests')}>
          📅 Daily Quests
        </button>
        <button className={`ap-nav-btn ${tab === 'videos'        ? 'active' : ''}`} onClick={() => setTab('videos')}>
          🎬 Videos
        </button>
        <button className={`ap-nav-btn ${tab === 'journey'       ? 'active' : ''}`} onClick={() => setTab('journey')}>
          🚑 First Aid Journey
        </button>
        <button className={`ap-nav-btn ${tab === 'journeyeditor' ? 'active' : ''}`} onClick={() => setTab('journeyeditor')}>
          🗺️ Journey Page Editor
        </button>
        <button className={`ap-nav-btn ${tab === 'announcements' ? 'active' : ''}`} onClick={() => setTab('announcements')}>
          📣 Announcements
        </button>
        <button className={`ap-nav-btn ${tab === 'landing'       ? 'active' : ''}`} onClick={() => setTab('landing')}>
          🖼️ Landing Page
        </button>
        <button className={`ap-nav-btn ${tab === 'playpage'     ? 'active' : ''}`} onClick={() => setTab('playpage')}>
          🎮 Play Page
        </button>
        <button className={`ap-nav-btn ${tab === 'homepage'      ? 'active' : ''}`} onClick={() => setTab('homepage')}>
          🏠 Home Page
        </button>
        <button className={`ap-nav-btn ${tab === 'settings'      ? 'active' : ''}`} onClick={() => setTab('settings')}>
          ⚙️ Game Settings
        </button>
        <button className={`ap-nav-btn ${tab === 'anking'        ? 'active' : ''}`} onClick={() => setTab('anking')}>
          🃏 AnKing
        </button>
      </nav>

      <main className="ap-main">
        {tab === 'stats'         && <StatsPanel />}
        {tab === 'questions'     && (
          <ErrorBoundary>
            <QuestionsPanel subjects={sharedSubjects} />
          </ErrorBoundary>
        )}
        {tab === 'subjects'      && <SubjectsPanel subjects={sharedSubjects} setSubjects={setSharedSubjects} />}
        {tab === 'tower'         && <TowerEditorPanel />}
        {tab === 'quests'        && <QuestsPanel />}
        {tab === 'videos'        && <VideosPanel />}
        {tab === 'journey'       && <JourneyPanel />}
        {tab === 'journeyeditor' && <JourneyPageEditor />}
        {tab === 'announcements' && <AnnouncementsPanel />}
        {tab === 'landing'       && <LandingImagesPanel />}
        {tab === 'playpage'      && <PlayPageAdmin />}
        {tab === 'homepage'      && <HomePagePanel />}
        {tab === 'settings'      && <SettingsPanel />}
        {tab === 'anking'        && <AnKingAdmin />}
      </main>
    </div>
  );
}
