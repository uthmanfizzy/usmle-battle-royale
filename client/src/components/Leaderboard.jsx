const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ gameResult, username, onPlayAgain }) {
  if (!gameResult) return null;

  const { winner, leaderboard, globalLeaderboard } = gameResult;
  const isWinner = winner?.username === username;

  return (
    <div className="screen leaderboard-screen">
      <div className="leaderboard-card">
        {/* Victory / defeat header */}
        <div className="victory-header">
          <span className="victory-trophy">
            {isWinner ? '🏆' : winner ? '💀' : '🤝'}
          </span>
          <h2>
            {isWinner
              ? 'VICTORY!'
              : winner
              ? `${winner.username} wins!`
              : 'No survivors…'}
          </h2>
          <p>
            {isWinner
              ? `Congratulations Dr. ${username}! Final score: ${winner.score} pts`
              : winner
              ? `Better luck next time, Doctor.`
              : 'Everyone was eliminated simultaneously.'}
          </p>
        </div>

        {/* Game results table */}
        <div className="lb-section">
          <p className="section-title">Game Results</p>
          <table className="lb-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p) => (
                <tr key={p.rank} className={p.username === username ? 'me' : ''}>
                  <td className="lb-rank">
                    {MEDALS[p.rank - 1] ?? `#${p.rank}`}
                  </td>
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

        {/* Global all-time leaderboard */}
        {globalLeaderboard?.length > 0 && (
          <div className="lb-section">
            <p className="section-title">🌍 All-Time Leaderboard</p>
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Games</th>
                  <th>Best</th>
                </tr>
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

        <button className="btn-play-again" onClick={onPlayAgain}>
          ⚔️ Play Again
        </button>
      </div>
    </div>
  );
}
