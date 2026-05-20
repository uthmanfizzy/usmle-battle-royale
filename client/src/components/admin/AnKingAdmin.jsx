import { useState, useEffect } from 'react';
import './AnKingAdmin.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';
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

export default function AnKingAdmin() {
  const [activeTab, setActiveTab] = useState('import');
  const [ankiFile, setAnkiFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab, page, filterSubject, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (saveStatus) setTimeout(() => setSaveStatus(''), 3000);
  }, [saveStatus]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
      });
      if (filterSubject) params.append('subject', filterSubject);
      if (searchQuery) params.append('q', searchQuery);

      const res = await apiCall(`/api/admin/anking/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotalQuestions(data.total || 0);
      setSubjects(data.subjects || []);
    } catch(e) { console.error(e); }
    setLoadingQuestions(false);
  };

  const fetchStats = async () => {
    try {
      const res = await apiCall('/api/admin/anking/stats');
      const data = await res.json();
      setStats(data);
    } catch(e) { console.error(e); }
  };

  const handlePreview = async () => {
    if (!ankiFile) return;
    setPreviewing(true);
    setPreview(null);
    try {
      // Only send first 2MB for preview - enough to read SQLite header and first records
      const PREVIEW_SIZE = 2 * 1024 * 1024; // 2MB
      const slice = ankiFile.slice(0, Math.min(ankiFile.size, PREVIEW_SIZE));
      const previewFile = new File([slice], ankiFile.name, { type: ankiFile.type });

      const formData = new FormData();
      formData.append('apkg', previewFile);
      formData.append('isPreview', 'true');

      // Add 15s timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${SERVER_URL}/api/admin/preview-anki`, {
        method: 'POST',
        body: formData,
        headers: { 'x-admin-password': localStorage.getItem(AUTH_KEY) || '' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      const data = await res.json();
      setPreview(data);
    } catch(e) {
      if (e.name === 'AbortError') {
        setPreview({ error: 'Preview timed out. The file may be too large — try importing directly.' });
      } else {
        setPreview({ error: e.message });
      }
    }
    setPreviewing(false);
  };

  const handleImport = async () => {
    if (!ankiFile) return;
    if (!window.confirm(`Import all cards from "${ankiFile.name}"? This may take several minutes for large decks.`)) return;
    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('apkg', ankiFile);
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/import-anki`, {
        method: 'POST',
        body: formData,
        headers: { 'x-admin-password': localStorage.getItem(AUTH_KEY) || '' }
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        setSaveStatus(`✅ Imported ${data.imported} cards!`);
      }
    } catch(e) { setImportResult({ error: e.message }); }
    setImporting(false);
  };

  const handleDeleteQuestion = async (id) => {
    try {
      const res = await apiCall(`/api/admin/anking/questions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        setTotalQuestions(prev => prev - 1);
        setDeleteConfirm(null);
        setSaveStatus('✅ Question deleted');
      }
    } catch(e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL AnKing questions? This cannot be undone!')) return;
    if (!window.confirm('Are you absolutely sure? This will delete all imported AnKing cards permanently!')) return;
    try {
      const res = await apiCall('/api/admin/anking/questions/all', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setQuestions([]);
        setTotalQuestions(0);
        setSaveStatus(`✅ Deleted ${data.deleted} questions`);
      }
    } catch(e) { console.error(e); }
  };

  const handleUpdateQuestion = async (q) => {
    try {
      const res = await apiCall(`/api/admin/anking/questions/${q.id}`, {
        method: 'PUT',
        body: JSON.stringify(q)
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.map(existing => existing.id === q.id ? q : existing));
        setSelectedQuestion(null);
        setSaveStatus('✅ Question updated!');
      }
    } catch(e) { console.error(e); }
  };

  const totalPages = Math.ceil(totalQuestions / PAGE_SIZE);

  return (
    <div className="anking-admin">
      <div className="anking-admin-header">
        <h2>🃏 AnKing Manager</h2>
        {saveStatus && <div className="anking-save-toast">{saveStatus}</div>}
      </div>

      {/* Sub tabs */}
      <div className="anking-admin-tabs">
        {[
          { id: 'import', label: '📥 Import' },
          { id: 'questions', label: `📋 Questions${totalQuestions > 0 ? ` (${totalQuestions.toLocaleString()})` : ''}` },
          { id: 'stats', label: '📊 Stats' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`anking-admin-tab ${activeTab === tab.id ? 'anking-admin-tab--active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div className="anking-admin-section">
          <h3>Import AnKing Deck</h3>
          <p className="anking-help-text">Upload an .apkg file exported from Anki. Large decks may take several minutes to import.</p>

          {/* File picker */}
          <label className="anking-file-drop">
            <div className="anking-file-icon">📦</div>
            <div className="anking-file-text">
              {ankiFile ? (
                <>
                  <strong>{ankiFile.name}</strong>
                  <span>{(ankiFile.size / 1024 / 1024).toFixed(1)} MB</span>
                </>
              ) : (
                <>
                  <strong>Click to choose .apkg file</strong>
                  <span>or drag and drop here</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept=".apkg"
              style={{display:'none'}}
              onChange={e => {
                const file = e.target.files[0];
                setAnkiFile(file);
                setImportResult(null);
                // Show immediate file info without server call
                if (file) {
                  setPreview({
                    fileName: file.name,
                    fileSize: (file.size / 1024 / 1024).toFixed(1),
                    quickInfo: true // flag to show loading state
                  });
                } else {
                  setPreview(null);
                }
              }}
            />
          </label>

          {ankiFile && (
            <div className="anking-import-actions">
              <button
                className="anking-btn anking-btn--preview"
                onClick={handlePreview}
                disabled={previewing}
              >
                {previewing ? '⏳ Loading preview...' : '👁 Preview Deck'}
              </button>
              <button
                className="anking-btn anking-btn--import"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? '⏳ Importing... please wait' : '📥 Import All Cards'}
              </button>
            </div>
          )}

          {/* Quick file info - shown immediately on file selection */}
          {preview?.quickInfo && !preview.totalCards && (
            <div className="anking-preview-box">
              <p className="anking-preview-header">
                📦 <strong>{preview.fileName}</strong> — {preview.fileSize} MB
              </p>
              <p className="anking-help-text">Click "👁 Preview Deck" to see card count and sample cards.</p>
            </div>
          )}

          {/* Full preview - shown after server processes */}
          {preview && !preview.error && preview.totalCards && (
            <div className="anking-preview-box">
              <div className="anking-preview-header">
                <span>📊 <strong>{preview.totalCards?.toLocaleString()}</strong> total cards</span>
              </div>
              {preview.deckNames?.length > 0 && (
                <div className="anking-preview-decks">
                  <p className="anking-preview-label">Decks found:</p>
                  <div className="anking-deck-chips">
                    {preview.deckNames.slice(0,20).map((name, i) => (
                      <span className="anking-deck-chip" key={i}>{name}</span>
                    ))}
                    {preview.deckNames.length > 20 && (
                      <span className="anking-deck-chip anking-deck-chip--more">+{preview.deckNames.length - 20} more</span>
                    )}
                  </div>
                </div>
              )}
              <div className="anking-preview-cards">
                <p className="anking-preview-label">Sample cards:</p>
                {preview.preview?.map((card, i) => (
                  <div className="anking-preview-card" key={i}>
                    <div className="anking-preview-fields">
                      <span className="anking-field-label">Fields: </span>
                      {card.fields?.map((f, j) => (
                        <span className="anking-field-chip" key={j}>{f}</span>
                      ))}
                    </div>
                    {card.values?.slice(0,2).map((val, j) => val && (
                      <div className="anking-preview-field-row" key={j}>
                        <strong>{card.fields?.[j] || `Field ${j+1}`}:</strong>
                        <span>{val.substring(0,200)}{val.length > 200 ? '...' : ''}</span>
                      </div>
                    ))}
                    {card.tags && <div className="anking-preview-tags">🏷 {card.tags}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview?.error && (
            <div className="anking-error-box">❌ {preview.error}</div>
          )}

          {/* Import result */}
          {importResult && (
            <div className={`anking-result-box ${importResult.success ? 'anking-result-box--success' : 'anking-result-box--error'}`}>
              {importResult.success ? (
                <div className="anking-result-grid">
                  <div className="anking-result-stat">
                    <span className="anking-result-num">{importResult.imported?.toLocaleString()}</span>
                    <span className="anking-result-label">Imported</span>
                  </div>
                  <div className="anking-result-stat">
                    <span className="anking-result-num">{importResult.skipped?.toLocaleString()}</span>
                    <span className="anking-result-label">Skipped</span>
                  </div>
                  <div className="anking-result-stat">
                    <span className="anking-result-num">{importResult.duplicate?.toLocaleString() || 0}</span>
                    <span className="anking-result-label">Duplicates</span>
                  </div>
                  <div className="anking-result-stat">
                    <span className="anking-result-num">{importResult.total?.toLocaleString()}</span>
                    <span className="anking-result-label">Total in Deck</span>
                  </div>
                </div>
              ) : (
                <p>❌ {importResult.error}</p>
              )}
              {importResult.errors?.length > 0 && (
                <details className="anking-errors-details">
                  <summary>⚠️ {importResult.errors.length} errors during import</summary>
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="anking-error-item">{e}</p>
                  ))}
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="anking-admin-section">
          <div className="anking-questions-toolbar">
            <input
              className="anking-search-input"
              placeholder="🔍 Search questions..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            />
            <select
              className="anking-filter-select"
              value={filterSubject}
              onChange={e => { setFilterSubject(e.target.value); setPage(1); }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              className="anking-btn anking-btn--danger"
              onClick={handleDeleteAll}
            >
              🗑 Delete All
            </button>
          </div>

          <p className="anking-count-text">
            Showing {questions.length} of {totalQuestions.toLocaleString()} AnKing questions
          </p>

          {loadingQuestions ? (
            <div className="anking-loading-spinner">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="anking-no-questions">
              <span>📭</span>
              <p>No questions found. Import a deck first.</p>
            </div>
          ) : (
            <>
              <div className="anking-questions-list">
                {questions.map(q => (
                  <div className="anking-question-row" key={q.id}>
                    <div className="anking-question-content">
                      <p className="anking-question-text">{q.question?.substring(0, 150)}{q.question?.length > 150 ? '...' : ''}</p>
                      <p className="anking-question-answer">→ {q.correct?.substring(0, 100)}{q.correct?.length > 100 ? '...' : ''}</p>
                      <div className="anking-question-meta">
                        {q.category && <span className="anking-meta-tag">{q.category}</span>}
                        {q.difficulty && <span className={`anking-meta-tag anking-meta-tag--${q.difficulty}`}>{q.difficulty}</span>}
                      </div>
                    </div>
                    <div className="anking-question-actions">
                      <button
                        className="anking-action-btn anking-action-btn--edit"
                        onClick={() => setSelectedQuestion({...q})}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="anking-action-btn anking-action-btn--delete"
                        onClick={() => setDeleteConfirm(q.id)}
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                    {deleteConfirm === q.id && (
                      <div className="anking-delete-confirm">
                        <span>Delete this question?</span>
                        <button className="anking-btn anking-btn--danger-sm" onClick={() => handleDeleteQuestion(q.id)}>Yes, Delete</button>
                        <button className="anking-btn anking-btn--cancel-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="anking-pagination">
                <button
                  className="anking-page-btn"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >«</button>
                <button
                  className="anking-page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >‹</button>
                <span className="anking-page-info">Page {page} of {totalPages}</span>
                <button
                  className="anking-page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >›</button>
                <button
                  className="anking-page-btn"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >»</button>
              </div>
            </>
          )}

          {/* Edit modal */}
          {selectedQuestion && (
            <div className="anking-edit-overlay" onClick={e => e.target === e.currentTarget && setSelectedQuestion(null)}>
              <div className="anking-edit-modal">
                <div className="anking-edit-header">
                  <h3>Edit Question</h3>
                  <button onClick={() => setSelectedQuestion(null)}>✕</button>
                </div>
                <div className="anking-edit-fields">
                  <label>Question</label>
                  <textarea
                    className="anking-edit-textarea"
                    rows={4}
                    value={selectedQuestion.question || ''}
                    onChange={e => setSelectedQuestion(prev => ({...prev, question: e.target.value}))}
                  />
                  <label>Answer</label>
                  <textarea
                    className="anking-edit-textarea"
                    rows={3}
                    value={selectedQuestion.correct || ''}
                    onChange={e => setSelectedQuestion(prev => ({...prev, correct: e.target.value}))}
                  />
                  <label>Explanation</label>
                  <textarea
                    className="anking-edit-textarea"
                    rows={4}
                    value={selectedQuestion.explanation || ''}
                    onChange={e => setSelectedQuestion(prev => ({...prev, explanation: e.target.value}))}
                  />
                  <div className="anking-edit-row">
                    <div>
                      <label>Subject</label>
                      <input
                        className="anking-edit-input"
                        value={selectedQuestion.category || ''}
                        onChange={e => setSelectedQuestion(prev => ({...prev, category: e.target.value}))}
                      />
                    </div>
                    <div>
                      <label>Difficulty</label>
                      <select
                        className="anking-edit-input"
                        value={selectedQuestion.difficulty || 'easy'}
                        onChange={e => setSelectedQuestion(prev => ({...prev, difficulty: e.target.value}))}
                      >
                        <option value="easy">Easy</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="anking-edit-footer">
                  <button className="anking-btn anking-btn--cancel" onClick={() => setSelectedQuestion(null)}>Cancel</button>
                  <button className="anking-btn anking-btn--save" onClick={() => handleUpdateQuestion(selectedQuestion)}>💾 Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATS TAB */}
      {activeTab === 'stats' && (
        <div className="anking-admin-section">
          <h3>AnKing Statistics</h3>
          {!stats ? (
            <p className="anking-help-text">Loading stats...</p>
          ) : (
            <>
              <div className="anking-stats-grid">
                <div className="anking-stat-card">
                  <span className="anking-stat-icon">🃏</span>
                  <span className="anking-stat-num">{stats.total?.toLocaleString() || 0}</span>
                  <span className="anking-stat-label">Total Cards</span>
                </div>
                <div className="anking-stat-card">
                  <span className="anking-stat-icon">📚</span>
                  <span className="anking-stat-num">{stats.subjects?.length || 0}</span>
                  <span className="anking-stat-label">Subjects</span>
                </div>
                <div className="anking-stat-card">
                  <span className="anking-stat-icon">📁</span>
                  <span className="anking-stat-num">{stats.topics?.length || 0}</span>
                  <span className="anking-stat-label">Topics/Decks</span>
                </div>
                <div className="anking-stat-card">
                  <span className="anking-stat-icon">🟢</span>
                  <span className="anking-stat-num">{stats.easy?.toLocaleString() || 0}</span>
                  <span className="anking-stat-label">Easy Cards</span>
                </div>
                <div className="anking-stat-card">
                  <span className="anking-stat-icon">🔴</span>
                  <span className="anking-stat-num">{stats.hard?.toLocaleString() || 0}</span>
                  <span className="anking-stat-label">Hard Cards</span>
                </div>
              </div>

              {stats.subjects?.length > 0 && (
                <div className="anking-breakdown">
                  <h4>Cards by Subject</h4>
                  {stats.subjects.map(s => (
                    <div className="anking-breakdown-row" key={s.subject}>
                      <span className="anking-breakdown-name">{s.subject || 'Unknown'}</span>
                      <div className="anking-breakdown-bar-wrap">
                        <div
                          className="anking-breakdown-bar"
                          style={{width: `${Math.max(2, (s.count / stats.total) * 100)}%`}}
                        />
                      </div>
                      <span className="anking-breakdown-count">{s.count?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
