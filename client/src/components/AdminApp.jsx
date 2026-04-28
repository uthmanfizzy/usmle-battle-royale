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
];

const FOLDERS = [
  { id: 'all',           label: 'All Questions',   icon: '🏥', prefix: null,  special: false },
  { id: '__images__',    label: 'Image Questions',  icon: '🖼️', prefix: null,  special: true  },
  { id: 'scan_master',   label: 'Scan Master',      icon: '🔬', prefix: 'SM',  special: false },
  { id: 'cardiology',    label: 'Cardiology',       icon: '❤️',  prefix: 'CA',  special: false },
  { id: 'neurology',     label: 'Neurology',        icon: '🧠', prefix: 'NE',  special: false },
  { id: 'pharmacology',  label: 'Pharmacology',     icon: '💊', prefix: 'PH',  special: false },
  { id: 'microbiology',  label: 'Microbiology',     icon: '🦠', prefix: 'MI',  special: false },
  { id: 'biochemistry',  label: 'Biochemistry',     icon: '⚗️', prefix: 'BC',  special: false },
  { id: 'biostatistics', label: 'Biostatistics',    icon: '📊', prefix: 'BS',  special: false },
];

const SUBJECTS = FOLDERS.filter(f => !f.special && f.id !== 'all').map(f => f.id);

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
                {SUBJECTS.map(s => {
                  const f = FOLDERS.find(fl => fl.id === s);
                  return <option key={s} value={s}>{f?.icon} {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>;
                })}
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
    if (f.id === 'all')        acc[f.id] = questions.length;
    else if (f.id === '__images__') acc[f.id] = questions.filter(q => q.image_url).length;
    else                       acc[f.id] = questions.filter(q => q.subject === f.id).length;
    return acc;
  }, {});

  const baseFiltered = activeFolder === 'all'       ? questions
    : activeFolder === '__images__'             ? questions.filter(q => q.image_url)
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
          {FOLDERS.map(f => (
            <button
              key={f.id}
              className={`ap-folder-btn ${activeFolder === f.id ? 'active' : ''} ${f.id !== 'all' ? `ap-folder-${f.id}` : 'ap-folder-all'}`}
              onClick={() => setActiveFolder(f.id)}
            >
              <span className="ap-folder-icon">{f.icon}</span>
              <span className="ap-folder-label">{f.label}</span>
              <span className="ap-folder-count">{folderCounts[f.id] || 0}</span>
            </button>
          ))}
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
                    <td colSpan={7} className="ap-empty">
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

// ── Settings helpers ───────────────────────────────────────────────────────────

function withDefaults(raw) {
  return {
    // kept for server compatibility
    hardModeEnabled:         raw.hardModeEnabled         ?? false,
    step2Enabled:            raw.step2Enabled            ?? false,
    timerDuration:           raw.timerDefault            ?? raw.timerDuration            ?? 20,
    startingLives:           raw.battleRoyaleLives       ?? raw.startingLives            ?? 3,
    // Question settings
    timerDefault:            raw.timerDefault            ?? raw.timerDuration            ?? 20,
    timerSpeedRace:          raw.timerSpeedRace          ?? 10,
    timerTriviaPursuit:      raw.timerTriviaPursuit      ?? 25,
    timerScanMaster:         raw.timerScanMaster         ?? 25,
    explanationTime:         raw.explanationTime         ?? 5,
    speedRaceQuestions:      raw.speedRaceQuestions      ?? 20,
    battleRoyaleMaxQ:        raw.battleRoyaleMaxQ        ?? 0,
    minQuestionsPerCategory: raw.minQuestionsPerCategory ?? 5,
    // Lives & difficulty
    battleRoyaleLives:       raw.battleRoyaleLives       ?? raw.startingLives            ?? 3,
    suddenDeathTrigger:      raw.suddenDeathTrigger      ?? 2,
    suddenDeathTimer:        raw.suddenDeathTimer        ?? 5,
    towerFloorLives:         raw.towerFloorLives         ?? 3,
    bossTolerance:           raw.bossTolerance           ?? 0,
    // Lobby
    maxPlayersPerLobby:      raw.maxPlayersPerLobby      ?? 10,
    minPlayersToStart:       raw.minPlayersToStart       ?? 2,
    maxBotsPerLobby:         raw.maxBotsPerLobby         ?? 3,
    lobbyAutoStart:          raw.lobbyAutoStart          ?? 0,
    allowGuests:             raw.allowGuests             ?? true,
    allowQuickJoin:          raw.allowQuickJoin          ?? true,
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

// ── Settings Panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState({ questions: false, lives: false, lobby: false });
  const [saved,    setSaved]    = useState({ questions: false, lives: false, lobby: false });

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
        <button className={`ap-nav-btn ${tab === 'stats'     ? 'active' : ''}`} onClick={() => setTab('stats')}>
          📊 Stats Dashboard
        </button>
        <button className={`ap-nav-btn ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>
          📋 Question Manager
        </button>
        <button className={`ap-nav-btn ${tab === 'settings'  ? 'active' : ''}`} onClick={() => setTab('settings')}>
          ⚙️ Game Settings
        </button>
      </nav>

      <main className="ap-main">
        {tab === 'stats'     && <StatsPanel />}
        {tab === 'questions' && <QuestionsPanel />}
        {tab === 'settings'  && <SettingsPanel />}
      </main>
    </div>
  );
}
