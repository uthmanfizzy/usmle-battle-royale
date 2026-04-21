import { useState } from 'react';

export default function JoinLobbyInput({ username, onJoin, onBack, error }) {
  const [code, setCode] = useState('');

  function handleChange(e) {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (code.length === 6) onJoin(code);
  }

  return (
    <div className="screen join-screen">
      <div className="join-card">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <div className="join-header">
          <span style={{ fontSize: 52 }}>🚪</span>
          <h2>Join a Lobby</h2>
          <p>Ask your friend for their 6-character lobby code</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            className="code-input"
            type="text"
            placeholder="ABC123"
            value={code}
            onChange={handleChange}
            maxLength={6}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />

          <p className="code-hint">
            {code.length}/6 characters
            {code.length === 6 && ' ✓'}
          </p>

          {error && <p className="error-msg">{error}</p>}

          <button
            className="btn-primary"
            type="submit"
            disabled={code.length !== 6}
          >
            Join Game
          </button>
        </form>
      </div>
    </div>
  );
}
