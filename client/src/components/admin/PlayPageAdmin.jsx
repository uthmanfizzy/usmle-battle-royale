import { useState, useEffect } from 'react';
import './PlayPageAdmin.css';

const API = 'https://usmle-battle-royale-production.up.railway.app';
const AUTH_KEY = 'usmle_admin_session';

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

const GAME_MODES = [
  { id: 'battle_royale', name: 'BATTLE ROYALE', icon: '💀' },
  { id: 'speed_race', name: 'SPEED RACE', icon: '🏁' },
  { id: 'trivia_pursuit', name: 'TRIVIA PURSUIT', icon: '🎯' },
  { id: 'scan_master', name: 'SCAN MASTER', icon: '🔬' },
  { id: 'buzz_fun', name: 'BUZZ FUN', icon: '⚡' },
  { id: 'tower', name: 'THE TOWER', icon: '🏰' },
  { id: 'training_grounds', name: 'TRAINING GROUNDS', icon: '📚' },
];

const EXAM_BOARDS = [
  {
    id: 'usmle',
    name: 'USMLE',
    steps: [
      { id: 'step1', name: 'Step 1' },
      { id: 'step2', name: 'Step 2' },
    ],
  },
  {
    id: 'plab',
    name: 'PLAB',
    steps: [
      { id: 'part1', name: 'Part 1' },
      { id: 'part2', name: 'Part 2' },
    ],
  },
  {
    id: 'amc',
    name: 'AMC',
    steps: [
      { id: 'cat', name: 'CAT' },
      { id: 'clinical', name: 'Clinical' },
    ],
  },
];

