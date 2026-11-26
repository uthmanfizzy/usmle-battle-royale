import { useEffect, useState } from 'react';
import { useGameSettings } from '../contexts/GameSettingsContext';
import './MinigamesPage.css';

// The skins this page can wear, set from the admin page (UI Settings →
// Minigames Theme). Mirrors MINIGAMES_THEMES in server/index.js.
//
// A skin, not a layout: the grid, the tiles and every game's own subject
// colour are the same in both. Arcade changes the surface — hard edges,
// scanlines, neon — so switching cannot move anything around or hide a game.
export const MINIGAMES_THEMES = ['default', 'arcade'];

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
    id: 'vitamin-vault',
    name: 'Vitamin Vault',
    subject: 'Nutrition',
    icon: '💊',
    accent: '249, 115, 22',          // nutrition orange
    route: '/vitamin-vault',
    blurb: 'A night-shift pharmacy: patients bring symptoms, you grab the right '
         + 'vitamin bottle off the shelf. Then wire every cofactor to its enzyme '
         + 'and race the clock.',
    drills: 'Vitamins, zinc and malnutrition',
  },
  {
    id: 'onco-atlas',
    name: 'Onco Atlas',
    subject: 'Reproductive',
    icon: '🎗️',
    accent: '236, 72, 153',          // reproductive pink
    route: '/onco-atlas',
    blurb: 'Tap an organ on the body map to see every breast and reproductive '
         + 'tumour in women and men. Then sit on the tumour board and name each '
         + 'case, and race the clock on slides, markers and associations.',
    drills: 'Breast, gynaecologic and male reproductive tumours',
  },
  {
    id: 'ecg',
    name: 'ECG Reader',
    subject: 'Cardiology',
    icon: '💓',
    accent: '214, 54, 60',           // cardiology red
    route: '/ecg-reader',
    blurb: 'A strip comes up and you read it: rate, rhythm, axis, intervals, '
         + 'blocks — then the diagnosis, and for an infarct, which territory '
         + 'and which vessel.',
    drills: 'Rhythm and 12-lead recognition',
  },
  {
    id: 'murmurs',
    name: 'Murmurs',
    subject: 'Cardiology',
    icon: '🩺',
    accent: '232, 86, 120',          // cardiology rose (the ECG Reader has the red)
    route: '/murmurs',
    blurb: 'Put the stethoscope on and name what you hear — then see its shape '
         + 'between S1 and S2, where it is loudest, what breathing and '
         + 'manoeuvres do to it, and every case it turns up in.',
    drills: 'Murmurs and heart sounds by ear',
  },
  {
    id: 'pv-loops',
    name: 'PV Loop Lab',
    subject: 'Cardiology',
    icon: '🫀',
    accent: '255, 122, 89',          // cardiology coral (red and rose are taken)
    route: '/pv-loops',
    blurb: 'Watch the left heart go round a pressure–volume loop, then bend it: '
         + 'preload, afterload, contractility, stiffness — and every classic '
         + 'valve lesion and heart failure loop to name.',
    drills: 'Reading pressure–volume loops',
  },
  {
    id: 'clot-cascade',
    name: 'Clot Cascade',
    subject: 'Hematology',
    icon: '🩸',
    accent: '220, 38, 72',           // hematology garnet
    route: '/clot-cascade',
    blurb: 'A vessel tears and the patient bleeds — build the cascade factor by '
         + 'factor before they crash, strike each anticoagulant at its target, '
         + 'and read PT/PTT panels to name the disorder.',
    drills: 'Coagulation, anticoagulants and coag labs',
  },
  {
    id: 'abg',
    name: 'ABG Reader',
    subject: 'Respiratory',
    icon: '🩸',
    accent: '42, 160, 196',          // respiratory cyan
    route: '/abg-reader',
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
    route: '/spot-the-diagnosis',
    blurb: 'A patient sits down and the interview plays — watch how they move, '
         + 'listen to what they say, and name the diagnosis. Then the criteria, '
         + 'the durations and why the others are wrong.',
    drills: 'Recognising psychiatric presentations',
  },
  {
    id: 'genetics-roulette',
    name: 'Genetics Roulette',
    subject: 'Genetics',
    icon: '🎲',
    accent: '226, 158, 32',          // genetics amber
    route: '/genetics-roulette',
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
    route: '/drug-match',
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
    route: '/muscle-mapper',
    blurb: 'A movement is lost or a nerve is cut — name the muscle behind it, '
         + 'the nerve and root that drive it, and the test that shows it up.',
    drills: 'Muscles, nerves and the moves they own',
  },
  {
    id: 'biostats-lab',
    name: 'Biostats Lab',
    subject: 'Biostatistics',
    icon: '📊',
    accent: '255, 205, 90',          // biostatistics gold
    route: '/biostats-lab',
    blurb: 'Eight stations in one lab: the 2×2 table, the cutoff, risk and NNT, '
         + 'study designs, biases, errors and power, picking the test, and the '
         + 'normal curve — fresh numbers every run.',
    drills: 'Step 1 biostatistics, worked out',
  },
  {
    id: 'lab-values',
    name: 'Lab Values',
    subject: 'Clinical labs',
    icon: '🧪',
    accent: '46, 196, 150',          // lab-bench green
    route: '/lab-values',
    blurb: 'A lab comes up with its unit and you type the normal range from '
         + 'memory: electrolytes, LFTs, the CBC, coags, the blood gas, CSF. '
         + 'Then the real range and why it matters.',
    drills: 'Normal ranges off the NBME sheet',
  },
  {
    id: 'microbiology',
    name: 'Microbiology',
    subject: 'Microbiology',
    icon: '🦠',
    accent: '70, 190, 160',          // microbiology teal
    soon: true,
    blurb: 'Identify the bug from the Gram stain, the culture and the clinical '
         + 'picture — then name its virulence factors, the disease it causes '
         + 'and the drug that treats it.',
    drills: 'Bugs, stains, toxins and treatment',
  },
  {
    id: 'hiv',
    name: 'HIV',
    subject: 'Immunology & infectious disease',
    icon: '🎗️',
    accent: '214, 64, 82',           // awareness red
    soon: true,
    blurb: 'Follow HIV from infection to AIDS — the life cycle and where each '
         + 'drug class strikes it, CD4 counts and the opportunistic infections '
         + 'that come with them, and the prophylaxis that prevents them.',
    drills: 'Life cycle, ART, CD4 thresholds, opportunistic infections',
  },
];

