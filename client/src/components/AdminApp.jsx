import { useState, useEffect } from 'react';
import './AdminApp.css';

const API = 'https://usmle-battle-royale-production.up.railway.app';
const AUTH_KEY = 'usmle_admin_session';

const LETTERS = ['A', 'B', 'C', 'D'];

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
  { id: 'scan_master',      label: 'Scan Master',                  icon: '🔬', prefix: 'SM',  special: false },
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

function QuestionModal({ question, defaultSubject = 'cardiology', onSave, onClose }) {
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
    correct:      question.correct,
    explanation:  question.explanation,
    image_url:    question.image_url || '',
    questionType: question.image_url ? 'image' : 'text',
    game_modes:   question.game_modes || (question.image_url ? ['scan_master'] : ['battle_royale', 'speed_race', 'trivia_pursuit']),
    tower_floor:  question.tower_floor || '',
    buzz_type:    question.buzz_type || 'BUZZWORD',
  } : {
    subject:      defaultSubjectResolved,
    difficulty:   'easy',
    question:     '',
    optionA:      '',
    optionB:      '',
    optionC:      '',
    optionD:      '',
    correct:      'A',
    explanation:  '',
    image_url:    '',
    questionType: 'text',
    game_modes:   ['battle_royale', 'speed_race', 'trivia_pursuit'],
    tower_floor:  '',
    buzz_type:    'BUZZWORD',
  });

  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleImageFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB.');
      return;
    }
    setUploadError('');
    setUploading(true);
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
      set('image_url', data.url);
    } catch (err) {
      setUploadError(err.message);
    }
    setUploading(false);
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
      options:     [form.optionA.trim(), form.optionB.trim(), form.optionC.trim(), form.optionD.trim()],
      correct:     form.correct,
      explanation: form.explanation.trim(),
      image_url:   form.questionType === 'image' ? form.image_url : '',
      game_modes:  form.game_modes,
      tower_floor: form.game_modes.includes('tower') && form.tower_floor !== '' ? parseInt(form.tower_floor) : null,
      buzz_type:   form.game_modes.includes('buzz_fun') ? form.buzz_type : undefined,
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
                onClick={() => setForm(f => ({ ...f, questionType: 'image', game_modes: ['scan_master'], subject: f.subject !== 'scan_master' ? 'scan_master' : f.subject }))}
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
                {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

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
            {LETTERS.map(l => (
              <div key={l} className="ap-field">
                <label>
                  <span className={`ap-letter ${l === form.correct ? 'ap-letter-correct' : 'ap-letter-plain'}`}>{l}</span>
                  {' '}Answer {l}
                </label>
                <input
                  type="text"
                  value={form[`option${l}`]}
                  onChange={e => set(`option${l}`, e.target.value)}
                  placeholder={`Answer choice ${l}`}
                  required
                />
              </div>
            ))}
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
          </div>

          <div className="ap-field">
            <label>Game Modes <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span></label>
            <div className="ap-gm-grid">
              {GAME_MODES.map(gm => {
                const needsImage = gm.id === 'scan_master';
                const isImageMode = form.questionType === 'image';
                const isDisabled = needsImage ? !form.image_url : isImageMode;
                const isChecked = form.game_modes.includes(gm.id);
                return (
                  <label
                    key={gm.id}
                    className={`ap-gm-item${isChecked ? ' checked' : ''}${isDisabled ? ' disabled' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={e => {
                        if (isDisabled) return;
                        const modes = e.target.checked
                          ? [...form.game_modes, gm.id]
                          : form.game_modes.filter(m => m !== gm.id);
                        if (modes.length > 0) set('game_modes', modes);
                      }}
                    />
                    <span className="ap-gm-icon">{gm.icon}</span>
                    <span className="ap-gm-label">{gm.label}</span>
                    {needsImage && !form.image_url && (
                      <span className="ap-gm-hint">image required</span>
                    )}
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

// ── Questions Panel ────────────────────────────────────────────────────────────

function QuestionsPanel() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState('all');
  const [modal, setModal] = useState(null); // null | 'add' | question object
  const [deleteId, setDeleteId] = useState(null);
  const [bulkMsg, setBulkMsg] = useState('');
  const [gameModeFilter, setGameModeFilter] = useState('all');

  useEffect(() => { loadQuestions(); }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await apiCall('/admin/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    await apiCall(`/admin/questions/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
    setQuestions(qs => qs.filter(q => String(q.id) !== String(deleteId)));
    setDeleteId(null);
  }

  function handleSaved(savedQ) {
    setQuestions(qs => {
      const idx = qs.findIndex(q => String(q.id) === String(savedQ.id));
      if (idx >= 0) {
        const copy = [...qs];
        copy[idx] = savedQ;
        return copy;
      }
      return [...qs, savedQ];
    });
    setModal(null);
  }

  async function handleBulkImport(e) {
    setBulkMsg('');
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(arr)) throw new Error('JSON must be an array or { questions: [...] }');
      const res = await apiCall('/admin/questions/bulk', {
        method: 'POST',
        body: JSON.stringify({ questions: arr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setBulkMsg(`✓ Imported ${data.added} question${data.added !== 1 ? 's' : ''}`);
      await loadQuestions();
    } catch (err) {
      setBulkMsg(`✗ ${err.message}`);
    }
    e.target.value = '';
  }

  const folderCounts = FOLDERS.reduce((acc, f) => {
    if (f.separator)                acc[f.id] = 0;
    else if (f.id === 'all')        acc[f.id] = questions.length;
    else if (f.id === '__images__') acc[f.id] = questions.filter(q => q.image_url).length;
    else if (f.id === 'buzz_fun')   acc[f.id] = questions.filter(q => (q.game_modes || []).includes('buzz_fun')).length;
    else                            acc[f.id] = questions.filter(q => q.subject === f.id).length;
    return acc;
  }, {});

  const baseFiltered = activeFolder === 'all'       ? questions
    : activeFolder === '__images__'             ? questions.filter(q => q.image_url)
    : activeFolder === 'buzz_fun'              ? questions.filter(q => (q.game_modes || []).includes('buzz_fun'))
    : questions.filter(q => q.subject === activeFolder);
  const filtered = gameModeFilter === 'all'
    ? baseFiltered
    : baseFiltered.filter(q => (q.game_modes || []).includes(gameModeFilter));

  if (loading) return <div className="ap-loading">Loading questions…</div>;

  return (
    <div className="ap-questions">
      <div className="ap-qm-layout">

        {/* ── Folder Sidebar ───────────────────────────────────────── */}
        <aside className="ap-sidebar">
          <div className="ap-sidebar-title">Categories</div>
          {FOLDERS.map(f => {
            if (f.separator) {
              return <div key={f.id} className="ap-sidebar-separator">Coming Soon</div>;
            }
            if (f.special && (f.id === '__images__' || f.id === 'buzz_fun')) {
              return (
                <button
                  key={f.id}
                  className={`ap-folder-btn ${activeFolder === f.id ? 'active' : ''} ap-folder-${f.id === '__images__' ? 'images' : 'buzz-fun'}`}
                  onClick={() => setActiveFolder(f.id)}
                >
                  <span className="ap-folder-icon">{f.icon}</span>
                  <span className="ap-folder-label">{f.label}</span>
                  <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
                </button>
              );
            }
            return (
              <button
                key={f.id}
                className={`ap-folder-btn ${activeFolder === f.id ? 'active' : ''} ${f.id !== 'all' ? `ap-folder-${f.id}` : 'ap-folder-all'} ${f.comingSoon ? 'ap-folder-cs' : ''}`}
                onClick={() => !f.comingSoon && setActiveFolder(f.id)}
              >
                <span className="ap-folder-icon">{f.icon}</span>
                <span className="ap-folder-label">{f.label}</span>
                <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
                {f.comingSoon && <span className="ap-folder-cs-tag">Soon</span>}
              </button>
            );
          })}
        </aside>

        {/* ── Question Table ────────────────────────────────────────── */}
        <div className="ap-qm-main">
          <div className="ap-toolbar">
            <div className="ap-toolbar-left">
              <div className="ap-folder-heading">
                {(() => {
                  const f = FOLDERS.find(fl => fl.id === activeFolder);
                  return (
                    <>
                      <span className="ap-fh-icon">{f?.icon}</span>
                      <span className="ap-fh-name">{f?.label}</span>
                      <span className="ap-fh-count">{filtered.length}</span>
                    </>
                  );
                })()}
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
            </div>
            <div className="ap-toolbar-right">
              {bulkMsg && (
                <span className={`ap-bulk-msg ${bulkMsg.startsWith('✓') ? 'ok' : 'err'}`}>
                  {bulkMsg}
                </span>
              )}
              <label className="ap-btn-sec ap-file-label">
                📥 Bulk Import
                <input type="file" accept=".json" onChange={handleBulkImport} style={{ display: 'none' }} />
              </label>
              <button className="ap-btn-pri" onClick={() => setModal('add')}>+ Add Question</button>
            </div>
          </div>

          <div className="ap-table-wrap">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Difficulty</th>
                  <th>Image</th>
                  <th>Game Modes</th>
                  <th>Tower Floor</th>
                  <th>Question Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td className="ap-td-id">
                      <span className="ap-id-pill">{q.id}</span>
                    </td>
                    <td>
                      <span className={`ap-badge ap-subj-${q.subject}`}>
                        {FOLDERS.find(f => f.id === q.subject)?.icon} {q.subject}
                      </span>
                    </td>
                    <td>
                      <span className={`ap-badge ap-diff-${q.difficulty || 'easy'}`}>
                        {q.difficulty || 'easy'}
                      </span>
                    </td>
                    <td className="ap-td-thumb">
                      {q.image_url
                        ? <img src={q.image_url} alt="" className="ap-thumb" title={q.image_url} />
                        : <span className="ap-no-image">—</span>}
                    </td>
                    <td className="ap-td-modes">
                      <div className="ap-gm-badges">
                        {(q.game_modes || ['battle_royale', 'speed_race', 'trivia_pursuit']).map(mode => {
                          const gm = GAME_MODES.find(g => g.id === mode);
                          return gm ? (
                            <span key={mode} className={`ap-gm-badge ap-gm-badge-${mode}`} title={gm.label}>
                              {gm.icon}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="ap-td-floor">
                      {(q.game_modes || []).includes('tower') && q.tower_floor
                        ? (
                          <div className="ap-floor-cell">
                            <span className="ap-floor-pill">🏰 {q.tower_floor}</span>
                            <span className="ap-floor-zone">{getTowerZone(q.tower_floor)}</span>
                          </div>
                        )
                        : <span className="ap-no-image">—</span>}
                    </td>
                    <td className="ap-td-preview" title={q.question}>
                      {q.question.length > 80 ? q.question.slice(0, 80) + '…' : q.question}
                    </td>
                    <td>
                      <div className="ap-row-actions">
                        <button className="ap-edit-btn" onClick={() => setModal(q)}>Edit</button>
                        <button className="ap-del-btn" onClick={() => setDeleteId(q.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="ap-empty">
                      No questions in this category yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <QuestionModal
          question={modal === 'add' ? null : modal}
          defaultSubject={activeFolder}
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

function SubjectsPanel() {
  const [subjects,  setSubjects]  = useState([]);
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
  }, []);

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

function SectionSaveBtn({ saving, saved, onSave }) {
  return (
    <div className="ap-section-footer">
      <button
        className={`ap-section-save-btn ${saved ? 'saved' : ''}`}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Settings'}
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

// ── Settings Panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState({ questions: false, lives: false, lobby: false, xp: false, modes: false, maintenance: false, ui: false, tower: false });
  const [saved,    setSaved]    = useState({ questions: false, lives: false, lobby: false, xp: false, modes: false, maintenance: false, ui: false, tower: false });
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    apiCall('/admin/settings')
      .then(r => r.json())
      .then(raw => setSettings(withDefaults(raw)))
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function saveSection(section) {
    setSaving(s => ({ ...s, [section]: true }));
    setSaved(s  => ({ ...s, [section]: false }));
    setError('');
    try {
      const res  = await apiCall('/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSettings(withDefaults(data));
      setSaved(s => ({ ...s, [section]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [section]: false })), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(s => ({ ...s, [section]: false }));
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
  if (!settings) return <div className="ap-error">{error || 'Failed to load settings.'}</div>;

  return (
    <div className="ap-settings-v2">

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

        <SectionSaveBtn saving={saving.questions} saved={saved.questions} onSave={() => saveSection('questions')} />
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
        </div>

        <SectionSaveBtn saving={saving.lives} saved={saved.lives} onSave={() => saveSection('lives')} />
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

        <SectionSaveBtn saving={saving.lobby} saved={saved.lobby} onSave={() => saveSection('lobby')} />
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

        <SectionSaveBtn saving={saving.xp} saved={saved.xp} onSave={() => saveSection('xp')} />
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
            desc="Restrict question pool to hard-difficulty questions only"
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

        <SectionSaveBtn saving={saving.modes} saved={saved.modes} onSave={() => saveSection('modes')} />
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

        <SectionSaveBtn saving={saving.maintenance} saved={saved.maintenance} onSave={() => saveSection('maintenance')} />

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

        <SectionSaveBtn saving={saving.ui} saved={saved.ui} onSave={() => saveSection('ui')} />
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

        <SectionSaveBtn saving={saving.tower} saved={saved.tower} onSave={() => saveSection('tower')} />

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
            <button
              className={`ap-section-save-btn ${saved.tower ? 'saved' : ''}`}
              onClick={() => saveSection('tower')}
              disabled={saving.tower}
            >
              {saving.tower ? 'Saving…' : saved.tower ? '✓ Saved!' : 'Save Zone Names'}
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

      {error && <div className="ap-error" style={{ marginTop: 4 }}>{error}</div>}

    </div>
  );
}

// ── Root Admin App ─────────────────────────────────────────────────────────────

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(AUTH_KEY));
  const [tab, setTab] = useState('stats');

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  if (!authed) {
    return <AdminLogin onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="ap-root">
      <header className="ap-header">
        <div className="ap-header-left">
          <span className="ap-header-logo">⚕️</span>
          <span className="ap-header-title">USMLE Battle Royale</span>
          <span className="ap-header-badge">Admin Panel</span>
        </div>
        <button className="ap-logout" onClick={logout}>Logout</button>
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
        <button className={`ap-nav-btn ${tab === 'announcements' ? 'active' : ''}`} onClick={() => setTab('announcements')}>
          📣 Announcements
        </button>
        <button className={`ap-nav-btn ${tab === 'settings'      ? 'active' : ''}`} onClick={() => setTab('settings')}>
          ⚙️ Game Settings
        </button>
      </nav>

      <main className="ap-main">
        {tab === 'stats'         && <StatsPanel />}
        {tab === 'questions'     && <QuestionsPanel />}
        {tab === 'subjects'      && <SubjectsPanel />}
        {tab === 'tower'         && <TowerEditorPanel />}
        {tab === 'announcements' && <AnnouncementsPanel />}
        {tab === 'settings'      && <SettingsPanel />}
      </main>
    </div>
  );
}
