import { useState } from 'react';
import { SUBJECTS } from './SubjectSelect';

const MODE_INFO = {
  battle_royale: {
    label: '💀 Battle Royale',
    color: '#e74c3c',
    rules: [
      '20 seconds to answer each question',
      'Wrong answer = lose 1 life ❤️',
      'Every player starts with 3 lives',
      'Last player with lives remaining wins',
    ],
  },
  speed_race: {
    label: '⚡ Speed Race',
    color: '#f39c12',
    rules: [
      '15 seconds to answer each question',
      'No lives — wrong answers don\'t count',
      'First to 20 correct answers wins',
      '10-minute time limit if no one reaches 20',
    ],
  },
  trivia_pursuit: {
    label: '🎯 Trivia Pursuit',
    color: '#9b59b6',
    rules: [
      'Players take turns answering questions',
      'Each question comes from a random subject',
      'Correct answer on HQ space = earn a wedge',
      'First player to collect all 6 subject wedges wins',
    ],
  },
};

const BOT_OPTIONS = [
  { id: 'easy',   label: '🟢 Easy Bot',   accuracy: '40%',  timing: '12–18s reaction' },
  { id: 'medium', label: '🟡 Medium Bot', accuracy: '65%',  timing: '8–14s reaction'  },
  { id: 'hard',   label: '🔴 Hard Bot',   accuracy: '85%',  timing: '3–8s reaction'   },
  { id: 'expert', label: '⚡ Expert Bot', accuracy: '95%',  timing: '1–3s reaction'   },
];

export default function Lobby({
  lobbyId, subject, gameMode = 'battle_royale',
  players, isHost, onStartGame, onAddBot, onRemoveBot,
  openToQuickJoin = true, onToggleQuickJoin,
  error,
}) {
  const [copied,      setCopied]      = useState(false);
  const [showBotMenu, setShowBotMenu] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(lobbyId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const botCount    = players.filter(p => p.isBot).length;
  const canAddBot   = isHost && botCount < 3;
  const canStart    = players.length >= 2;
  const subjectInfo = SUBJECTS.find(s => s.id === subject) ?? SUBJECTS[0];
  const modeInfo    = MODE_INFO[gameMode] || MODE_INFO.battle_royale;

  return (
    <div className="screen lobby-screen">
      <div className="lobby-card">
        <h2>⚔️ Battle Lobby</h2>

        {/* Mode + Subject badges */}
        <div className="lobby-badges">
          <div className="subject-badge">
            <span>{subjectInfo.icon}</span>
            <span>{subjectInfo.label}</span>
          </div>
          <div className="mode-badge" style={{ background: modeInfo.color }}>
            {modeInfo.label}
          </div>
        </div>

        {/* Quick Join status */}
        <div className="qj-status-row">
          <span className={`qj-status-dot ${openToQuickJoin ? 'open' : 'closed'}`} />
          <span className="qj-status-label">
            {openToQuickJoin ? '⚡ Open to Quick Join' : '🔒 Closed to Quick Join'}
          </span>
          {isHost && (
            <button
              className={`qj-toggle-btn ${openToQuickJoin ? 'on' : 'off'}`}
              onClick={() => onToggleQuickJoin && onToggleQuickJoin(!openToQuickJoin)}
            >
              {openToQuickJoin ? 'Turn Off' : 'Turn On'}
            </button>
          )}
        </div>

        {/* Lobby code */}
        <div className="lobby-code-section">
          <p className="lobby-code-label">Lobby Code — share with friends</p>
          <div className="lobby-code-box">
            <span className="lobby-code-value">{lobbyId}</span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Player list */}
        <p className="player-count">{players.length} / ∞ players joined</p>

        <div className="player-list">
          {players.length === 0 && (
            <p style={{ color: 'var(--text-dim)', padding: '12px 0', fontSize: 14 }}>
              Waiting for players…
            </p>
          )}
          {players.map((p, i) => (
            <div key={p.id} className={`lobby-player-item ${p.isBot ? 'is-bot' : ''}`}>
              <span className="lobby-player-rank">#{i + 1}</span>
              <span className="lobby-player-name">
                {p.clanTag && <span className="lobby-clan-tag">[{p.clanTag}]</span>}
                {p.username}
              </span>
              {!p.isBot && i === 0 && <span className="host-badge">HOST</span>}
              {isHost && p.isBot && (
                <button
                  className="bot-remove-btn"
                  onClick={() => onRemoveBot(p.id)}
                  title="Remove bot"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Bot — host only */}
        {isHost && (
          <div className="add-bot-wrap">
            <button
              className="btn-add-bot"
              onClick={() => setShowBotMenu(m => !m)}
              disabled={!canAddBot}
            >
              🤖 Add Bot{botCount > 0 ? ` (${botCount}/3)` : ''}
            </button>

            {showBotMenu && canAddBot && (
              <div className="bot-menu">
                {BOT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className="bot-menu-item"
                    onClick={() => { onAddBot(opt.id); setShowBotMenu(false); }}
                  >
                    <span className="bot-diff-label">{opt.label}</span>
                    <span className="bot-diff-stats">{opt.accuracy} correct · {opt.timing}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="error-msg">{error}</p>}

        {isHost ? (
          <>
            <button className="btn-start" onClick={onStartGame} disabled={!canStart}>
              {canStart ? '⚔️ Start Battle!' : '⏳ Waiting for players…'}
            </button>
            {!canStart && (
              <p className="need-players-hint">Need at least 2 players (or add a bot)</p>
            )}
          </>
        ) : (
          <p className="waiting-pulse">⏳ Waiting for host to start…</p>
        )}

        <div className="rules-box">
          <h3>How to Play</h3>
          <ul>
            {modeInfo.rules.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
