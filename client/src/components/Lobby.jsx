import { useState } from 'react';
import { SUBJECTS } from './SubjectSelect';

export default function Lobby({ lobbyId, subject, players, isHost, onStartGame, error }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(lobbyId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canStart = players.length >= 2;
  const subjectInfo = SUBJECTS.find(s => s.id === subject) ?? SUBJECTS[0];

  return (
    <div className="screen lobby-screen">
      <div className="lobby-card">
        <h2>⚔️ Battle Lobby</h2>

        {/* Subject badge */}
        <div className="subject-badge">
          <span>{subjectInfo.icon}</span>
          <span>{subjectInfo.label}</span>
        </div>

        {/* Lobby code display */}
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
        <p className="player-count">
          {players.length} / ∞ players joined
        </p>

        <div className="player-list">
          {players.length === 0 && (
            <p style={{ color: 'var(--text-dim)', padding: '12px 0', fontSize: 14 }}>
              Waiting for players…
            </p>
          )}
          {players.map((p, i) => (
            <div key={p.id} className="lobby-player-item">
              <span className="lobby-player-rank">#{i + 1}</span>
              <span className="lobby-player-name">
                {p.clanTag && <span className="lobby-clan-tag">[{p.clanTag}]</span>}
                {p.username}
              </span>
              {i === 0 && <span className="host-badge">HOST</span>}
            </div>
          ))}
        </div>

        {error && <p className="error-msg">{error}</p>}

        {isHost ? (
          <>
            <button
              className="btn-start"
              onClick={onStartGame}
              disabled={!canStart}
            >
              {canStart ? '⚔️ Start Battle!' : '⏳ Waiting for players…'}
            </button>
            {!canStart && (
              <p className="need-players-hint">
                Need at least 2 players to start
              </p>
            )}
          </>
        ) : (
          <p className="waiting-pulse">⏳ Waiting for host to start…</p>
        )}

        <div className="rules-box">
          <h3>How to Play</h3>
          <ul>
            <li>20 seconds to answer each question</li>
            <li>Wrong answer or timeout = lose 1 life ❤️</li>
            <li>Every player starts with 3 lives</li>
            <li>Last player with lives remaining wins</li>
            <li>USMLE-style clinical vignette questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
