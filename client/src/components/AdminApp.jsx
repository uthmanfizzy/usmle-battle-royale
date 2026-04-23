import { useState, useEffect } from 'react';
import './AdminApp.css';

const API = 'https://usmle-battle-royale-production.up.railway.app';
const AUTH_KEY = 'usmle_admin_session';

const LETTERS = ['A', 'B', 'C', 'D'];

const FOLDERS = [
  { id: 'all',           label: 'All Questions',  icon: '🏥', prefix: null },
  { id: 'cardiology',    label: 'Cardiology',     icon: '❤️',  prefix: 'CA' },
  { id: 'neurology',     label: 'Neurology',      icon: '🧠', prefix: 'NE' },
  { id: 'pharmacology',  label: 'Pharmacology',   icon: '💊', prefix: 'PH' },
  { id: 'microbiology',  label: 'Microbiology',   icon: '🦠', prefix: 'MI' },
  { id: 'biochemistry',  label: 'Biochemistry',   icon: '⚗️', prefix: 'BC' },
  { id: 'biostatistics', label: 'Biostatistics',  icon: '📊', prefix: 'BS' },
  { id: 'pathology',     label: 'Pathology',      icon: '🔬', prefix: 'PT' },
];

const SUBJECTS = FOLDERS.filter(f => f.id !== 'all').map(f => f.id);

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
  const [form, setForm] = useState(() => question ? {
    subject: question.subject,
    difficulty: question.difficulty || 'easy',
    question: question.question,
    optionA: question.options[0] || '',
    optionB: question.options[1] || '',
    optionC: question.options[2] || '',
    optionD: question.options[3] || '',
    correct: question.correct,
    explanation: question.explanation,
  } : {
    subject: defaultSubject === 'all' ? 'cardiology' : defaultSubject,
    difficulty: 'easy',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct: 'A',
    explanation: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      subject: form.subject,
      difficulty: form.difficulty,
      question: form.question.trim(),
      options: [form.optionA.trim(), form.optionB.trim(), form.optionC.trim(), form.optionD.trim()],
      correct: form.correct,
      explanation: form.explanation.trim(),
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
  const nextIdPreview = isEdit
    ? question.id
    : `${folderForSubject?.prefix || '??'}-###`;

  return (
    <div className="ap-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ap-modal">
        <div className="ap-modal-head">
          <h2>
            {isEdit
              ? `Edit Question · ${question.id}`
              : `New Question · ${nextIdPreview}`}
          </h2>
          <button className="ap-modal-x" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="ap-qform">
          <div className="ap-row-3">
            <div className="ap-field">
              <label>Subject</label>
              <select value={form.subject} onChange={e => set('subject', e.target.value)}>
                {SUBJECTS.map(s => {
                  const f = FOLDERS.find(fl => fl.id === s);
                  return (
                    <option key={s} value={s}>
                      {f?.icon} {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  );
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

          {error && <div className="ap-error">{error}</div>}

          <div className="ap-modal-foot">
            <button type="button" className="ap-btn-sec" onClick={onClose}>Cancel</button>
            <button type="submit" className="ap-btn-pri" disabled={saving}>
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
    acc[f.id] = f.id === 'all'
      ? questions.length
      : questions.filter(q => q.subject === f.id).length;
    return acc;
  }, {});

  const filtered = activeFolder === 'all'
    ? questions
    : questions.filter(q => q.subject === activeFolder);

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
                    <td className="ap-td-preview" title={q.question}>
                      {q.question.length > 90 ? q.question.slice(0, 90) + '…' : q.question}
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
                    <td colSpan={5} className="ap-empty">
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

// ── Settings Panel ─────────────────────────────────────────────────────────────

function SettingsPanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiCall('/admin/settings')
      .then(r => r.json())
      .then(setSettings)
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSettings(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  }

  function upd(key, val) {
    setSettings(s => ({ ...s, [key]: val }));
  }

  if (loading) return <div className="ap-loading">Loading settings…</div>;
  if (!settings) return <div className="ap-error">{error || 'Failed to load settings.'}</div>;

  return (
    <div className="ap-settings">
      <div className="ap-settings-grid">

        <div className="ap-setting-card">
          <div className="ap-setting-info">
            <div className="ap-setting-title">Hard Mode</div>
            <div className="ap-setting-desc">Enable high-difficulty game mode globally</div>
          </div>
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={settings.hardModeEnabled}
              onChange={e => upd('hardModeEnabled', e.target.checked)}
            />
            <span className="ap-slider" />
          </label>
        </div>

        <div className="ap-setting-card">
          <div className="ap-setting-info">
            <div className="ap-setting-title">Step 2 Mode</div>
            <div className="ap-setting-desc">Enable USMLE Step 2 CK question bank</div>
          </div>
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={settings.step2Enabled}
              onChange={e => upd('step2Enabled', e.target.checked)}
            />
            <span className="ap-slider" />
          </label>
        </div>

        <div className="ap-setting-card">
          <div className="ap-setting-info">
            <div className="ap-setting-title">Question Timer</div>
            <div className="ap-setting-desc">Seconds players have to answer each question (5–60)</div>
          </div>
          <div className="ap-stepper">
            <button type="button" onClick={() => upd('timerDuration', Math.max(5, settings.timerDuration - 5))}>−</button>
            <input
              type="number"
              value={settings.timerDuration}
              min={5}
              max={60}
              onChange={e => upd('timerDuration', Math.max(5, Math.min(60, Number(e.target.value))))}
            />
            <button type="button" onClick={() => upd('timerDuration', Math.min(60, settings.timerDuration + 5))}>+</button>
            <span className="ap-stepper-unit">sec</span>
          </div>
        </div>

        <div className="ap-setting-card">
          <div className="ap-setting-info">
            <div className="ap-setting-title">Starting Lives</div>
            <div className="ap-setting-desc">How many lives each player starts with (1–10)</div>
          </div>
          <div className="ap-stepper">
            <button type="button" onClick={() => upd('startingLives', Math.max(1, settings.startingLives - 1))}>−</button>
            <input
              type="number"
              value={settings.startingLives}
              min={1}
              max={10}
              onChange={e => upd('startingLives', Math.max(1, Math.min(10, Number(e.target.value))))}
            />
            <button type="button" onClick={() => upd('startingLives', Math.min(10, settings.startingLives + 1))}>+</button>
            <span className="ap-stepper-unit">lives</span>
          </div>
        </div>

      </div>

      {error && <div className="ap-error ap-settings-error">{error}</div>}

      <button
        className={`ap-btn-pri ap-save-btn ${saved ? 'ap-saved' : ''}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving…' : saved ? '✓ Settings Saved!' : 'Save Settings'}
      </button>
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
