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
  return (
    <div className="screen mode-select-screen">
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
            </button>
          ))}
        </div>

        {onBack && <button className="back-btn" onClick={onBack}>← Back</button>}
      </div>
    </div>
  );
}
