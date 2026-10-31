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
 * EVERY GAME WEARS ITS OWN SUBJECT'S COLOUR — cardiology red, psychiatry
 * violet, pharmacology blue — rather than all of them wearing the shelf's.
 * The grid is scanned, not read: the hue is what tells you which tile is which
 * before a single word has been taken in, and a wall of one colour would make
 * six tiles look like one thing with six labels.
 *
 * `accent` is an "r, g, b" triple rather than a hex because each tile builds
 * both solid colour and tinted washes from it — rgba(var(--mg-accent), .14)
 * works everywhere, while color-mix() ships broken to older browsers.
 *
 * Most of these are NOT BUILT YET, and say so plainly. They are here because
 * the idea is the part worth writing down early — what the game asks of the
 * player, and what it drills. The blurb is the brief for whoever builds it.
 *
 * To make one real: give it a `route`, drop `soon`, and build the page.
 */
const MINIGAMES = [
  {
    id: 'pathway-navigator',
    name: 'Metabolic Pathway Navigator',
    subject: 'Biochemistry',
    icon: '🧬',
    accent: '46, 170, 120',          // biochemistry green
    route: '/pathway-navigator',
    blurb: 'Walk the whole map one metabolite at a time — name the molecules, '
         + 'or the enzymes and the diseases behind them.',
    drills: 'Pathways end to end',
  },
  {
    id: 'ecg',
    name: 'ECG Reader',
    subject: 'Cardiology',
    icon: '💓',
    accent: '214, 54, 60',           // cardiology red
    soon: true,
    blurb: 'A strip comes up and you read it: rate, rhythm, axis, intervals, '
         + 'blocks — then the diagnosis, and for an infarct, which territory '
         + 'and which vessel.',
    drills: 'Rhythm and 12-lead recognition',
  },
  {
    id: 'abg',
    name: 'ABG Reader',
    subject: 'Respiratory',
    icon: '🩸',
    accent: '42, 160, 196',          // respiratory cyan
    soon: true,
    blurb: 'A gas appears — pH, PaCO₂, HCO₃⁻, and the numbers that go with it. '
         + 'Call it: acidosis or alkalosis, respiratory or metabolic, '
         + 'compensated or not. Then the anion gap when it matters, and what '
         + 'is driving it.',
    drills: 'Acid–base, against the clock',
  },
  {
    id: 'psych-video',
    name: 'Spot the Diagnosis',
    subject: 'Psychiatry',
    icon: '🎬',
    accent: '150, 106, 232',         // psychiatry violet
    soon: true,
    blurb: 'Watch a short video of a patient and name the condition from how '
         + 'they present — speech, affect, movement and what they say.',
    drills: 'Recognising psychiatric presentations',
  },
  {
    id: 'genetics-roulette',
    name: 'Genetics Roulette',
    subject: 'Genetics',
    icon: '🎲',
    accent: '226, 158, 32',          // genetics amber
    soon: true,
    blurb: 'The wheel lands on a condition and you call it: inheritance '
         + 'pattern, the gene or chromosome behind it, and the risk to the '
         + 'next child.',
    drills: 'Inheritance and recurrence risk',
  },
  {
    id: 'drug-mechanism-match',
    name: 'Drug Mechanism Match',
    subject: 'Pharmacology',
    icon: '💊',
    accent: '70, 120, 220',          // pharmacology blue
    soon: true,
    blurb: 'Drugs on one side, mechanisms on the other — pair them up before '
         + 'the clock runs out, then say what the class does and what it costs '
         + 'the patient.',
    drills: 'Mechanisms, classes and side effects',
  },
  {
    id: 'lesion-localiser',
    name: 'Lesion Localiser',
    subject: 'Neuroanatomy',
    icon: '🧠',
    accent: '211, 83, 158',          // neuroanatomy magenta
    soon: true,
    blurb: 'A deficit is described, or a lesion is marked on a section — say '
         + 'where it is: which tract or nucleus, which side, which level. Then '
         + 'what else that lesion would have taken out.',
    drills: 'Tracts, nuclei and levels',
  },
  {
    id: 'muscle-mapper',
    name: 'Muscle Mapper',
    subject: 'Musculoskeletal',
    icon: '🦴',
    accent: '150, 190, 58',          // MSK lime
    soon: true,
    blurb: 'A movement is lost or a nerve is cut — name the muscle behind it, '
         + 'the nerve and root that drive it, and the test that shows it up.',
    drills: 'Muscles, nerves and the moves they own',
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

      <div className="mg-grid">
        {MINIGAMES.map(g => {
          const Tag = g.soon ? 'div' : 'button';
          return (
            <Tag
              key={g.id}
              style={{ '--mg-accent': g.accent }}
              {...(g.soon
                ? { 'aria-disabled': 'true' }
                : { type: 'button', onClick: () => { window.location.href = g.route; } })}
              className={`mg-tile${g.soon ? ' is-soon' : ''}`}
            >
              <span className="mg-tile-art">
                <span className="mg-tile-icon" aria-hidden="true">{g.icon}</span>
                {g.soon && <span className="mg-tile-chip">In the works</span>}
              </span>
              <span className="mg-tile-body">
                <span className="mg-tile-subject">{g.subject}</span>
                <span className="mg-tile-name">{g.name}</span>
                <span className="mg-tile-blurb">{g.blurb}</span>
                <span className="mg-tile-foot">
                  <span className="mg-tile-drills">{g.drills}</span>
                  {!g.soon && <span className="mg-tile-go" aria-hidden="true">Play →</span>}
                </span>
              </span>
            </Tag>
          );
        })}
      </div>

      <p className="mg-foot">More on the way.</p>
    </div>
  );
}
