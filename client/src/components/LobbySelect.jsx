export default function LobbySelect({ username, onCreateLobby, onJoinLobby }) {
  return (
    <div className="screen lobby-select-screen">
      <div className="lobby-select-card">
        <div className="ls-header">
          <span className="ls-icon">⚕️</span>
          <h2>Ready for Battle</h2>
          <p>Welcome, <strong>{username}</strong>. Choose how to play.</p>
        </div>

        <div className="choice-btns">
          <button className="choice-btn choice-create" onClick={onCreateLobby}>
            <span className="choice-icon">🏠</span>
            <div className="choice-text">
              <strong>Create Lobby</strong>
              <p>Start a new game and share the code with friends</p>
            </div>
            <span className="choice-arrow">›</span>
          </button>

          <button className="choice-btn choice-join" onClick={onJoinLobby}>
            <span className="choice-icon">🚪</span>
            <div className="choice-text">
              <strong>Join Lobby</strong>
              <p>Enter a 6-character code to join a friend's game</p>
            </div>
            <span className="choice-arrow">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
