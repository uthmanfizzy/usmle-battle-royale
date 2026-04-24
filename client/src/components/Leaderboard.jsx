const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ gameResult, username, gameMode, onPlayAgain }) {
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
                    <td>{p.username}{p.username === username ? ' 👤' : ''}</td>
                    <td>{p.correctCount} / 20</td>
                    <td>{p.finished ? '🏁 Finished!' : `${p.correctCount} correct`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                    <td>{p.username}{p.username === username ? ' 👤' : ''}</td>
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
                  <td>{p.username}{p.username === username ? ' 👤' : ''}</td>
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

        <button className="btn-play-again" onClick={onPlayAgain}>⚔️ Play Again</button>
      </div>
    </div>
  );
}
