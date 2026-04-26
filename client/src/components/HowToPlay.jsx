const MODE_DATA = {
  battle_royale: {
    title:    '⚔️ Battle Royale',
    subtitle: 'Last Doctor Standing Wins',
    gradient: 'linear-gradient(135deg, #c0392b 0%, #7b241c 100%)',
    accent:   '#e74c3c',
    rules: [
      { icon: '📢', text: 'All players answer the same question at the same time' },
      { icon: '⏱️', text: 'You have 20 seconds to answer each question' },
      { icon: '❤️', text: 'Wrong answer or running out of time = lose a life' },
      { icon: '🎮', text: 'You start with 3 lives' },
      { icon: '💀', text: 'Lose all 3 lives and you are eliminated' },
      { icon: '🏆', text: 'Last player standing wins and earns the most XP' },
      { icon: '⚡', text: 'When 2 players remain, Sudden Death begins — timer drops to 5 seconds!' },
    ],
  },
  speed_race: {
    title:    '⚡ Speed Race',
    subtitle: 'First to 20 Correct Answers Wins',
    gradient: 'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)',
    accent:   '#3498db',
    rules: [
      { icon: '🏃', text: 'Answer questions as fast as you can' },
      { icon: '⏱️', text: 'You have 10 seconds per question' },
      { icon: '✅', text: 'Wrong answers do not eliminate you — just keep going' },
      { icon: '⚡', text: 'Move to the next question instantly after answering' },
      { icon: '🏁', text: 'First player to get 20 correct answers wins' },
      { icon: '👀', text: "Watch your opponents' progress on the race tracker" },
      { icon: '🎯', text: 'Speed AND accuracy both matter' },
    ],
  },
  trivia_pursuit: {
    title:    '🎯 Trivia Pursuit',
    subtitle: 'Collect All 6 Subject Wedges to Win',
    gradient: 'linear-gradient(135deg, #9b59b6 0%, #6c3483 100%)',
    accent:   '#9b59b6',
    rules: [
      { icon: '🎲', text: 'Players take turns rolling and moving around the board' },
      { icon: '🎨', text: 'The colour of the space you land on determines the question category' },
      { icon: '⭐', text: 'Answer correctly on a HQ space to earn that category\'s wedge' },
      { icon: '↩️',  text: 'Answer wrong and play passes to the next player' },
      { icon: '🏆', text: 'Collect all 6 wedges from all 6 subjects to win' },
      { icon: '📚', text: 'Categories: Cardiology, Neurology, Pharmacology, Microbiology, Biochemistry, Biostatistics' },
    ],
  },
};

export default function HowToPlay({ gameMode, onContinue, onBack }) {
  const info = MODE_DATA[gameMode] || MODE_DATA.battle_royale;

  return (
    <div className="screen htp-screen">
      <div className="htp-card">

        {/* ── Header ── */}
        <div className="htp-header" style={{ background: info.gradient }}>
          <button className="htp-back-btn" onClick={onBack}>← Go Back</button>
          <h1 className="htp-title">{info.title}</h1>
          <p className="htp-subtitle">{info.subtitle}</p>
        </div>

        {/* ── Rules ── */}
        <div className="htp-body">
          <p className="htp-rules-heading">How to Play</p>
          <ul className="htp-rules-list">
            {info.rules.map((rule, i) => (
              <li
                key={i}
                className="htp-rule"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className="htp-rule-icon">{rule.icon}</span>
                <span className="htp-rule-text">{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTA ── */}
        <div className="htp-footer">
          <button
            className="htp-play-btn"
            style={{ background: info.gradient }}
            onClick={onContinue}
          >
            Got it — Let's Play! 🎮
          </button>
        </div>

      </div>
    </div>
  );
}