/**
 * The shelf is sorted into FOLDERS, one per system or subject, so the page
 * opens on a short list of systems instead of one long wall of games. Each
 * folder wears its system's colour; every game id above must appear in exactly
 * one folder (a game left out would simply vanish from the page).
 *
 * The open folder lives in the URL (?folder=cardio) so the browser's back
 * button closes it and a shared link lands inside the folder.
 */
const FOLDERS = [
  { id: 'biochem', name: 'Biochemistry', icon: '🧬', accent: '46, 170, 120',
    blurb: 'Metabolism, nutrition and genetics.',
    games: ['pathway-navigator', 'vitamin-vault', 'genetics-roulette'] },
  { id: 'cardio', name: 'Cardiology', icon: '🫀', accent: '214, 54, 60',
    blurb: 'Strips, sounds and loops.',
    games: ['ecg', 'murmurs', 'pv-loops'] },
  { id: 'resp', name: 'Respiratory', icon: '🫁', accent: '42, 160, 196',
    blurb: 'Blood gases and acid–base.',
    games: ['abg'] },
  { id: 'heme', name: 'Hematology', icon: '🩸', accent: '220, 38, 72',
    blurb: 'Coagulation and its drugs.',
    games: ['clot-cascade'] },
  { id: 'repro', name: 'Reproductive', icon: '🎗️', accent: '236, 72, 153',
    blurb: 'Breast and reproductive tumours.',
    games: ['onco-atlas'] },
  { id: 'neuro', name: 'Neurology', icon: '🧠', accent: '211, 83, 158',
    blurb: 'Tracts, nuclei and lesions.',
    games: ['lesion-localiser'] },
  { id: 'msk', name: 'Musculoskeletal', icon: '🦴', accent: '150, 190, 58',
    blurb: 'Muscles, nerves and roots.',
    games: ['muscle-mapper'] },
  { id: 'psych', name: 'Psychiatry', icon: '🎬', accent: '150, 106, 232',
    blurb: 'Presentations to recognise.',
    games: ['psych-video'] },
  { id: 'pharm', name: 'Pharmacology', icon: '💊', accent: '70, 120, 220',
    blurb: 'Mechanisms and side effects.',
    games: ['drug-mechanism-match'] },
  { id: 'micro', name: 'Microbiology & Immunology', icon: '🦠', accent: '70, 190, 160',
    blurb: 'Bugs, drugs and HIV.',
    games: ['microbiology', 'hiv'] },
  { id: 'biostats', name: 'Biostatistics', icon: '📊', accent: '255, 205, 90',
    blurb: 'Tables, tests and study design.',
    games: ['biostats-lab'] },
  { id: 'labs', name: 'Clinical Labs', icon: '🧪', accent: '46, 196, 150',
    blurb: 'Normal ranges from memory.',
    games: ['lab-values'] },
];

