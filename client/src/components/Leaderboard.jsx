const MEDALS = ['🥇', '🥈', '🥉'];

const GOOGLE_SVG = (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.015 17.64 11.707 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

function GuestSignInBanner({ onSignIn }) {
  return (
    <div className="lb-signin-banner">
      <p>
        <strong>Enjoyed playing?</strong> Sign in with Google to save your stats and track your progress. It's free.
      </p>
      <button className="lb-signin-btn" onClick={onSignIn} type="button">
        {GOOGLE_SVG}
        Sign in with Google
      </button>
    </div>
  );
}

export default function Leaderboard({ gameResult, username, gameMode, onPlayAgain, isGuest = false, onSignIn }) {
  if (!gameResult) return null;

  const detectedMode = gameResult.gameMode || gameMode || 'battle_royale';
  const { winner } = gameResult;
  const isWinner = winner?.username === username;

  // ── Speed Race ─────────────────────────────────────────────────────────────
  if (detectedMode === 'speed_race') {
    const { podium = [], reason } = gameResult;
    const subtitle = isWinner
      ? `You won with ${winner.score} correct answers!`
      : winner
      ? `${winner.username} reached 20 first${reason === 'time_up' ? ' (time ran out)' : ''}`
      : 'Race ended';

    return (
      <div className="screen leaderboard-screen">
        <div className="leaderboard-card">
          <div className="victory-header">
            <span className="victory-trophy">{isWinner ? '🏆' : winner ? '🏁' : '🤝'}</span>
            <h2>{isWinner ? 'VICTORY!' : winner ? `${winner.username} wins!` : 'Race over'}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="lb-section">
            <p className="section-title">⚡ Speed Race Final Standings</p>
            <table className="lb-table">
              <thead>
                <tr><th>Rank</th><th>Player</th><th>Correct</th><th>Status</th></tr>
              </thead>
              <tbody>
                {podium.map(p => (
                  <tr key={p.id} className={p.username === username ? 'me' : ''}>
                    <td className="lb-rank">{MEDALS[p.rank - 1] ?? `#${p.rank}`}</td>
                    <td>
                      {p.username}{p.username === username ? ' 👤' : ''}
                      {p.isGuest && <span className="guest-badge" style={{ marginLeft: 6 }}>👤 Guest</span>}
                    </td>
                    <td>{p.correctCount} / 20</td>
                    <td>{p.finished ? '🏁 Finished!' : `${p.correctCount} correct`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isGuest && <GuestSignInBanner onSignIn={onSignIn || (() => window.location.href = '/')} />}
          <button className="btn-play-again" onClick={onPlayAgain}>🏁 Race Again</button>
        </div>
      </div>
    );
  }

  // ── Trivia Pursuit ─────────────────────────────────────────────────────────
  if (detectedMode === 'trivia_pursuit') {
    const { players = [] } = gameResult;
    const CAT_COLORS = {
      cardiology: '#e74c3c', neurology: '#3498db', pharmacology: '#2ecc71',
      microbiology: '#f1c40f', biochemistry: '#e67e22', biostatistics: '#9b59b6',
    };
    const CAT_ORDER = ['cardiology', 'neurology', 'pharmacology', 'microbiology', 'biochemistry', 'biostatistics'];
    return (
      <div className="screen leaderboard-screen">
        <div className="leaderboard-card">
          <div className="victory-header">
            <span className="victory-trophy">{isWinner ? '🏆' : winner ? '🎯' : '🤝'}</span>
            <h2>{isWinner ? 'VICTORY!' : winner ? `${winner.username} wins!` : 'Game Over'}</h2>
            <p>
              {isWinner
                ? 'You collected all 6 wedges first!'
                : winner
                ? `${winner.username} collected all 6 subject wedges`
                : 'No one collected all wedges'}
            </p>
          </div>

          <div className="lb-section">
            <p className="section-title">🎯 Trivia Pursuit Final Standings</p>
            <table className="lb-table">
              <thead>
                <tr><th>Rank</th><th>Player</th><th>Wedges</th><th>Collection</th></tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id} className={p.username === username ? 'me' : ''}>
                    <td className="lb-rank">{MEDALS[p.rank - 1] ?? `#${p.rank}`}</td>
                    <td>
                      {p.username}{p.username === username ? ' 👤' : ''}
                      {p.isGuest && <span className="guest-badge" style={{ marginLeft: 6 }}>👤 Guest</span>}
                    </td>
                    <td>{p.wedgeCount}/6</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {CAT_ORDER.map(cat => (
                          <div
                            key={cat}
                            title={cat}
                            style={{
                              width: 18, height: 18,
                              borderRadius: '50%',
                              background: p.wedges.includes(cat) ? CAT_COLORS[cat] : 'transparent',
                              border: `2px solid ${CAT_COLORS[cat]}`,
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isGuest && <GuestSignInBanner onSignIn={onSignIn || (() => window.location.href = '/')} />}
          <button className="btn-play-again" onClick={onPlayAgain}>🎯 Play Again</button>
        </div>
      </div>
    );
  }

  // ── Battle Royale ──────────────────────────────────────────────────────────
  const { leaderboard = [], globalLeaderboard = [] } = gameResult;
  return (
    <div className="screen leaderboard-screen">
      <div className="leaderboard-card">
        <div className="victory-header">
          <span className="victory-trophy">{isWinner ? '🏆' : winner ? '💀' : '🤝'}</span>
          <h2>
            {isWinner ? 'VICTORY!' : winner ? `${winner.username} wins!` : 'No survivors…'}
          </h2>
          <p>
            {isWinner
              ? `Congratulations Dr. ${username}! Final score: ${winner.score} pts`
              : winner ? 'Better luck next time, Doctor.' : 'Everyone was eliminated simultaneously.'}
          </p>
        </div>

        <div className="lb-section">
          <p className="section-title">Game Results</p>
          <table className="lb-table">
            <thead>
              <tr><th>Rank</th><th>Player</th><th>Score</th><th>Status</th></tr>
            </thead>
            <tbody>
              {leaderboard.map(p => (
                <tr key={p.rank} className={p.username === username ? 'me' : ''}>
                  <td className="lb-rank">{MEDALS[p.rank - 1] ?? `#${p.rank}`}</td>
                  <td>
                    {p.username}{p.username === username ? ' 👤' : ''}
                    {p.isGuest && <span className="guest-badge" style={{ marginLeft: 6 }}>👤 Guest</span>}
                  </td>
                  <td>{p.score} pts</td>
                  <td>
                    {p.alive
                      ? '✅ Survived'
                      : <span style={{ color: 'var(--red)' }}>Eliminated</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {globalLeaderboard.length > 0 && (
          <div className="lb-section">
            <p className="section-title">🌍 All-Time Leaderboard</p>
            <table className="lb-table">
              <thead>
                <tr><th>Rank</th><th>Player</th><th>Wins</th><th>Games</th><th>Best</th></tr>
              </thead>
              <tbody>
                {globalLeaderboard.map((p, i) => (
                  <tr key={p.username} className={p.username === username ? 'me' : ''}>
                    <td className="lb-rank">{MEDALS[i] ?? `#${i + 1}`}</td>
                    <td>{p.username}</td>
                    <td>{p.wins}</td>
                    <td>{p.gamesPlayed}</td>
                    <td>{p.highScore} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isGuest && <GuestSignInBanner onSignIn={onSignIn || (() => window.location.href = '/')} />}
        <button className="btn-play-again" onClick={onPlayAgain}>⚔️ Play Again</button>
      </div>
    </div>
  );
}
