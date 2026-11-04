import { useState, useEffect, useRef } from 'react';
import ExplanationText from './ExplanationText';
import { renderStem } from '../utils/renderStem';
import { useScrollToTopOnChange } from '../utils/useScrollToTopOnChange';
import './PvpDuelGame.css';

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Where the questions came from, for the chip in the utility row. Keys are
// game_modes tags; the server reports which pool it actually used, which is
// not always the one the host asked for.
const DUEL_SOURCE_LABELS = {
  pvp_duel: 'PvP Arenas pool',
  uworld_adventure: 'UWorld Adventure',
  mehlman_rapid_fire: 'Mehlman Rapid Fire',
  saudi_mle: 'Saudi MLE',
  ore_lds: 'ORE / LDS',
  oet: 'OET',
  battle_royale: 'Battle Royale pool',
  all: 'Whole bank',
};
const STARTING_HP = 100; // display default until the first server snapshot arrives
// Fallback only. The server sends `damage` with every round result; this is
// what gets shown against an older server that does not, and it mirrors
// PVP_DUEL_DAMAGE_PER_HIT there. Nothing is calculated from it.
const DAMAGE_PER_HIT = 5;

const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// The drifting embers. Fixed, hand-picked positions rather than Math.random()
// at render: a random field would re-roll on every tick of the countdown and
// the whole backdrop would twitch once a second.
// The delays are NEGATIVE on purpose: a negative animation-delay starts the
// ember partway through its climb, so the field is already burning on the
// first frame. With positive delays the arena opened pitch black and took
// the better part of a minute to fill, which is most of a short duel.
const EMBERS = [
  { left: '4%',  '--d': '14s', '--delay': '-2s',    '--s': '3px' },
  { left: '9%',  '--d': '19s', '--delay': '-11.4s', '--s': '2px' },
  { left: '15%', '--d': '12s', '--delay': '-5.5s',  '--s': '4px' },
  { left: '21%', '--d': '17s', '--delay': '-9.1s',  '--s': '2px' },
  { left: '27%', '--d': '11s', '--delay': '-1.2s',  '--s': '3px' },
  { left: '33%', '--d': '21s', '--delay': '-16.7s', '--s': '2px' },
  { left: '39%', '--d': '15s', '--delay': '-7.3s',  '--s': '4px' },
  { left: '44%', '--d': '13s', '--delay': '-3.9s',  '--s': '3px' },
  { left: '50%', '--d': '18s', '--delay': '-13.4s', '--s': '2px' },
  { left: '55%', '--d': '12s', '--delay': '-8.2s',  '--s': '3px' },
  { left: '61%', '--d': '20s', '--delay': '-4.1s',  '--s': '2px' },
  { left: '67%', '--d': '14s', '--delay': '-10.8s', '--s': '4px' },
  { left: '72%', '--d': '16s', '--delay': '-6.2s',  '--s': '3px' },
  { left: '78%', '--d': '11s', '--delay': '-2.5s',  '--s': '2px' },
  { left: '84%', '--d': '19s', '--delay': '-15.1s', '--s': '3px' },
  { left: '89%', '--d': '13s', '--delay': '-0.6s',  '--s': '2px' },
  { left: '94%', '--d': '17s', '--delay': '-12.9s', '--s': '4px' },
  { left: '98%', '--d': '15s', '--delay': '-5.9s',  '--s': '2px' },
];

