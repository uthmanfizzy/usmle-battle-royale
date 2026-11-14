import { useState, useEffect, Fragment } from 'react';
import { authFetch } from '../auth';
import './PlayPage.css';
import './PlayPageArena.css';
import { cachedImageMap, rememberImageMap } from '../utils/cachedImages';
import AnKingMode from './AnKingMode';
import MedJinxLobby from './MedJinxLobby';

// Where a duel can draw its questions from. The ids are game_modes tags and
// are whitelisted server-side — this list is the menu, not the authority.
const DUEL_JOURNEY = 'first_aid_journey';

const DUEL_SOURCES = [
  // "Whatever this mode normally plays" — the default everywhere except a
  // duel, whose own pool is listed next and is what it has always drawn from.
  { id: 'default',            label: "This mode's own questions" },
  { id: 'pvp_duel',           label: 'PvP Arenas pool' },
  { id: DUEL_JOURNEY,         label: 'First Aid Journey' },
  { id: 'uworld_adventure',   label: 'UWorld Adventure' },
  { id: 'mehlman_rapid_fire', label: 'Mehlman Rapid Fire' },
  { id: 'saudi_mle',          label: 'Saudi MLE' },
  { id: 'ore_lds',            label: 'ORE / LDS' },
  { id: 'oet',                label: 'OET' },
  { id: 'clinical',           label: 'Clinical' },
  { id: 'battle_royale',      label: 'Battle Royale pool' },
  { id: 'all',                label: 'Everything' },
];

const GAME_MODES = [
  {
    id: 'battle_royale',
    name: 'BATTLE ROYALE',
    icon: '💀',
    shortDesc: 'Last doctor standing wins',
    meta: 'Multiplayer',
    // The arena skin: a colour per mode, and three facts that are true of it.
    accent: '220, 62, 48',
    tagline: 'Lives on the line',
    facts: ['3 lives', 'Sudden death', 'Last one standing'],
    // Default state when an admin has set nothing for this mode. Admin config
    // still wins either way, so a mode can be opened from /admin without a
    // deploy.
    comingSoon: true,
    longDescription: 'Drop into the medical arena. Wrong answers cost lives. Outlast every other player through skill and knowledge. Strategy and speed will lead you to victory.',
    supportsSolo: false,
  },
  {
    id: 'speed_race',
    name: 'SPEED RACE',
    icon: '⚡',
    shortDesc: 'First to 20 correct answers wins',
    meta: 'Multiplayer',
    accent: '86, 170, 235',
    tagline: 'Pure pace',
    facts: ['20 correct', 'No lives', 'Fastest wins'],
    longDescription: 'Race against the clock and your opponents. Answer 20 questions correctly as fast as possible. No lives lost, just pure speed and accuracy.',
    supportsSolo: false,
  },
  {
    id: 'scan_master',
    name: 'SCAN MASTER',
    icon: '🔬',
    shortDesc: 'Identify conditions from medical images',
    meta: 'Multiplayer',
    accent: '0, 184, 148',
    tagline: 'Read the film',
    facts: ['ECGs & imaging', 'Histology', 'Visual diagnosis'],
    longDescription: 'Study real medical images including ECGs, X-rays, histology slides, and dermatology photos. Last doctor standing wins through visual diagnosis mastery.',
    supportsSolo: false,
  },
  {
    id: 'buzz_fun',
    name: 'BUZZ FUN',
    icon: '🧠',
    shortDesc: 'Buzzwords, triads & classic HY facts',
    meta: 'Multiplayer',
    accent: '230, 126, 34',
    tagline: 'Eight seconds',
    facts: ['8s a card', 'Buzzwords', 'Speed bonuses'],
    longDescription: 'Fast-paced flash cards of buzzwords, triads, side effects and classic high-yield associations. 8 seconds each — fast answers earn bonus points!',
    supportsSolo: false,
  },
  {
    id: 'medathon',
    name: 'MEDATHON',
    icon: '🏁',
    shortDesc: 'Race the whole of medicine, system by system.',
    meta: 'Multiplayer',
    accent: '214, 161, 63',
    tagline: 'The long race',
    facts: ['15 systems', '5 each', 'Speed bonus'],
    longDescription: 'Fifteen systems, five questions each, Cardio to Microbiology. Everyone races the same run at their own pace, and the faster you answer the bigger the bonus. Watch the field move on the live track. Right or wrong only — no explanations until the finish.',
    supportsSolo: false,
  },
  {
    // Free recall, scored by rarity. It has its own bank of topics and its
    // own lobby settings (MedJinxLobby) rather than the question sources the
    // other modes choose between.
    id: 'medjinx',
    name: 'MEDJINX',
    icon: '🧪',
    shortDesc: 'Name what goes with it. Rare answers pay.',
    meta: '2–20 players',
    accent: '155, 226, 45',
    tagline: 'Know what they overlook',
    facts: ['Typed answers', 'Rarity scoring', 'Open & clinical'],
    longDescription: 'A condition or a clinical vignette goes up, and everyone types as many correct associations as they can before the clock runs out. Each answer is worth its rarity — 1,000 for the obvious up to 8,000 for the obscure — shared between everyone who gave it. Then the whole answer bank is laid out and explained.',
    supportsSolo: false,
  },
  {
    // The trivia board: roll, move round a 36-space board, and win a wedge
    // by answering correctly on a subject's headquarters — cardiology,
    // neurology, pharmacology, microbiology, biochemistry, biostatistics.
    // All six, then a final question, wins. The server and the board UI
    // (TriviaGame / TriviaBoard) were already built; this is its card.
    id: 'trivia_pursuit',
    name: 'USMLE MEDICAL TRIVIA',
    icon: '🎲',
    shortDesc: 'Roll, move, and win all six subject wedges.',
    meta: 'Multiplayer',
    accent: '232, 84, 160',
    tagline: 'Six wedges to win',
    facts: ['6 subjects', 'Roll & move', 'Final question'],
    longDescription: 'Roll the dice and move round the board. Land on a subject’s headquarters — cardiology, neurology, pharmacology, microbiology, biochemistry or biostatistics — and answer correctly to win its wedge. Collect all six, then answer one final question to win.',
    supportsSolo: false,
  },
  {
    // Real, live 1v1 mode (Phase 4a). Card copy follows the Deploy mockup's
    // "PvP Arenas" treatment; kept ALL-CAPS to match the five sibling names.
    id: 'pvp_duel',
    name: 'PVP ARENAS',
    icon: '⚔️',
    shortDesc: 'Duel rival healers in ranked combat.',
    meta: '1V1',
    accent: '155, 89, 182',
    tagline: 'One on one',
    facts: ['100 HP', 'First answer strikes', 'Auto-start'],
    longDescription: 'Face a single opponent in a duel of knowledge. Both of you see the same question — whoever answers correctly first strikes the other for 5 damage. Reduce your rival from 100 HP to zero to claim victory. The duel begins the moment your opponent arrives.',
    supportsSolo: false,
  },
];

