import { useState, useEffect, Fragment } from 'react';
import { authFetch } from '../auth';
import './PlayPage.css';
import './PlayPageArena.css';
import { cachedImageMap, rememberImageMap } from '../utils/cachedImages';
import AnKingMode from './AnKingMode';

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
    longDescription: 'A marathon across fifteen systems — five questions from each, from Cardio to Microbiology. Everyone races the same run at their own pace: every correct answer scores, and the faster you answer the bigger the bonus on top. Watch the field move on the live track and take the lead. You are told only right or wrong — and when you are wrong, which answer was right.',
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

// Launched from Story Mode (via the initialMode prop), not listed as Online tiles.
const STORY_MODES = [
  {
    id: 'anking',
    name: 'ANKING',
    icon: '🃏',
    shortDesc: 'Master AnKing flashcards',
    longDescription: 'Study and master AnKing flashcards. Flip cards, test your knowledge, and track your progress through the entire AnKing deck.',
    supportsSolo: true,
  },
];

export default function PlayPage({
  user, username, onModeSelect, onBack, error, onClearError,
  lobbyId, lobbyPlayers, isHost, lobbySubject, lobbyGameMode, openToQuickJoin,
  onStartGame, onAddBot, onRemoveBot, onToggleQuickJoin, onLeaveLobby,
  initialMode
}) {
  // Default preserves the existing behavior exactly (Online passes no initialMode)
  const [selectedMode, setSelectedMode] = useState(initialMode || 'battle_royale');
  const [squadSize, setSquadSize] = useState('solo');
  // Exam board + difficulty values: the visible picker UI is gone, but the
  // underlying defaults must still flow into lobby-creation calls exactly as
  // before (App currently destructures but doesn't consume them; kept so the
  // payload shape is unchanged and nothing silently breaks).
  const [selectedExam] = useState('usmle');
  const [selectedStep] = useState('step1');
  const [fillTeam] = useState(false);
  const [gameModesConfig, setGameModesConfig] = useState({});
  const [playBgImage, setPlayBgImage] = useState(() => cachedImageMap('play').play_page_background || '');
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [ownedGear, setOwnedGear] = useState([]);
  const [gearLoading, setGearLoading] = useState(false);

  // Whatever is selected, whether or not it has a tile: Story Mode opens
  // AnKing through this page, and its briefing comes from STORY_MODES.
  const selectedModeData = [...GAME_MODES, ...STORY_MODES].find(m => m.id === selectedMode) || null;
  const lobbyModeData = GAME_MODES.find(m => m.id === (lobbyGameMode || selectedMode)) || null;

  // PvP Duel is 1v1-only today, so Duo/Squad party sizes don't apply to it.
  const duelSelected = selectedMode === 'pvp_duel';

  // Keep the (UI-only) squad size honest for the duel: force Solo when the
  // 1v1 mode is selected so a stale Duo/Squad choice can't linger visually.
  useEffect(() => {
    if (duelSelected && squadSize !== 'solo') setSquadSize('solo');
  }, [duelSelected, squadSize]);

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

  // Fetch owned gear for the read-only Loadout bar (real Shop endpoint).
  // Gear is collection-only — it has no gameplay effect (locked decision).
  useEffect(() => {
    async function loadGear() {
      if (!user?.id) { setOwnedGear([]); return; }
      setGearLoading(true);
      try {
        const res = await authFetch(`/api/users/${user.id}/gear`);
        const data = await res.json();
        setOwnedGear(Array.isArray(data.gear) ? data.gear : []);
      } catch {
        setOwnedGear([]);
      }
      setGearLoading(false);
    }
    loadGear();
  }, [user]);

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

  // AnKing cards run far past the viewport — several images in the Extra field
  // is normal — and this wrapper is a fixed, clipped box. Opt that one mode into
  // scrolling; see .play-page-wrapper--scroll in PlayPage.css.
  const wrapperClass = `play-page-wrapper${selectedMode === 'anking' ? ' play-page-wrapper--scroll' : ''}`;

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

      <div className="arena-top">
        <a className="arena-wordmark" href="/dashboard">MEDVALE</a>
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
            {/* ── The card wall ───────────────────────────────────────── */}
            <div className="arena-grid">
              {GAME_MODES.map((mode, i) => {
                const isEnabled = gameModesConfig[mode.id]?.enabled ?? true;
                const active = selectedMode === mode.id;
                return (
                  <button
                    type="button"
                    key={mode.id}
                    className={`arena-card${active ? ' is-active' : ''}${isEnabled ? '' : ' is-locked'}`}
                    style={{ '--ac': mode.accent || '214, 161, 63', '--d': `${0.06 * i}s` }}
                    onClick={() => isEnabled && setSelectedMode(mode.id)}
                    aria-pressed={active}
                    aria-disabled={!isEnabled}
                    disabled={!isEnabled}
                  >
                    <span className="arena-card-sheen" aria-hidden="true" />
                    <span className="arena-card-medal" aria-hidden="true">{mode.icon}</span>
                    <span className="arena-card-name">{mode.name}</span>
                    <span className="arena-card-tag">{mode.tagline || mode.shortDesc}</span>
                    <span className="arena-card-meta">{mode.meta}</span>
                    {!isEnabled && <span className="arena-card-lock">🔒 Coming soon</span>}
                    {active && <span className="arena-card-flag" aria-hidden="true">SELECTED</span>}
                  </button>
                );
              })}
            </div>

            {/* ── The briefing for whatever is selected ───────────────── */}
            {selectedModeData && (
              <section
                className="arena-brief"
                key={selectedModeData.id}
                style={{ '--ac': selectedModeData.accent || '214, 161, 63' }}
              >
                <div className="arena-brief-head">
                  <span className="arena-brief-icon" aria-hidden="true">{selectedModeData.icon}</span>
                  <div>
                    <h2 className="arena-brief-name">{selectedModeData.name}</h2>
                    <span className="arena-brief-meta">{selectedModeData.meta}</span>
                  </div>
                </div>
                <p className="arena-brief-desc">{selectedModeData.longDescription}</p>
                {selectedModeData.facts && (
                  <ul className="arena-facts">
                    {selectedModeData.facts.map(f => <li key={f}>{f}</li>)}
                  </ul>
                )}
              </section>
            )}

            {/* ── Kit: party size and loadout, side by side ───────────── */}
            <div className="arena-kit">
              <div className="arena-kit-block">
                <span className="arena-kit-label">Party</span>
                <div className="arena-squad">
                  {[['solo', '👤', 'SOLO'], ['duo', '👥', 'DUO'], ['squad', '🛡️', 'SQUAD']].map(([key, icon, label]) => {
                    const locked = duelSelected && key !== 'solo';
                    return (
                      <button
                        type="button"
                        key={key}
                        className={`arena-squad-btn${squadSize === key ? ' is-on' : ''}${locked ? ' is-locked' : ''}`}
                        onClick={() => !locked && setSquadSize(key)}
                        disabled={locked}
                        title={locked ? 'PvP Arenas is 1v1 only' : ''}
                      >
                        <span aria-hidden="true">{locked ? '🔒' : icon}</span> {label}
                      </button>
                    );
                  })}
                </div>
                {duelSelected && <p className="arena-kit-note">PvP Arenas is 1v1 — Duo and Squad are coming soon.</p>}
              </div>

              <div className="arena-kit-block">
                <span className="arena-kit-label">Loadout</span>
                <div className="arena-loadout">
                  <span className="arena-loadout-thumb" aria-hidden="true" />
                  <span className="arena-loadout-text">
                    {gearLoading
                      ? 'Loading loadout…'
                      : ownedGear.length > 0
                        ? ownedGear.slice(0, 3).map(g => g.name).join(' · ')
                        : 'No gear collected yet'}
                  </span>
                  <a className="arena-loadout-link" href="/shop">Shop →</a>
                </div>
                <p className="arena-kit-note">Gear is a collection — it changes nothing in a match.</p>
              </div>
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
              <p className="pp-mm-sub">Entering the arena…</p>
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
          <div className="lobby-panel">

            {/* Header */}
            <div className="lobby-panel-header">
              {/* The lobby's OWN mode, not whatever is selected on the page
                  behind it: joining by code puts you in someone else's room. */}
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
              <p className="lobby-players-count">{lobbyPlayers?.length || 1} / ∞ players joined</p>
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
