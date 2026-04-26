import { useState } from 'react';

const SPEED_RACE_RULES = [
  'Each player races through questions independently at their own pace',
  '10 seconds to answer each question',
  'Wrong answer or timeout = immediate next question, no penalty',
  'First player to answer 20 questions correctly wins',
  'A 10-minute time limit applies if no one reaches 20',
  'No lives — just race to 20!',
];

function SpeedRaceGuide({ onClose }) {
  return (
    <div className="mode-guide-overlay" onClick={onClose}>
      <div className="mode-guide-card" onClick={e => e.stopPropagation()}>
        <div className="mode-guide-header" style={{ background: 'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)' }}>
          <span className="mode-guide-icon">🏁</span>
          <h2 className="mode-guide-title">Speed Race</h2>
          <p className="mode-guide-tagline">First to 20 correct answers wins</p>
        </div>
        <div className="mode-guide-body">
          <h3 className="mode-guide-rules-title">How to Play</h3>
          <ul className="mode-guide-rules">
            {SPEED_RACE_RULES.map((rule, i) => (
              <li key={i} className="mode-guide-rule">
                <span className="mode-guide-rule-num">{i + 1}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
        <button className="mode-guide-close" onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
}

function TrivialPursuitIcon() {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6'];
  const cx = 50, cy = 50, r = 46;
  return (
    <svg viewBox="0 0 100 100" width="52" height="52" style={{ display: 'block', margin: '0 auto' }}>
      {colors.map((color, i) => {
        const startAngle = (i * 60 - 90) * Math.PI / 180;
        const endAngle   = ((i + 1) * 60 - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
            fill={color}
          />
        );
      })}
      <circle cx={cx} cy={cy} r="18" fill="#111127" />
    </svg>
  );
}

const MODES = [
  {
    id:          'scan_master',
    name:        'Scan Master',
    icon:        '🔬',
    tagline:     'Identify conditions from medical images',
    description: 'Study real medical images — ECGs, X-rays, histology, dermatology and more. Last doctor standing wins.',
    gradient:    'linear-gradient(135deg, #00b894 0%, #00695c 100%)',
    border:      '#00cec9',
  },
  {
    id:          'battle_royale',
    name:        'Battle Royale',
    icon:        '💀',
    tagline:     'Last doctor standing wins',
    description: 'Wrong answers cost lives. Outlast every other player to claim victory.',
    gradient:    'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    border:      '#e74c3c',
  },
  {
    id:          'speed_race',
    name:        'Speed Race',
    icon:        '🏁',
    tagline:     'First to 20 correct answers wins',
    description: 'Race to answer 20 questions correctly. No lives — wrong answers are forgiven.',
    gradient:    'linear-gradient(135deg, #2980b9 0%, #1a5276 100%)',
    border:      '#3498db',
  },
  {
    id:          'trivia_pursuit',
    name:        'Trivia Pursuit',
    iconEl:      <TrivialPursuitIcon />,
    tagline:     'Collect all 6 subject wedges to win',
    description: 'Take turns answering subject questions. Earn a wedge for each correct answer. First to collect all 6 wins.',
    gradient:    'linear-gradient(135deg, #9b59b6 0%, #6c3483 100%)',
    border:      '#9b59b6',
  },
];

export default function ModeSelect({ username, onSelect, onBack }) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="screen mode-select-screen">
      {showGuide && <SpeedRaceGuide onClose={() => setShowGuide(false)} />}

      <div className="mode-select-inner">
        <h2 className="mode-select-title">Choose Game Mode</h2>
        <p className="mode-select-sub">Playing as <strong>{username}</strong></p>

        <div className="mode-cards">
          {MODES.map(m => (
            <button
              key={m.id}
              className="mode-card"
              onClick={() => onSelect(m.id)}
              style={{ '--mode-grad': m.gradient, '--mode-border': m.border }}
            >
              <div className="mode-card-icon">{m.iconEl || m.icon}</div>
              <h3 className="mode-card-name">{m.name}</h3>
              <div className="mode-card-tagline">{m.tagline}</div>
              <p className="mode-card-desc">{m.description}</p>
              {m.id === 'speed_race' && (
                <span
                  className="mode-card-guide-btn"
                  role="button"
                  tabIndex={0}
                  onClick={e => { e.stopPropagation(); setShowGuide(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); setShowGuide(true); } }}
                >
                  How to Play
                </span>
              )}
            </button>
          ))}
        </div>

        {onBack && <button className="back-btn" onClick={onBack}>← Back</button>}
      </div>
    </div>
  );
}