const GAME_BY_ID = Object.fromEntries(MINIGAMES.map(g => [g.id, g]));

function folderFromUrl() {
  try {
    const id = new URLSearchParams(window.location.search).get('folder');
    return FOLDERS.some(f => f.id === id) ? id : null;
  } catch { return null; }
}

function GameTile({ g }) {
  const Tag = g.soon ? 'div' : 'button';
  return (
    <Tag
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
}

function FolderTile({ f, onOpen }) {
  const games = f.games.map(id => GAME_BY_ID[id]).filter(Boolean);
  const live = games.filter(g => !g.soon).length;
  return (
    <button
      type="button"
      style={{ '--mg-accent': f.accent }}
      onClick={() => onOpen(f.id)}
      className={`mg-tile mg-folder${live === 0 ? ' is-quiet' : ''}`}
    >
      <span className="mg-tile-art mg-folder-art">
        <span className="mg-folder-shape" aria-hidden="true">
          <span className="mg-folder-tab" />
          <span className="mg-folder-icon">{f.icon}</span>
        </span>
        <span className="mg-tile-chip">
          {games.length} {games.length === 1 ? 'game' : 'games'}
        </span>
      </span>
      <span className="mg-tile-body">
        <span className="mg-tile-name">{f.name}</span>
        <span className="mg-tile-blurb">{f.blurb}</span>
        <span className="mg-folder-list">
          {games.map(g => (
            <span key={g.id} className={`mg-folder-item${g.soon ? ' is-soon' : ''}`}>
              <span aria-hidden="true">{g.icon}</span> {g.name}{g.soon ? ' · soon' : ''}
            </span>
          ))}
        </span>
        <span className="mg-tile-foot">
          <span className="mg-tile-drills">
            {live === 0 ? 'In the works' : `${live} ready to play`}
          </span>
          <span className="mg-tile-go" aria-hidden="true">Open →</span>
        </span>
      </span>
    </button>
  );
}

export default function MinigamesPage() {
  // useGameSettings returns { settings, loading } — not the settings object.
  // Reading minigamesTheme off the wrapper silently gave undefined, which the
  // fallback below then turned into "default" forever.
  const { settings } = useGameSettings();
  const theme = MINIGAMES_THEMES.includes(settings?.minigamesTheme)
    ? settings.minigamesTheme
    : 'default';

  const [folder, setFolder] = useState(folderFromUrl);
  const open = FOLDERS.find(f => f.id === folder) || null;

  // Back/forward move between the folder list and an open folder.
  useEffect(() => {
    const onPop = () => setFolder(folderFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openFolder = (id) => {
    const url = new URL(window.location.href);
    if (id) {
      url.searchParams.set('folder', id);
      window.history.pushState({ mgFolder: id }, '', url);
    } else {
      // Closing a folder this page opened steps back through history; one
      // reached from a shared link has no entry of ours, so just rewrite it.
      if (window.history.state?.mgFolder) { window.history.back(); return; }
      url.searchParams.delete('folder');
      window.history.replaceState(null, '', url);
    }
    setFolder(id);
    window.scrollTo(0, 0);
  };

  return (
    <div className="mg" data-mg-theme={theme}>
      <div className="mg-glow" aria-hidden="true" />

      <header className="mg-head">
        <button
          type="button"
          className="mg-back"
          onClick={() => {
            if (open) openFolder(null);
            else window.location.href = '/?play=1';
          }}
        >
          {open ? '← All systems' : '← Choose Your Path'}
        </button>
        <h1 className="mg-title">{open ? open.name : 'Minigames'}</h1>
        <p className="mg-sub">
          {open
            ? open.blurb
            : 'Short games that drill one skill at a time, sorted by system. '
              + 'Open a folder and pick one.'}
        </p>
      </header>

      {open ? (
        <div className="mg-grid" key={open.id}>
          {open.games.map(id => GAME_BY_ID[id]).filter(Boolean)
            .map(g => <GameTile key={g.id} g={g} />)}
        </div>
      ) : (
        <div className="mg-grid mg-grid-folders">
          {FOLDERS.map(f => <FolderTile key={f.id} f={f} onOpen={openFolder} />)}
        </div>
      )}

      <p className="mg-foot">
        {theme === 'arcade' ? 'More cabinets on the way.' : 'More on the way.'}
      </p>
    </div>
  );
}