export default function PlayPageAdmin() {
  const [activeTab, setActiveTab] = useState('background');

  return (
    <div className="pp-panel">
      <div className="pp-header">
        <div className="pp-header-icon">🎮</div>
        <div>
          <h2 className="pp-header-title">Play Page</h2>
          <p className="pp-header-desc">Manage Play page background, challenges, game modes, and exam boards.</p>
        </div>
      </div>

      <nav className="pp-tabs">
        <button
          className={`pp-tab ${activeTab === 'background' ? 'pp-tab--active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          🖼️ Background
        </button>
        <button
          className={`pp-tab ${activeTab === 'challenges' ? 'pp-tab--active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          🎯 Challenges
        </button>
        <button
          className={`pp-tab ${activeTab === 'gamemodes' ? 'pp-tab--active' : ''}`}
          onClick={() => setActiveTab('gamemodes')}
        >
          🎮 Game Modes
        </button>
        <button
          className={`pp-tab ${activeTab === 'examboards' ? 'pp-tab--active' : ''}`}
          onClick={() => setActiveTab('examboards')}
        >
          📋 Exam Boards
        </button>
      </nav>

      <div className="pp-content">
        {activeTab === 'background' && <BackgroundTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'gamemodes' && <GameModesTab />}
        {activeTab === 'examboards' && <ExamBoardsTab />}
      </div>
    </div>
  );
}

// ─── Background Tab ──────────────────────────────────────────────────────────

function BackgroundTab() {
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadBackground();
  }, []);

  async function loadBackground() {
    try {
      const res = await apiCall('/admin/play-page-bg');
      if (res.ok) {
        const data = await res.json();
        setBackgroundUrl(data.background_url || '');
      }
    } catch (err) {
      console.error('Failed to load background:', err);
    }
    setLoading(false);
  }

  async function handleUpload(file) {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image must be under 5MB');
      return;
    }

    setUploading(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await apiCall('/admin/play-page-bg', {
        method: 'POST',
        body: JSON.stringify({
          base64,
          filename: file.name,
          mimeType: file.type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setBackgroundUrl(data.background_url);
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    }

    setUploading(false);
  }

  async function handleRemove() {
    if (!window.confirm('Remove background image?')) return;

    setUploading(true);

    try {
      const res = await apiCall('/admin/play-page-bg', { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setBackgroundUrl('');
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }

    setUploading(false);
  }

  if (loading) return <div className="pp-loading">Loading...</div>;

  return (
    <div className="pp-section">
      <h3 className="pp-section-title">Play Page Background Image</h3>
      <p className="pp-section-desc">Upload a background image for the Play page.</p>

      <div className="pp-bg-slot">
        <div className="pp-bg-preview">
          {backgroundUrl ? (
            <img src={backgroundUrl} alt="Background" className="pp-bg-img" />
          ) : (
            <div className="pp-bg-placeholder">No background image</div>
          )}
        </div>

        <div className="pp-bg-actions">
          <label className="pp-btn pp-btn-upload">
            {uploading ? 'Uploading...' : '📤 Upload'}
            <input
              type="file"
              accept="image/*"
              onChange={e => handleUpload(e.target.files[0])}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          {backgroundUrl && (
            <button className="pp-btn pp-btn-remove" onClick={handleRemove} disabled={uploading}>
              🗑️ Remove
            </button>
          )}
        </div>

        {saveMsg === 'success' && <div className="pp-save-success">✓ Saved</div>}
      </div>
    </div>
  );
}

// ─── Challenges Tab ──────────────────────────────────────────────────────────

function ChallengesTab() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', target: 1, reward_coins: 100 });

  useEffect(() => {
    loadChallenges();
  }, []);

  async function loadChallenges() {
    try {
      const res = await apiCall('/admin/quests');
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.quests || []);
      }
    } catch (err) {
      console.error('Failed to load challenges:', err);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!form.name) {
      alert('Challenge name required');
      return;
    }

    try {
      const payload = {
        quest_name: form.name,
        icon: form.icon || '🎯',
        target: parseInt(form.target) || 1,
        reward_coins: parseInt(form.reward_coins) || 100,
      };

      if (editing) {
        const res = await apiCall(`/admin/quests/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update failed');
      } else {
        const res = await apiCall('/admin/quests', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
      }

      setForm({ name: '', icon: '', target: 1, reward_coins: 100 });
      setEditing(null);
      loadChallenges();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this challenge?')) return;

    try {
      const res = await apiCall(`/admin/quests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      loadChallenges();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  function startEdit(challenge) {
    setEditing(challenge.id);
    setForm({
      name: challenge.quest_name,
      icon: challenge.icon,
      target: challenge.target,
      reward_coins: challenge.reward_coins,
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ name: '', icon: '', target: 1, reward_coins: 100 });
  }

  if (loading) return <div className="pp-loading">Loading...</div>;

  return (
    <div className="pp-section">
      <h3 className="pp-section-title">Daily Challenges Pool</h3>
      <p className="pp-section-desc">Create and manage daily challenges. Players see 3 random challenges each day.</p>

      <div className="pp-challenge-form">
        <input
          className="pp-input"
          placeholder="Challenge name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="pp-input pp-input-sm"
          placeholder="Icon"
          value={form.icon}
          onChange={e => setForm({ ...form, icon: e.target.value })}
        />
        <input
          className="pp-input pp-input-sm"
          type="number"
          placeholder="Target"
          value={form.target}
          onChange={e => setForm({ ...form, target: e.target.value })}
        />
        <input
          className="pp-input pp-input-sm"
          type="number"
          placeholder="Reward"
          value={form.reward_coins}
          onChange={e => setForm({ ...form, reward_coins: e.target.value })}
        />
        <button className="pp-btn pp-btn-primary" onClick={handleSave}>
          {editing ? 'Update' : 'Create'}
        </button>
        {editing && (
          <button className="pp-btn" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </div>

      <div className="pp-challenges-list">
        {challenges.map(ch => (
          <div key={ch.id} className="pp-challenge-item">
            <span className="pp-challenge-icon">{ch.icon}</span>
            <div className="pp-challenge-info">
              <strong>{ch.quest_name}</strong>
              <span className="pp-challenge-meta">
                Target: {ch.target} · Reward: {ch.reward_coins} coins
              </span>
            </div>
            <div className="pp-challenge-actions">
              <button className="pp-btn-icon" onClick={() => startEdit(ch)}>
                ✏️
              </button>
              <button className="pp-btn-icon" onClick={() => handleDelete(ch.id)}>
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Game Modes Tab ──────────────────────────────────────────────────────────

function GameModesTab() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await apiCall('/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const gameModes = data.game_modes_config || {};
        setConfig(gameModes);
      }
    } catch (err) {
      console.error('Failed to load game modes config:', err);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');

    try {
      const res = await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          game_modes_config: config,
        }),
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

  function toggleMode(modeId) {
    setConfig(prev => ({
      ...prev,
      [modeId]: { enabled: !(prev[modeId]?.enabled ?? true) },
    }));
  }

  if (loading) return <div className="pp-loading">Loading...</div>;

  return (
    <div className="pp-section">
      <h3 className="pp-section-title">Game Modes Toggle</h3>
      <p className="pp-section-desc">Enable or disable game modes. Disabled modes appear greyed out on the Play page.</p>

      <div className="pp-modes-list">
        {GAME_MODES.map(mode => {
          const isEnabled = config[mode.id]?.enabled ?? true;
          return (
            <div key={mode.id} className={`pp-mode-item ${isEnabled ? '' : 'pp-mode-item--disabled'}`}>
              <span className="pp-mode-icon">{mode.icon}</span>
              <span className="pp-mode-name">{mode.name}</span>
              <label className="pp-toggle">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleMode(mode.id)}
                />
                <span className="pp-toggle-slider"></span>
              </label>
            </div>
          );
        })}
      </div>

      <div className="pp-save-bar">
        <button className="pp-btn pp-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        {saveMsg === 'success' && <span className="pp-save-success">✓ Saved</span>}
        {saveMsg === 'error' && <span className="pp-save-error">✗ Save failed</span>}
      </div>
    </div>
  );
}

// ─── Exam Boards Tab ─────────────────────────────────────────────────────────

function ExamBoardsTab() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await apiCall('/admin/settings');
      if (res.ok) {
        const data = await res.json();
        const examBoards = data.exam_boards_config || {};
        setConfig(examBoards);
      }
    } catch (err) {
      console.error('Failed to load exam boards config:', err);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');

    try {
      const res = await apiCall('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          exam_boards_config: config,
        }),
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

  function toggleBoard(boardId) {
    setConfig(prev => ({
      ...prev,
      [boardId]: {
        ...prev[boardId],
        enabled: !(prev[boardId]?.enabled ?? true),
      },
    }));
  }

  function toggleStep(boardId, stepId) {
    const board = config[boardId] || {};
    const steps = board.steps || {};
    setConfig(prev => ({
      ...prev,
      [boardId]: {
        ...board,
        steps: {
          ...steps,
          [stepId]: { enabled: !(steps[stepId]?.enabled ?? true) },
        },
      },
    }));
  }

  if (loading) return <div className="pp-loading">Loading...</div>;

  return (
    <div className="pp-section">
      <h3 className="pp-section-title">Exam Boards Toggle</h3>
      <p className="pp-section-desc">Enable or disable exam boards and their steps. Disabled items show 'Coming Soon'.</p>

      <div className="pp-boards-list">
        {EXAM_BOARDS.map(board => {
          const boardEnabled = config[board.id]?.enabled ?? true;
          const steps = config[board.id]?.steps || {};

          return (
            <div key={board.id} className="pp-board-item">
              <div className={`pp-board-header ${boardEnabled ? '' : 'pp-board-header--disabled'}`}>
                <span className="pp-board-name">{board.name}</span>
                <label className="pp-toggle">
                  <input
                    type="checkbox"
                    checked={boardEnabled}
                    onChange={() => toggleBoard(board.id)}
                  />
                  <span className="pp-toggle-slider"></span>
                </label>
              </div>

              {boardEnabled && (
                <div className="pp-steps-list">
                  {board.steps.map(step => {
                    const stepEnabled = steps[step.id]?.enabled ?? true;
                    return (
                      <div key={step.id} className={`pp-step-item ${stepEnabled ? '' : 'pp-step-item--disabled'}`}>
                        <span className="pp-step-name">{step.name}</span>
                        <label className="pp-toggle pp-toggle-sm">
                          <input
                            type="checkbox"
                            checked={stepEnabled}
                            onChange={() => toggleStep(board.id, step.id)}
                          />
                          <span className="pp-toggle-slider"></span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="pp-save-bar">
        <button className="pp-btn pp-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Changes'}
        </button>
        {saveMsg === 'success' && <span className="pp-save-success">✓ Saved</span>}
        {saveMsg === 'error' && <span className="pp-save-error">✗ Save failed</span>}
      </div>
    </div>
  );
}