// Phase 4c: mockup PvP Match HUD treatment (minus the minimap). Visual pass
// only — HP bars are real (existing pvp_duel socket data); the mana bar and
// ability keys render per the mockup but are INERT (no mana/ability system
// exists yet). Sound + Forfeit are REAL: they reuse App's global mute and
// the return-home disconnect path (server-side forfeit proven in 4a).
export default function PvpDuelGame({
  question,
  round,
  timeLimit,
  myAnswer,
  hasAnswered,
  players,
  answerResult,
  roundResults,
  showingRoundResult,
  onAnswer,
  username,
  onTick,
  socketId,
  user = null,
  muted = false,
  onToggleMute,
  onForfeit,
  // What the host set up: how many questions this duel runs for (null when it
  // is fought to zero HP instead) and which bank it drew from.
  totalRounds = null,
  duelSource = null,
  // Called once per resolved round with everything the results screen needs
  // to show it again. Recorded HERE rather than in a socket handler because
  // this component has the question, the answer given and the result in one
  // render; a handler registered once would close over a stale question.
  onRoundComplete,
}) {
  // ── Per-question countdown (drives BOTH the top-center clock and the
  //    modal header — one source, mockup shows the two readouts) ──
  const [left, setLeft] = useState(timeLimit || 0);
  const tickRef = useRef(null);
  // Reset the view to the top on each new question (keyed on the question id,
  // so answering/timer ticks don't retrigger it). This one attaches to
  // .pvd-modal, not the .pvd root: the duel's stem scrolls inside the modal
  // box, which is a DESCENDANT of .pvd, so a ref on the root would never reach
  // it. The hook walks upward, so it must sit on the scrolling element itself.
  const screenRef = useScrollToTopOnChange(question?.id);
  const timerActive = !!question && !hasAnswered && !showingRoundResult;
  useEffect(() => {
    setLeft(timeLimit || 0);
    if (!question) return;
    tickRef.current = setInterval(() => setLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(tickRef.current);
  }, [timeLimit, question?.id]);
  useEffect(() => {
    if (timerActive && left <= 5 && left > 0 && onTick) onTick();
  }, [left, timerActive, onTick]);

  // ── Real HP (same derivation as 4a) ──
  const snapshotPlayers = roundResults?.players;
  const findHp = (isMe) => {
    const bySnapshot = snapshotPlayers?.find(p => (p.id === socketId) === isMe);
    if (bySnapshot && typeof bySnapshot.hp === 'number') return bySnapshot.hp;
    if (question?.duelHp) {
      const entry = Object.entries(question.duelHp).find(([id]) => (id === socketId) === isMe);
      if (entry) return entry[1];
    }
    return STARTING_HP;
  };
  const myHp  = findHp(true);
  const oppHp = findHp(false);
  const oppName = (snapshotPlayers || players || []).find(p => p.id !== socketId)?.username || 'Opponent';
  const myLevel = user?.level || 1;

  // ── Event feed: real strike messages from the existing mechanic ──
  const [feed, setFeed] = useState([]);
  const lastFeedRef = useRef(null);
  useEffect(() => {
    if (!roundResults || roundResults === lastFeedRef.current) return;
    lastFeedRef.current = roundResults;
    // What the blow cost, from the server. These lines read "5 damage" in
    // prose while the damage figure over the plate showed the real number —
    // one place to change if the duel is ever rebalanced.
    const dmg = roundResults.damage || DAMAGE_PER_HIT;
    const msg = roundResults.striker
      ? (roundResults.striker === username
          ? { text: <>You struck <em>{oppName}</em> for {dmg} damage!</>, mine: true }
          : { text: <><em>{oppName}</em> struck you for {dmg} damage!</>, mine: false })
      : { text: <>No strike — nobody was first with the right answer.</>, mine: false };
    setFeed(prev => [msg, ...prev].slice(0, 2));
  }, [roundResults, username, oppName]);

  // A strike should be SEEN. The HP numbers already change, but a number
  // changing is not a hit landing — this flashes the screen from the side the
  // blow came from and shakes the plate that took it. Driven by the same
  // roundResults the feed reads, so it cannot disagree with the damage.
  const [strike, setStrike] = useState(null);   // 'mine' | 'theirs' | null
  const [hitMark, setHitMark] = useState(null); // the floating damage figure
  const lastStrikeRef = useRef(null);
  useEffect(() => {
    if (!roundResults || roundResults === lastStrikeRef.current) return;
    lastStrikeRef.current = roundResults;
    if (!roundResults.striker) return;
    const side = roundResults.striker === username ? 'mine' : 'theirs';
    setStrike(side);
    // A number flying off the plate that took it. This is the single thing
    // that turns "the bar moved" into "I hit them for five" — the damage is
    // the game's whole currency and it was never once shown as a figure.
    setHitMark({
      side,
      // The server's own figure when it sends one; the local constant only as
      // a fallback for a server that has not shipped this field yet.
      amount: roundResults.damage || DAMAGE_PER_HIT,
      key: Date.now(),
    });
    const t = setTimeout(() => setStrike(null), 900);
    const t2 = setTimeout(() => setHitMark(null), 1200);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [roundResults, username]);

  // The last seconds of a question, for the clock's own urgency.
  const urgent = timerActive && left <= 5 && left > 0;

  // One record per round, as it resolves.
  const recordedRef = useRef(null);
  useEffect(() => {
    if (!roundResults || !question || roundResults === recordedRef.current) return;
    recordedRef.current = roundResults;
    onRoundComplete?.({
      round: round || 0,
      question: question.question,
      options: question.options,
      imageUrl: question.image_url || null,
      correctAnswer: roundResults.correctAnswer,
      explanation: roundResults.explanation || '',
      myAnswer: myAnswer ?? null,
      correct: myAnswer != null && myAnswer === roundResults.correctAnswer,
      struck: roundResults.striker === username,
    });
  }, [roundResults, question, round, myAnswer, username, onRoundComplete]);

  const handleForfeit = () => {
    // The match ends on the results screen for both players now, so this
    // says what actually happens rather than implying you are dropped out.
    if (window.confirm('Forfeit the match? Your opponent claims the win — you will still see the results and the explanations.')) {
      onForfeit?.();
    }
  };

  const avatarLetter = (name) => (name || '?')[0].toUpperCase();
  const barPct = (hp) => `${Math.max(0, Math.min(100, (hp / STARTING_HP) * 100))}%`;

  return (
    <div className={`pvd${strike ? ` pvd--strike-${strike}` : ''}`}>
      {/* ── The arena ───────────────────────────────────────────────────
          A battlefield rather than a black page: a slow horizon glow, drifting
          embers and a vignette, all behind everything and all inert. Pure CSS
          — a canvas would cost a frame budget on a screen whose job is to
          stay responsive to a five-second timer. */}
      <div className="pvd-arena" aria-hidden="true">
        <span className="pvd-arena-glow pvd-arena-glow--mine" />
        <span className="pvd-arena-glow pvd-arena-glow--theirs" />
        <span className="pvd-arena-floor" />
        <span className="pvd-embers">
          {EMBERS.map((e, i) => <i key={i} style={e} />)}
        </span>
      </div>

      {/* The blow itself: a wash from the side it came from. Pointer-events
          none, so it can never swallow the click that answers the next
          question. */}
      {strike && <div className={`pvd-flash pvd-flash--${strike}`} aria-hidden="true" />}
      {strike && <div className={`pvd-slash pvd-slash--${strike}`} aria-hidden="true" />}
      {hitMark && (
        <div
          key={hitMark.key}
          className={`pvd-hitmark pvd-hitmark--${hitMark.side}`}
          aria-hidden="true"
        >
          −{hitMark.amount}
        </div>
      )}
      {/* ── Top bar: self plate · timer · opponent plate ─────────────────── */}
      <div className="pvd-top">
        <div className={`pvd-plate${strike === 'theirs' ? ' pvd-plate--hit' : ''}`}>
          <span className="pvd-avatar pvd-avatar--self">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
              : avatarLetter(username)}
          </span>
          <div className="pvd-plate-info">
            <div className="pvd-plate-name">{username} · Lvl. {myLevel}</div>
            <div className="pvd-bar pvd-bar--hp">
              <div className="pvd-bar-fill pvd-bar-fill--hp" style={{ width: barPct(myHp) }} />
            </div>
            {/* Mana bar: mockup styling, INERT — no mana system exists yet */}
            <div className="pvd-bar pvd-bar--mana" title="Mana — coming soon" aria-hidden="true">
              <div className="pvd-bar-fill pvd-bar-fill--mana" style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        {/* Honest top-center readout: real per-question countdown over the
            real question number (no round/score concept exists in 4a) */}
        <div className="pvd-center">
          <div className={`pvd-center-timer${urgent ? ' pvd-center-timer--urgent' : ''}`}>
            {fmtClock(left)}
          </div>
          {/* "Question 3 of 10" when the host set a length; just the number
              when the duel runs until someone falls, because there is no
              total to count towards. */}
          <div className="pvd-center-label">
            QUESTION {round || 1}{totalRounds ? ` OF ${totalRounds}` : ''}
          </div>
          {totalRounds > 0 && (
            <div className="pvd-center-track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, ((round || 1) / totalRounds) * 100)}%` }} />
            </div>
          )}
        </div>

        {/* Opponent plate, mirrored. Level omitted — the server doesn't
            share opponent level, and we don't fabricate one. */}
        <div className={`pvd-plate pvd-plate--opp${strike === 'mine' ? ' pvd-plate--hit' : ''}`}>
          <div className="pvd-plate-info pvd-plate-info--right">
            <div className="pvd-plate-name">{oppName}</div>
            <div className="pvd-bar pvd-bar--hp">
              <div className="pvd-bar-fill pvd-bar-fill--hp pvd-bar-fill--right" style={{ width: barPct(oppHp) }} />
            </div>
            <div className="pvd-bar pvd-bar--mana" title="Mana — coming soon" aria-hidden="true">
              <div className="pvd-bar-fill pvd-bar-fill--mana pvd-bar-fill--right" style={{ width: '100%' }} />
            </div>
          </div>
          <span className="pvd-avatar pvd-avatar--opp">{avatarLetter(oppName)}</span>
        </div>
      </div>

      {/* ── Utility row: REAL sound toggle + REAL forfeit ─────────────────── */}
      <div className="pvd-utility">
        {duelSource && (
          <span className="pvd-source" title="Where this duel's questions came from">
            {DUEL_SOURCE_LABELS[duelSource] || duelSource}
          </span>
        )}
        <button
          type="button"
          className="pvd-sound"
          onClick={onToggleMute}
          aria-pressed={!muted}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <span>Sound</span>
          <span className={`pvd-sound-track${muted ? ' pvd-sound-track--off' : ''}`}>
            <span className="pvd-sound-knob" />
          </span>
        </button>
        <button type="button" className="pvd-forfeit" onClick={handleForfeit}>
          Forfeit Match
        </button>
      </div>

      {/* ── Event feed: real strike messages (no fabricated ability lines) ── */}
      {feed.length > 0 && (
        <div className="pvd-feed">
          {feed.map((f, i) => (
            <div key={i} className={`pvd-feed-line${i === 0 ? ' pvd-feed-line--latest' : ''}`}>
              {f.text}
            </div>
          ))}
        </div>
      )}

      {/* ── Center: ANSWER TO STRIKE modal ────────────────────────────────── */}
      <div className="pvd-modal-wrap">
        {!question ? (
          <div className="pvd-modal pvd-modal--waiting">
            <div className="spinner" />
            <p className="pvd-waiting-text">Your opponent approaches…</p>
          </div>
        ) : (
          <div className="pvd-modal" ref={screenRef}>
            <div className="pvd-modal-head">
              <span className="pvd-modal-title">ANSWER TO STRIKE</span>
              <span className="pvd-modal-clock">{fmtClock(left)}</span>
            </div>

            <div className="pvd-stem">{renderStem(question.question)}</div>
            {question.image_url && (
              <img
                src={question.image_url}
                alt="Medical scan"
                className="pvd-stem-image"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}

            <div className="pvd-options">
              {question.options.map((opt, i) => {
                const label   = LABELS[i];
                const isMine  = myAnswer === label;
                const isRight = showingRoundResult && roundResults?.correctAnswer === label;
                const isWrong = showingRoundResult && isMine && roundResults?.correctAnswer !== label;
                return (
                  <button
                    key={i}
                    type="button"
                    className={[
                      'pvd-option',
                      isMine  ? 'pvd-option--mine'  : '',
                      isRight ? 'pvd-option--right' : '',
                      isWrong ? 'pvd-option--wrong' : '',
                    ].join(' ')}
                    onClick={() => onAnswer(label)}
                    disabled={hasAnswered || showingRoundResult}
                  >
                    <span className="pvd-option-letter">{label}</span>
                    <span className="pvd-option-text">{opt}</span>
                  </button>
                );
              })}
            </div>

            {!showingRoundResult && (
              <div className="pvd-modal-foot">
                {hasAnswered
                  ? <>Waiting for {oppName}…</>
                  : <>Answer correctly before {oppName} to land a strike.</>}
              </div>
            )}

            {showingRoundResult && roundResults && (
              <div className={`pvd-result${answerResult?.correct ? ' pvd-result--correct' : ''}`}>
                <div className="pvd-result-line">
                  {answerResult && (
                    <span className={`pvd-result-verdict${answerResult.correct ? ' pvd-result-verdict--correct' : ''}`}>
                      {answerResult.correct ? '✓ CORRECT' : '✗ WRONG'}
                    </span>
                  )}
                  <span className="pvd-result-strike">
                    {roundResults.striker
                      ? (roundResults.striker === username
                          ? `⚔ You strike ${oppName} for ${roundResults.damage || DAMAGE_PER_HIT} damage!`
                          : `🛡 ${oppName} strikes you for ${roundResults.damage || DAMAGE_PER_HIT} damage!`)
                      : 'No strike this round.'}
                  </span>
                </div>
                <div className="pvd-result-expl">
                  <strong>
                    Correct answer: {roundResults.correctAnswer}
                    {question?.options?.[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]
                      ? `. ${question.options[(roundResults.correctAnswer || 'A').charCodeAt(0) - 65]}`
                      : ''}
                  </strong>
                  <ExplanationText text={roundResults.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom bar: self avatar (no status orbs — no buff system) +
             inert ability keys per the mockup. No minimap. ─────────────── */}
      <div className="pvd-bottom">
        {/* The corner portrait has gone: your own face is already on the
            plate at the top left, and a second copy of it bought nothing but
            a dead pixel-block in the corner of the arena. */}
        <span className="pvd-bottom-spacer" aria-hidden="true" />

        <div className="pvd-abilities" aria-label="Abilities — coming soon">
          <button type="button" className="pvd-ability pvd-ability--teal" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">1</span>
            <span className="pvd-ability-name">Heal</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--teal" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">2</span>
            <span className="pvd-ability-name">Ward</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--cooldown" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">4s</span>
            <span className="pvd-ability-name">Lance</span>
          </button>
          <button type="button" className="pvd-ability pvd-ability--ult" disabled title="Abilities coming soon">
            <span className="pvd-ability-key">R</span>
            <span className="pvd-ability-name">Ult</span>
          </button>
        </div>

        {/* right slot intentionally empty: the mockup's minimap is excluded */}
        <span className="pvd-bottom-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
