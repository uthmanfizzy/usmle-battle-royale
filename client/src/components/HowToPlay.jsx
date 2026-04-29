const MODE_DATA = {
  scan_master: {
    title:    '🔬 Scan Master',
    subtitle: 'Identify Conditions from Medical Images',
    gradient: 'linear-gradient(135deg, #00b894 0%, #00695c 100%)',
    accent:   '#00cec9',
    rules: [
      { icon: '🖼️', text: 'Study the medical image carefully before answering' },
      { icon: '⏱️', text: 'You have 25 seconds to answer each question' },
      { icon: '🔬', text: 'Questions include ECGs, X-rays, histology, dermatology and more' },
      { icon: '❤️', text: 'Wrong answer or running out of time = lose a life' },
      { icon: '🎮', text: 'You start with 3 lives' },
      { icon: '💀', text: 'Lose all 3 lives and you are eliminated' },
      { icon: '🏆', text: 'Last player standing wins and earns the most XP' },
    ],
  },
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
  tower: {
    title:    '🏰 The Tower',
    subtitle: '100 Floors of Medical Mastery',
    gradient: 'linear-gradient(135deg, #c9a84c 0%, #7d6006 100%)',
    accent:   '#c9a84c',
    rules: [
      { icon: '🏰', text: 'Climb 100 floors across 10 zones of medical knowledge' },
      { icon: '✅', text: 'Normal floors: answer 3 questions correctly to advance' },
      { icon: '⚔️', text: 'Challenge floors (every 5th): answer 5 questions with 3 lives' },
      { icon: '👹', text: 'Boss floors (every 10th): answer 10 perfectly — one wrong answer fails the floor' },
      { icon: '⚡', text: 'Earn XP every floor: 30 normal, 60 challenge, 150 boss — plus zone and perfect bonuses' },
      { icon: '🔒', text: 'Progress is saved — return any time and pick up where you left off' },
      { icon: '🏆', text: 'Conquer all 100 floors to earn the Tower Master crown' },
    ],
  },
  buzz_fun: {
    title:    '⚡ Buzz Fun',
    subtitle: 'Buzzwords, Triads & Classic Associations',
    gradient: 'linear-gradient(135deg, #e67e22 0%, #c0392b 100%)',
    accent:   '#e67e22',
    rules: [
      { icon: '⚡', text: 'Flash cards of buzzwords, triads, side effects and classic HY associations' },
      { icon: '⏱️', text: '8 seconds per card — speed matters!' },
      { icon: '🃏', text: '30 cards per game — every round is a new term to identify' },
      { icon: '🏆', text: 'Correct answer = 100 pts + up to 50 speed bonus' },
      { icon: '🥇', text: 'First player to answer correctly earns an extra 50 bonus points' },
      { icon: '🔥', text: 'Build a streak of correct answers for fire status' },
      { icon: '📊', text: 'Highest score after all 30 cards wins — no lives, just points!' },
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
