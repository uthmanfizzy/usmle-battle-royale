import './MinigamesPage.css';

/**
 * Minigames — the short, skill-shaped things that are not a question bank and
 * not a campaign.
 *
 * A shelf rather than a mode. Each entry is its own small game with its own
 * rules; what they share is that you play one for five minutes to drill one
 * skill, which is why they sit together instead of each needing a card of its
 * own in Story Mode.
 *
 * Two of the three are NOT BUILT YET, and say so plainly. They are here
 * because the idea is the part worth writing down early — what the game asks
 * of the player, and what it is drilling. A blurb that reads like a promise is
 * better than a note in a file nobody opens, and the card is the brief for
 * whoever builds it.
 *
 * To make one real: give it a `route`, drop `soon`, and build the page.
 */
const MINIGAMES = [
  {
    id: 'pathway-navigator',
    name: 'Metabolic Pathway Navigator',
    icon: '🧬',
    route: '/pathway-navigator',
    blurb: 'Walk the whole map one metabolite at a time — name the molecules, '
         + 'or the enzymes and the diseases behind them.',
    drills: 'Biochemistry pathways',
  },
  {
    id: 'abg',
    name: 'ABG Reader',
    icon: '🩸',
    soon: true,
    blurb: 'A gas appears — pH, PaCO₂, HCO₃⁻, and the numbers that go with it. '
         + 'Call it: acidosis or alkalosis, respiratory or metabolic, '
         + 'compensated or not. Then the anion gap when it matters, and what '
         + 'is driving it.',
    drills: 'Acid–base interpretation, against the clock',
  },
  {
    id: 'ecg',
    name: 'ECG Reader',
    icon: '💓',
    soon: true,
    blurb: 'A strip comes up and you read it: rate, rhythm, axis, intervals, '
         + 'blocks — then the diagnosis, and for an infarct, which territory '
         + 'and which vessel.',
    drills: 'Rhythm and 12-lead recognition',
  },
];

export default function MinigamesPage() {
  return (
    <div className="mg">
      <div className="mg-glow" aria-hidden="true" />

      <header className="mg-head">
        <button
          type="button"
          className="mg-back"
          onClick={() => { window.location.href = '/?story=1'; }}
        >
          ← Story Mode
        </button>
        <h1 className="mg-title">Minigames</h1>
        <p className="mg-sub">
          Short games that drill one skill at a time. Nothing here counts toward a
          plan — play one because you want to be faster at it.
        </p>
      </header>

      <div className="mg-list">
        {MINIGAMES.map(g => {
          const Tag = g.soon ? 'div' : 'button';
          return (
            <Tag
              key={g.id}
              {...(g.soon
                ? { 'aria-disabled': 'true' }
                : { type: 'button', onClick: () => { window.location.href = g.route; } })}
              className={`mg-card${g.soon ? ' is-soon' : ''}`}
            >
              <span className="mg-card-icon" aria-hidden="true">{g.icon}</span>
              <span className="mg-card-body">
                <span className="mg-card-head">
                  <span className="mg-card-name">{g.name}</span>
                  {g.soon && <span className="mg-card-chip">In the works</span>}
                </span>
                <span className="mg-card-blurb">{g.blurb}</span>
                <span className="mg-card-drills">{g.drills}</span>
              </span>
              <span className="mg-card-go" aria-hidden="true">{g.soon ? '' : '→'}</span>
            </Tag>
          );
        })}
      </div>

      <p className="mg-foot">More on the way.</p>
    </div>
  );
}
