import './Dashboard.css';

const SUBJECTS = [
  { id: 'cardiology',    label: 'Cardiology',    icon: '❤️' },
  { id: 'neurology',     label: 'Neurology',     icon: '🧠' },
  { id: 'pharmacology',  label: 'Pharmacology',  icon: '💊' },
  { id: 'microbiology',  label: 'Microbiology',  icon: '🦠' },
  { id: 'biochemistry',  label: 'Biochemistry',  icon: '⚗️' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊' },
];

const PLACE_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Dashboard({ user, onPlayNow, onLogout }) {
  const xp          = user.xp    || 0;
  const level       = user.level || 1;
  const xpIntoLevel = xp % 500;
  const xpProgress  = Math.round((xpIntoLevel / 500) * 100);
  const xpToNext    = 500 - xpIntoLevel;

  const gamesPlayed = user.games_played || 0;
  const gamesWon    = user.games_won    || 0;
  const winRate     = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  const mastery      = user.subject_mastery || [];
  const gameHistory  = user.game_history    || [];
  const totalCorrect = mastery.reduce((s, m) => s + (m.questions_correct || 0), 0);

  function getMastery(subject) {
    const m = mastery.find(m => m.subject === subject);
    return m ? m.mastery_percent : 0;
  }

  function masteryColor(pct) {
    if (pct >= 80) return 'var(--green)';
    if (pct >= 50) return '#ffaa00';
    return 'var(--blue)';
  }

  function fmtDate(str) {
    return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  return (
    <div className="dashboard-screen">
      <div className="dashboard-container">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="dash-header">
          <div className="dash-logo">⚕️ USMLE Battle Royale</div>
          <button className="btn-logout" onClick={onLogout}>Sign Out</button>
        </div>

        {/* ── Top row: Profile + Stats ───────────────────────────────────── */}
        <div className="dash-top-row">

          <div className="dash-card profile-card">
            <div className="profile-top">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
                : <div className="profile-avatar-placeholder">{user.username?.[0]?.toUpperCase()}</div>
              }
              <div className="profile-details">
                <h2 className="profile-username">{user.username}</h2>
                <span className="level-badge">Level {level}</span>
              </div>
            </div>
            <div className="xp-section">
              <div className="xp-label-row">
                <span className="xp-total">{xp.toLocaleString()} XP</span>
                <span className="xp-next">{xpToNext} XP to Lv {level + 1}</span>
              </div>
              <div className="xp-track">
                <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="dash-card stats-card">
            <div className="card-title">Overall Stats</div>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-val">{gamesPlayed}</div>
                <div className="stat-label">Games Played</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">{gamesWon}</div>
                <div className="stat-label">Games Won</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">{winRate}%</div>
                <div className="stat-label">Win Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-val">{totalCorrect}</div>
                <div className="stat-label">Correct Answers</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Subject Mastery ────────────────────────────────────────────── */}
        <div className="dash-card mastery-card">
          <div className="card-title">Subject Mastery</div>
          <div className="mastery-grid">
            {SUBJECTS.map(({ id, label, icon }) => {
              const pct = getMastery(id);
              return (
                <div key={id} className="mastery-item">
                  <div className="mastery-header">
                    <span className="mastery-icon">{icon}</span>
                    <span className="mastery-name">{label}</span>
                    <span className="mastery-pct">{pct}%</span>
                  </div>
                  <div className="mastery-track">
                    <div
                      className="mastery-fill"
                      style={{ width: `${pct}%`, background: masteryColor(pct) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom row: History + Play Now ─────────────────────────────── */}
        <div className="dash-bottom-row">

          <div className="dash-card history-card">
            <div className="card-title">Recent Games</div>
            {gameHistory.length === 0 ? (
              <p className="no-history">No games yet — start your first battle!</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Place</th>
                    <th>Correct</th>
                    <th>XP</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map(g => {
                    const subj = SUBJECTS.find(s => s.id === g.subject);
                    return (
                      <tr key={g.id}>
                        <td className="history-subject">
                          {subj?.icon || '🎮'} {capitalize(g.subject)}
                        </td>
                        <td>{PLACE_ICONS[g.placement] || `#${g.placement}`}</td>
                        <td className="history-correct">{g.correct_answers}/{g.total_questions}</td>
                        <td className="history-xp">+{g.xp_earned}</td>
                        <td className="history-date">{fmtDate(g.played_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="dash-play-card">
            <div className="play-icon">⚔️</div>
            <h3>Ready to Battle?</h3>
            <p>Test your USMLE knowledge against other medical students in real-time.</p>
            <button className="btn-play-now" onClick={onPlayNow}>
              Play Now
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
