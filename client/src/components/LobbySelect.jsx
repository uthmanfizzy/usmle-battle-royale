import { useState } from 'react';

export default function LobbySelect({ username, onCreateLobby, onJoinLobby, onSoloMode, onQuickJoin, onBack }) {
  const [qjStatus, setQjStatus] = useState(null); // null | 'searching' | 'creating'

  function handleQuickJoin() {
    setQjStatus('searching');
    onQuickJoin({
      onCreating: () => setQjStatus('creating'),
      onError:    () => setQjStatus(null),
    });
  }

  return (
    <div className="screen lobby-select-screen">
      <div className="lobby-select-card">
        {onBack && <button className="back-btn" onClick={onBack}>← Back</button>}
        <div className="ls-header">
          <span className="ls-icon">⚕️</span>
          <h2>Ready for Battle</h2>
          <p>Welcome, <strong>{username}</strong>. Choose how to play.</p>
        </div>

        <div className="choice-btns">
          {/* Quick Join */}
          <button
            className="choice-btn choice-quick-join"
            onClick={handleQuickJoin}
            disabled={!!qjStatus}
          >
            <span className="choice-icon">
              {qjStatus ? <span className="qj-spinner" /> : '⚡'}
            </span>
            <div className="choice-text">
              <strong>Quick Join</strong>
              <p>
                {qjStatus === 'searching'
                  ? 'Searching for open lobbies…'
                  : qjStatus === 'creating'
                  ? 'No open lobbies found. Creating one for you…'
                  : 'Jump into a random game instantly'}
              </p>
            </div>
            {!qjStatus && <span className="choice-arrow">›</span>}
          </button>

          <button className="choice-btn choice-create" onClick={onCreateLobby} disabled={!!qjStatus}>
            <span className="choice-icon">🏠</span>
            <div className="choice-text">
              <strong>Create Lobby</strong>
              <p>Start a new game and share the code with friends</p>
            </div>
            <span className="choice-arrow">›</span>
          </button>

          <button className="choice-btn choice-join" onClick={onJoinLobby} disabled={!!qjStatus}>
            <span className="choice-icon">🚪</span>
            <div className="choice-text">
              <strong>Join Lobby</strong>
              <p>Enter a 6-character code to join a friend's game</p>
            </div>
            <span className="choice-arrow">›</span>
          </button>

          <button className="choice-btn choice-solo" onClick={onSoloMode} disabled={!!qjStatus}>
            <span className="choice-icon">🎯</span>
            <div className="choice-text">
              <strong>Solo Practice</strong>
              <p>Practice USMLE questions on your own — track your high score</p>
            </div>
            <span className="choice-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