export default function PlayPage({
  user, username, onModeSelect, onBack, error, onClearError,
  lobbyId, lobbyPlayers, isHost, lobbySubject, lobbyGameMode, openToQuickJoin,
  duelOptions, onDuelOptions,
  medjinxOptions, onMedjinxOptions,
  onStartGame, onAddBot, onRemoveBot, onToggleQuickJoin, onLeaveLobby,
  initialMode
}) {
  // Default preserves the existing behavior exactly (Online passes no initialMode)
  const [selectedMode, setSelectedMode] = useState(initialMode || 'battle_royale');
  // Party sizes are gone from the page, so every room is a solo entry. Kept as
  // a value rather than dropped so the lobby payload's shape is unchanged.
  const squadSize = 'solo';
  // Exam board + difficulty values: the visible picker UI is gone, but the
  // underlying defaults must still flow into lobby-creation calls exactly as
  // before (App currently destructures but doesn't consume them; kept so the
  // payload shape is unchanged and nothing silently breaks).
  const [selectedExam] = useState('usmle');
  const [selectedStep] = useState('step1');
  const [fillTeam] = useState(false);
  const [gameModesConfig, setGameModesConfig] = useState({});
  // Every system a duel could be narrowed to. Fetched once and only when a
  // duel lobby is actually open — the rest of this page has no use for it.
  const [subjects, setSubjects] = useState([]);
  // Chapters, for a duel drawn from the First Aid Journey. Fetched only when
  // that source is actually chosen — it is one of several, and most duels
  // never need the list.
  const [chapters, setChapters] = useState([]);
  const [playBgImage, setPlayBgImage] = useState(() => cachedImageMap('play').play_page_background || '');
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // The lobby overlay titles itself from the lobby's OWN mode, not whatever is
  // selected behind it: joining by code puts you in someone else's room.
  const lobbyModeData = GAME_MODES.find(m => m.id === (lobbyGameMode || selectedMode)) || null;

  // Never sit on a battlefield that isn't open. The default selection is made
  // before the admin config arrives, and Battle Royale — the default — is one
  // of the modes currently marked coming soon, so without this the page could
  // open with a locked mode selected and Deploy would act on it.
  useEffect(() => {
    const open = (m) => gameModesConfig[m.id]?.enabled ?? !m.comingSoon;
    const current = GAME_MODES.find(m => m.id === selectedMode);
    // A mode with no tile (Story Mode's AnKing) is not ours to second-guess.
    if (!current || open(current)) return;
    const first = GAME_MODES.find(open);
    if (first) setSelectedMode(first.id);
  }, [gameModesConfig, selectedMode]);

  // Fetch game-modes config (drives the COMING SOON state per admin settings)
  // and the optional page background image.
  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await authFetch('/api/game-settings');
        const data = await res.json();
        setGameModesConfig(data.game_modes_config || {});
        rememberImageMap('play', { play_page_background: data.play_page_background || '' });
        setPlayBgImage(data.play_page_background || '');
      } catch (err) {
        console.error('Failed to load configs:', err);
      }
    }
    loadConfigs();
  }, []);

  function handleCreateLobby() {
    onModeSelect({
      mode: selectedMode,
      action: 'create',
      squadSize,
      fillTeam,
      exam: selectedExam,
      step: selectedStep,
    });
  }

  function handleFindMatch() {
    onModeSelect({
      mode: selectedMode,
      action: 'find',
      squadSize,
      fillTeam,
      exam: selectedExam,
      step: selectedStep,
    });
  }

  useEffect(() => {
    // Every mode can be narrowed by system now, so the list is fetched for
    // any open lobby rather than only for a duel.
    if (!lobbyId || subjects.length) return undefined;
    let cancelled = false;
    authFetch('/api/subjects')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        // Only the ones that are switched on. /api/subjects returns the
        // inactive ones too (sorted after the active ones), and the first
        // version of this filter only dropped an explicit `false` — so a
        // row with no value at all, which the rest of the app treats as off,
        // was still being offered as something to duel over.
        //
        // Truthiness, to match how every other screen reads this column.
        const list = (d?.subjects || [])
          .filter(x => x && x.id && x.active)
          .map(x => ({ id: String(x.id).toLowerCase(), name: x.name || x.id }));
        setSubjects(list);
      })
      .catch(() => { /* the duel still plays, it just cannot be narrowed */ });
    return () => { cancelled = true; };
  }, [lobbyId, subjects.length]);

  // A duel keeps its own pool as the default; every other mode defaults to
  // the questions it has always played.
  const isDuel = lobbyGameMode === 'pvp_duel';
  const duelSource = duelOptions?.source || (isDuel ? 'pvp_duel' : 'default');
  const duelIsJourney = duelSource === DUEL_JOURNEY;

  useEffect(() => {
    if (!duelIsJourney || chapters.length) return undefined;
    let cancelled = false;
    authFetch('/api/journey-chapters')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setChapters((d?.chapters || []).filter(c => c && c.id));
      })
      .catch(() => { /* the duel still plays; it just cannot be narrowed */ });
    return () => { cancelled = true; };
  }, [duelIsJourney, chapters.length]);

  const chapterName = (id) => chapters.find(c => c.id === id)?.name || 'that chapter';

  // ── Narrowing a Journey match: subject → chapter → level ────────────────
  //
  // Chapters carry their subject, so one fetch of the whole list is also the
  // list of subjects — and the reason the chapter row needed this in the
  // first place is that chapter NAMES repeat across subjects. Six chapters
  // called "Embryology", one per subject, are indistinguishable in a flat
  // list; inside their subject they are obvious.
  const journeySubject = duelOptions?.journeySubject || null;
  const journeyChapterId = duelOptions?.chapterId || null;

  const journeySubjects = (() => {
    const seen = new Map();
    for (const c of chapters) {
      const id = String(c.subject || '').toLowerCase();
      if (!id || seen.has(id)) continue;
      seen.set(id, subjects.find(s => s.id === id)?.name
        || id.replace(/[_-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()));
    }
    return [...seen].map(([id, name]) => ({ id, name }));
  })();

  // Only the chosen subject's chapters. No subject chosen is every chapter,
  // which is what the whole Journey means here.
  const journeyChapters = journeySubject
    ? chapters.filter(c => String(c.subject || '').toLowerCase() === journeySubject)
    : chapters;

  // Levels of the chosen chapter. Fetched only once a chapter is picked —
  // there is no such thing as "the levels" without one, and the endpoint
  // says so by returning nothing.
  const [levels, setLevels] = useState([]);
  useEffect(() => {
    if (!duelIsJourney || !journeyChapterId) { setLevels([]); return undefined; }
    let cancelled = false;
    authFetch(`/api/journey-levels?chapter_id=${encodeURIComponent(journeyChapterId)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setLevels((d?.levels || []).filter(l => l && l.id)); })
      .catch(() => { if (!cancelled) setLevels([]); });
    return () => { cancelled = true; };
  }, [duelIsJourney, journeyChapterId]);

  const levelName = (id) => levels.find(l => l.id === id)?.name || 'that level';

  // Choosing higher up clears what was chosen below it: a chapter from
  // another subject, or a level from another chapter, would silently decide
  // the match while the screen showed the subject the host actually picked.
  const pickJourneySubject = (id) =>
    onDuelOptions?.({ ...duelOptions, journeySubject: id, chapterId: null, levelId: null });
  const pickJourneyChapter = (id) =>
    onDuelOptions?.({ ...duelOptions, chapterId: id, levelId: null });

  // What the host has narrowed to, always an array so the chips below can
  // treat "nothing chosen" and "field missing" the same way.
  const duelSubjects = Array.isArray(duelOptions?.subjects) ? duelOptions.subjects : [];
  // A system's name for the player who did NOT choose it. Falls back to the
  // id, tidied, if the list has not arrived.
  const subjectName = (id) => subjects.find(x => x.id === id)?.name
    || String(id).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // ── PvP Arenas matchmaking overlay ──────────────────────────────────────
  // Purely a render branch over state PlayPage already receives: `lobbyId` and
  // `lobbyPlayers` are fed by the existing quick_join ack and lobby_update
  // socket events. Nothing new is emitted, and every name/avatar shown is a
  // real player from that list.
  const [mmSearching, setMmSearching] = useState(false);
  const mmPlayers = lobbyPlayers || [];
  const mmFound = mmSearching && mmPlayers.length >= 2;

  // A failed/timed-out quick join surfaces as the `error` prop; drop the
  // overlay so the message underneath is actually readable.
  useEffect(() => {
    if (error) setMmSearching(false);
  }, [error]);

  // A duel no longer starts itself when the second player arrives — the host
  // presses Start. So "found" is the end of the SEARCH, not the start of the
  // match: hold the found animation long enough to read, then hand over to
  // the lobby, where the settings and the Start button are. Without this the
  // overlay sat on "Entering the arena…" forever and the lobby underneath,
  // with the only button that can begin the duel, was unreachable.
  useEffect(() => {
    if (!mmFound) return undefined;
    const t = setTimeout(() => setMmSearching(false), 1400);
    return () => clearTimeout(t);
  }, [mmFound]);

  function handleQuickJoinClick() {
    if (selectedMode === 'pvp_duel') setMmSearching(true);
    handleFindMatch();
  }

  function handleCancelSearch() {
    setMmSearching(false);
    if (onLeaveLobby) onLeaveLobby();
  }

  function handleJoinLobby() {
    if (!lobbyCode.trim()) return;
    setJoinError('');
    if (onClearError) onClearError();
    onModeSelect({
      mode: selectedMode,
      action: 'join',
      lobbyCode: lobbyCode.trim(),
      exam: selectedExam,
      step: selectedStep,
    });
  }

  // App.css pins this wrapper to the viewport with `overflow: hidden`, which
  // clipped anything past the fold — the deploy row and the join-by-code
  // field, on a short window. Everything here scrolls now; the modifier
  // outranks that rule (see .play-page-wrapper--scroll in PlayPage.css).
  const wrapperClass = 'play-page-wrapper play-page-wrapper--scroll';

  return (
    <div
      className={wrapperClass}
      style={{
        backgroundImage: playBgImage ? `url(${playBgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ── The arena: embers over a vignette, drawn in CSS so the page
             still weighs nothing. ─────────────────────────────────────── */}
      <div className="arena-bg" aria-hidden="true">
        <span className="arena-glow" />
        <span className="arena-floor" />
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className={`arena-ember arena-ember--${i % 7}`} />
        ))}
      </div>

      {/* Leave sits in the top-left corner, where the wordmark used to be.
          The wordmark was decoration on a page you arrive at from inside the
          app — the one control you always want here is the way out. */}
      <div className="arena-top">
        <button type="button" className="arena-exit" onClick={onBack}>← Leave</button>
        <div className="arena-player">
          <div className="arena-player-avatar">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={username} referrerPolicy="no-referrer" />
              : <span>{username?.[0]?.toUpperCase() || '?'}</span>}
            {user?.level != null && <span className="arena-player-lvl">{user.level}</span>}
          </div>
          <div className="arena-player-text">
            <span className="arena-player-name">{username || 'Challenger'}</span>
            {user?.level != null ? (
              <span className="arena-player-xp">
                <i style={{ width: `${Math.min(100, ((user.xp || 0) % 500) / 5)}%` }} />
                <small>{(user.xp || 0) % 500} / 500 XP</small>
              </span>
            ) : (
              <span className="arena-player-guest">Playing as a guest</span>
            )}
          </div>
        </div>
      </div>

      <div className="pp-col arena-col">
        <header className="arena-head">
          <span className="arena-kicker">Online</span>
          <h1 className="arena-title">Enter the Arena</h1>
          <div className="arena-rule" aria-hidden="true"><span /><i>⚔</i><span /></div>
          <p className="arena-sub">Pick your battlefield, then call the field together.</p>
        </header>

        {selectedMode === 'anking' ? (
          <div className="pp-anking">
            <AnKingMode
              user={user}
              config={{ limit: 20 }}
              onBack={() => setSelectedMode('battle_royale')}
              onComplete={() => setSelectedMode('battle_royale')}
            />
          </div>
        ) : (
          <>
            {/* ── The card wall ─────────────────────────────────────────
                   Each card says the whole of what its mode is — no sheet to
                   open, nothing hidden behind a second click. Clicking one
                   simply chooses that battlefield. Every card is built from
                   the same frame and type scale; what makes each its own is
                   its colour, its emblem and the art behind it (data-mode in
                   PlayPageArena.css). ─────────────────────────────────── */}
            <div className="arena-grid">
              {GAME_MODES.map((mode, i) => {
                // Admin config wins; a mode it says nothing about falls back
                // to its own comingSoon flag.
                const isEnabled = gameModesConfig[mode.id]?.enabled ?? !mode.comingSoon;
                const active = selectedMode === mode.id;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    data-mode={mode.id}
                    className={`arena-card${active ? ' is-active' : ''}${isEnabled ? '' : ' is-locked'}`}
                    style={{ '--ac': mode.accent || '214, 161, 63', '--d': `${0.06 * i}s` }}
                    onClick={() => { if (isEnabled) setSelectedMode(mode.id); }}
                    aria-pressed={active}
                    disabled={!isEnabled}
                  >
                    <span className="arena-card-art" aria-hidden="true" />
                    <span className="arena-card-sheen" aria-hidden="true" />
                    <span className="arena-card-rail" aria-hidden="true" />
                    {/* Locked is said with a badge, not by draining the card's
                        colour — greying five of six made the whole wall look
                        like one repeated card. */}
                    {!isEnabled && <span className="arena-card-soon">Soon</span>}
                    <span className="arena-card-head">
                      <span className="arena-card-medal" aria-hidden="true">{mode.icon}</span>
                      <span className="arena-card-titles">
                        <span className="arena-card-name">{mode.name}</span>
                        <span className="arena-card-meta">{mode.meta}</span>
                      </span>
                    </span>
                    <span className="arena-card-tag">{mode.tagline || mode.shortDesc}</span>
                    <span className="arena-card-desc">{mode.longDescription}</span>
                    {mode.facts && (
                      <span className="arena-card-facts">
                        {mode.facts.map(f => <span className="arena-card-fact" key={f}>{f}</span>)}
                      </span>
                    )}
                    <span className="arena-card-foot">
                      {!isEnabled
                        ? <><span aria-hidden="true">🔒</span> Coming soon</>
                        : active
                          ? <><span aria-hidden="true">✓</span> Selected — deploy below</>
                          : 'Choose this battlefield'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Deploy ──────────────────────────────────────────────── */}
            <div className="arena-deploy">
              <button type="button" className="arena-go" onClick={handleCreateLobby}>
                <span className="arena-go-icon" aria-hidden="true">⚔️</span>
                <span className="arena-go-text">
                  <strong>CREATE LOBBY</strong>
                  <small>Open a room and invite the field</small>
                </span>
                <span className="arena-go-chev" aria-hidden="true">›</span>
              </button>
              <button type="button" className="arena-quick" onClick={handleQuickJoinClick}>
                <span aria-hidden="true">🔍</span> QUICK JOIN
                <small>Drop into the first open room</small>
              </button>
            </div>

            {error && <p className="pp-error">{error}</p>}

            <div className="arena-code">
              <label className="arena-code-label" htmlFor="arena-code-input">Join by code</label>
              <div className="arena-code-row">
                <input
                  id="arena-code-input"
                  className="arena-code-input"
                  placeholder="ABC123"
                  value={lobbyCode}
                  onChange={e => {
                    setLobbyCode(e.target.value.toUpperCase());
                    setJoinError('');
                    if (onClearError) onClearError();
                  }}
                  maxLength={8}
                  onKeyDown={e => e.key === 'Enter' && lobbyCode.trim() && handleJoinLobby()}
                />
                <button
                  type="button"
                  className="arena-code-btn"
                  onClick={handleJoinLobby}
                  disabled={!lobbyCode.trim()}
                >JOIN →</button>
              </div>
              {joinError && <p className="join-lobby-error">{joinError}</p>}
            </div>
          </>
        )}
      </div>

      {/* ── PVP MATCHMAKING OVERLAY ────────────────────────────────────────
          Replaces the lobby panel for a PvP Arenas quick join: the duel
          auto-starts the moment a second player arrives, so the lobby's
          code/start-button UI is never actionable in that flow anyway. */}
      {mmSearching && (
        <div className="pp-mm">
          {mmFound ? (
            <>
              <h2 className="pp-mm-title">MATCH FOUND</h2>
              <div className="pp-mm-found">
                {mmPlayers.slice(0, 2).map((p, i) => (
                  <Fragment key={p.id ?? i}>
                    {i > 0 && <span className="pp-mm-vs">VS</span>}
                    <div className="pp-mm-player">
                      {/* lobbyPayload carries no avatar_url, so only the local
                          player has a picture to show; everyone else falls back
                          to their real initial rather than a stock face. */}
                      <div className="pp-mm-avatar">
                        {p.username === username && user?.avatar_url
                          ? <img src={user.avatar_url} alt={p.username} referrerPolicy="no-referrer" />
                          : <span>{p.username?.[0]?.toUpperCase() || '?'}</span>}
                      </div>
                      <span className="pp-mm-name">{p.username}</span>
                    </div>
                  </Fragment>
                ))}
              </div>
              <p className="pp-mm-sub">Rival found — taking you to the lobby…</p>
            </>
          ) : (
            <>
              <div className="pp-mm-ring" />
              <h2 className="pp-mm-title">SEARCHING FOR MATCH…</h2>
              <p className="pp-mm-sub">Waiting for a rival healer to answer the call.</p>
              <button type="button" className="pp-mm-cancel" onClick={handleCancelSearch}>
                Cancel search
              </button>
            </>
          )}
        </div>
      )}

      {/* ── LOBBY OVERLAY — shows when a lobby is active ───────────────────── */}
      {lobbyId && !mmSearching && (
        <div className="lobby-overlay">
          {/* A duel lobby carries a whole settings sheet as well as the code,
              the players and the start button. On a wide screen it gets two
              columns instead of one tall scroll; the modifier is what the
              layout in PlayPageArena.css keys off. */}
          <div className="lobby-panel lobby-panel--duel">

            {/* Header */}
            <div className="lobby-panel-header">
              <div className="lobby-panel-title">
                <span>{lobbyModeData?.icon || '⚔️'}</span>
                <h2>{lobbyModeData?.name || 'LOBBY'}</h2>
              </div>
              <button className="lobby-close-btn" onClick={onLeaveLobby}>✕ Leave</button>
            </div>

            {/* Lobby Code */}
            <div className="lobby-code-section">
              <p className="lobby-code-label">LOBBY CODE — SHARE WITH FRIENDS</p>
              <div className="lobby-code-box">
                <span className="lobby-code-text">{lobbyId}</span>
                <button
                  className="lobby-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(lobbyId);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Players */}
            <div className="lobby-players-section">
              <p className="lobby-players-count">
                {lobbyPlayers?.length || 1} / {lobbyGameMode === 'medjinx' ? 20 : '∞'} players joined
              </p>
              <div className="lobby-players-list">
                {(lobbyPlayers || [{ username: username, isHost: true }]).map((player, i) => (
                  <div className="lobby-player-row" key={i}>
                    <span className="lobby-player-num">#{i + 1}</span>
                    <span className="lobby-player-name">{player.username}</span>
                    {player.isHost && <span className="lobby-host-badge">HOST</span>}
                    {player.isBot && <span className="lobby-bot-badge">BOT</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── The duel's own settings ──────────────────────────────
                Shown in every duel lobby, editable only by the host: the
                player who JOINS needs to know what they are walking into as
                much as the host needs to choose it. A duel is the one mode
                where the pool is a real decision — the others draw from the
                general bank by design.

                MedJinx is the exception to all of it: its own bank, its own
                settings, and none of the rows below mean anything to it. */}
            {lobbyGameMode === 'medjinx' ? (
              <MedJinxLobby isHost={isHost} options={medjinxOptions} onChange={onMedjinxOptions} />
            ) : (
              <div className="lobby-duel-section">
                <p className="lobby-duel-title">
                  {isHost ? (isDuel ? 'Duel settings' : 'Match settings') : 'The host has set'}
                </p>

                <div className="lobby-duel-row">
                  <span className="lobby-duel-label">Questions from</span>
                  {isHost ? (
                    <select
                      className="lobby-duel-select"
                      value={duelSource}
                      onChange={(e) => onDuelOptions?.({ ...duelOptions, source: e.target.value })}
                    >
                      {DUEL_SOURCES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="lobby-duel-value">
                      {DUEL_SOURCES.find(s => s.id === duelSource)?.label}
                    </span>
                  )}
                </div>

                {/* ── Which way through the Journey ──────────────────────
                    The Journey has two question sets over the same chapters:
                    Thorough, everything written, and Rapid, the short one.
                    A match drawn from it has to say which, or it would be
                    drawing from whichever one happened to be the default. */}
                {duelIsJourney && (
                  <div className="lobby-duel-row">
                    <span className="lobby-duel-label">Question set</span>
                    {isHost ? (
                      <div className="lobby-duel-choice">
                        <button
                          type="button"
                          className={`lobby-duel-chip${(duelOptions?.journeyTrack || 'full') === 'full' ? ' is-on' : ''}`}
                          onClick={() => onDuelOptions?.({ ...duelOptions, journeyTrack: 'full' })}
                        >
                          📖 Thorough
                        </button>
                        <button
                          type="button"
                          className={`lobby-duel-chip${duelOptions?.journeyTrack === 'rapid' ? ' is-on' : ''}`}
                          onClick={() => onDuelOptions?.({ ...duelOptions, journeyTrack: 'rapid' })}
                        >
                          ⚡ Rapid
                        </button>
                      </div>
                    ) : (
                      <span className="lobby-duel-value">
                        {duelOptions?.journeyTrack === 'rapid' ? 'Rapid — the short set' : 'Thorough — the full set'}
                      </span>
                    )}
                  </div>
                )}

                {/* How a duel is won, how long it runs, whether the ability
                    dock and the explanations appear — all of it is duel
                    machinery. The other modes have their own rules and only
                    share the question-source part above. */}
                {isDuel && (
                <div className="lobby-duel-row">
                  <span className="lobby-duel-label">Won by</span>
                  {isHost ? (
                    <div className="lobby-duel-choice">
                      <button
                        type="button"
                        className={`lobby-duel-chip${(duelOptions?.winBy || 'hp') === 'hp' ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, winBy: 'hp' })}
                      >
                        Last one standing
                      </button>
                      <button
                        type="button"
                        className={`lobby-duel-chip${duelOptions?.winBy === 'rounds' ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, winBy: 'rounds' })}
                      >
                        Set questions
                      </button>
                    </div>
                  ) : (
                    <span className="lobby-duel-value">
                      {duelOptions?.winBy === 'rounds'
                        ? `${duelOptions?.rounds || 10} questions`
                        : 'Last one standing'}
                    </span>
                  )}
                </div>
                )}

                {isDuel && duelOptions?.winBy === 'rounds' && isHost && (
                  <div className="lobby-duel-row">
                    <span className="lobby-duel-label">How many</span>
                    <div className="lobby-duel-choice">
                      {[5, 10, 15, 20].map(n => (
                        <button
                          key={n}
                          type="button"
                          className={`lobby-duel-chip${(duelOptions?.rounds || 10) === n ? ' is-on' : ''}`}
                          onClick={() => onDuelOptions?.({ ...duelOptions, rounds: n })}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Narrowing a Journey match ─────────────────────────
                    Subject, then a chapter inside it, then a level inside
                    that — each step appearing only once the one above it
                    has been made, because each only means anything inside
                    the last. This replaces the systems row rather than
                    sitting beside it: the Journey's questions carry no
                    system of their own, so narrowing by both would filter
                    every one of them out. */}
                {duelIsJourney && (
                  <div className="lobby-duel-row lobby-duel-row--stack">
                    <span className="lobby-duel-label">Subject</span>
                    {isHost ? (
                      <div className="lobby-duel-subjects">
                        <button
                          type="button"
                          className={`lobby-duel-chip${!journeySubject ? ' is-on' : ''}`}
                          onClick={() => pickJourneySubject(null)}
                        >
                          Every subject
                        </button>
                        {journeySubjects.map(sub => (
                          <button
                            key={sub.id}
                            type="button"
                            className={`lobby-duel-chip${journeySubject === sub.id ? ' is-on' : ''}`}
                            aria-pressed={journeySubject === sub.id}
                            onClick={() => pickJourneySubject(sub.id)}
                          >
                            {sub.name}
                          </button>
                        ))}
                        {journeySubjects.length === 0 && (
                          <span className="lobby-duel-value">No subjects to choose from</span>
                        )}
                      </div>
                    ) : (
                      <span className="lobby-duel-value">
                        {journeySubject
                          ? (journeySubjects.find(x => x.id === journeySubject)?.name || journeySubject)
                          : 'Every subject'}
                      </span>
                    )}
                  </div>
                )}

                {/* A chapter is a chapter OF a subject, so this waits for
                   one. Chapter names repeat across subjects — six called
                   "Embryology" in one flat list told you nothing. */}
                {duelIsJourney && journeySubject && (
                  <div className="lobby-duel-row lobby-duel-row--stack">
                    <span className="lobby-duel-label">Chapter</span>
                    {isHost ? (
                      <div className="lobby-duel-subjects">
                        <button
                          type="button"
                          className={`lobby-duel-chip${!journeyChapterId ? ' is-on' : ''}`}
                          onClick={() => pickJourneyChapter(null)}
                        >
                          Every chapter
                        </button>
                        {journeyChapters.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            className={`lobby-duel-chip${journeyChapterId === c.id ? ' is-on' : ''}`}
                            aria-pressed={journeyChapterId === c.id}
                            onClick={() => pickJourneyChapter(c.id)}
                          >
                            {c.name}
                          </button>
                        ))}
                        {journeyChapters.length === 0 && (
                          <span className="lobby-duel-value">That subject has no chapters yet</span>
                        )}
                      </div>
                    ) : (
                      <span className="lobby-duel-value">
                        {journeyChapterId ? chapterName(journeyChapterId) : 'Every chapter'}
                      </span>
                    )}
                  </div>
                )}

                {/* And a level is a level OF a chapter. "All levels" is the
                   whole chapter, which is what it was before this existed. */}
                {duelIsJourney && journeyChapterId && (
                  <div className="lobby-duel-row lobby-duel-row--stack">
                    <span className="lobby-duel-label">Level</span>
                    {isHost ? (
                      <div className="lobby-duel-subjects">
                        <button
                          type="button"
                          className={`lobby-duel-chip${!duelOptions?.levelId ? ' is-on' : ''}`}
                          onClick={() => onDuelOptions?.({ ...duelOptions, levelId: null })}
                        >
                          All levels
                        </button>
                        {levels.map(l => (
                          <button
                            key={l.id}
                            type="button"
                            className={`lobby-duel-chip${duelOptions?.levelId === l.id ? ' is-on' : ''}`}
                            aria-pressed={duelOptions?.levelId === l.id}
                            onClick={() => onDuelOptions?.({ ...duelOptions, levelId: l.id })}
                          >
                            {l.name}
                          </button>
                        ))}
                        {levels.length === 0 && (
                          <span className="lobby-duel-value">That chapter has no levels yet</span>
                        )}
                      </div>
                    ) : (
                      <span className="lobby-duel-value">
                        {duelOptions?.levelId ? levelName(duelOptions.levelId) : 'All levels'}
                      </span>
                    )}
                  </div>
                )}

                {/* ── Which systems ──────────────────────────────────
                    A duel used to take whatever the pool held. Picking one
                    system makes it a cardiology duel; picking several mixes
                    exactly those; picking none is everything, which is what
                    it always was. Shown as chips rather than a multi-select
                    because "which of these am I on" has to be readable at a
                    glance by the player who did not choose it. */}
                {!duelIsJourney && (
                <div className="lobby-duel-row lobby-duel-row--stack">
                  <span className="lobby-duel-label">Systems</span>
                  {isHost ? (
                    <div className="lobby-duel-subjects">
                      <button
                        type="button"
                        className={`lobby-duel-chip${!duelSubjects.length ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, subjects: [] })}
                      >
                        Everything
                      </button>
                      {subjects.map(sub => {
                        const on = duelSubjects.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            className={`lobby-duel-chip${on ? ' is-on' : ''}`}
                            aria-pressed={on}
                            onClick={() => onDuelOptions?.({
                              ...duelOptions,
                              subjects: on
                                ? duelSubjects.filter(x => x !== sub.id)
                                : [...duelSubjects, sub.id],
                            })}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                      {subjects.length === 0 && (
                        <span className="lobby-duel-value">Loading systems…</span>
                      )}
                    </div>
                  ) : (
                    <span className="lobby-duel-value">
                      {duelSubjects.length
                        ? duelSubjects.map(id => subjectName(id)).join(', ')
                        : 'Every system'}
                    </span>
                  )}
                </div>
                )}

                {/* ── Powers ────────────────────────────────────────────── */}
                {isDuel && (
                <div className="lobby-duel-row">
                  <span className="lobby-duel-label">Powers</span>
                  {isHost ? (
                    <div className="lobby-duel-choice">
                      <button
                        type="button"
                        className={`lobby-duel-chip${duelOptions?.powers !== false ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, powers: true })}
                      >
                        On
                      </button>
                      <button
                        type="button"
                        className={`lobby-duel-chip${duelOptions?.powers === false ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, powers: false })}
                      >
                        Off
                      </button>
                    </div>
                  ) : (
                    <span className="lobby-duel-value">
                      {duelOptions?.powers === false ? 'Off' : 'On'}
                    </span>
                  )}
                </div>
                )}

                {/* ── Explanations ─────────────────────────────────────── */}
                {isDuel && (
                <div className="lobby-duel-row">
                  <span className="lobby-duel-label">Explanations</span>
                  {isHost ? (
                    <div className="lobby-duel-choice">
                      <button
                        type="button"
                        className={`lobby-duel-chip${duelOptions?.explanations !== false ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, explanations: true })}
                      >
                        Show them
                      </button>
                      <button
                        type="button"
                        className={`lobby-duel-chip${duelOptions?.explanations === false ? ' is-on' : ''}`}
                        onClick={() => onDuelOptions?.({ ...duelOptions, explanations: false })}
                      >
                        Skip them
                      </button>
                    </div>
                  ) : (
                    <span className="lobby-duel-value">
                      {duelOptions?.explanations === false ? 'Not shown' : 'Shown between rounds'}
                    </span>
                  )}
                </div>
                )}

                {isDuel && (
                <p className="lobby-duel-note">
                  {(duelOptions?.winBy || 'hp') === 'hp'
                    ? 'Both start on 100 HP. The first correct answer each round strikes for 5 — the duel ends when someone hits zero.'
                    : `${duelOptions?.rounds || 10} questions, then most damage dealt wins. A knockout still ends it early.`}
                </p>
                )}
                {isDuel && (
                <p className="lobby-duel-note">
                  {duelOptions?.explanations === false
                    ? 'No explanations — the next question comes straight away.'
                    : 'Either of you can call the explanation short; it moves on when you both have.'}
                  {duelOptions?.powers === false
                    ? ' The ability dock is hidden.'
                    : ' The ability dock is shown (display only for now).'}
                </p>
                )}
                {!isDuel && (
                  <p className="lobby-duel-note">
                    {duelSource === 'default'
                      ? `${lobbyModeData?.name || 'This mode'} plays its own questions. Pick another set above and the whole match is drawn from that instead.`
                      : 'Everyone in the match answers from this set. If it turns out too thin to play, the mode falls back to its usual questions.'}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="lobby-actions-section">
              {isHost && (
                <button className="lobby-add-bot-btn" onClick={() => onAddBot('hard')}>
                  🤖 Add Bot
                </button>
              )}

              {isHost ? (
                <button
                  className={`lobby-start-btn ${(lobbyPlayers?.length || 1) < 2 ? 'lobby-start-btn--waiting' : 'lobby-start-btn--ready'}`}
                  onClick={onStartGame}
                  disabled={(lobbyPlayers?.length || 1) < 2}
                >
                  {(lobbyPlayers?.length || 1) < 2 ? '⏳ Waiting for players...' : '⚔️ Start Game!'}
                </button>
              ) : (
                <div className="lobby-waiting-msg">
                  <span>⏳ Waiting for host to start...</span>
                </div>
              )}

              {(lobbyPlayers?.length || 1) < 2 && (
                <p className="lobby-min-players">Need at least 2 players (or add a bot)</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
