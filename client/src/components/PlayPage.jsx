import { useState, useEffect, Fragment } from 'react';
import { authFetch } from '../auth';
import './PlayPage.css';
import AnKingMode from './AnKingMode';

const GAME_MODES = [
  {
    id: 'battle_royale',
    name: 'BATTLE ROYALE',
    icon: '💀',
    shortDesc: 'Last doctor standing wins',
    meta: 'Multiplayer',
    longDescription: 'Drop into the medical arena. Wrong answers cost lives. Outlast every other player through skill and knowledge. Strategy and speed will lead you to victory.',
    supportsSolo: false,
  },
  {
    id: 'speed_race',
    name: 'SPEED RACE',
    icon: '🏁',
    shortDesc: 'First to 20 correct answers wins',
    meta: 'Multiplayer',
    longDescription: 'Race against the clock and your opponents. Answer 20 questions correctly as fast as possible. No lives lost, just pure speed and accuracy.',
    supportsSolo: false,
  },
  {
    id: 'trivia_pursuit',
    name: 'TRIVIA PURSUIT',
    icon: '🎯',
    shortDesc: 'Collect all 6 subject wedges',
    meta: 'Multiplayer',
    longDescription: 'Take turns answering questions across 6 medical subjects. Earn a wedge for each correct answer. First player to collect all 6 subject wedges wins the game.',
    supportsSolo: false,
  },
  {
    id: 'scan_master',
    name: 'SCAN MASTER',
    icon: '🔬',
    shortDesc: 'Identify conditions from medical images',
    meta: 'Multiplayer',
    longDescription: 'Study real medical images including ECGs, X-rays, histology slides, and dermatology photos. Last doctor standing wins through visual diagnosis mastery.',
    supportsSolo: false,
  },
  {
    id: 'buzz_fun',
    name: 'BUZZ FUN',
    icon: '⚡',
    shortDesc: 'Buzzwords, triads & classic HY facts',
    meta: 'Multiplayer',
    longDescription: 'Fast-paced flash cards of buzzwords, triads, side effects and classic high-yield associations. 8 seconds each — fast answers earn bonus points!',
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
  const [playBgImage, setPlayBgImage] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [ownedGear, setOwnedGear] = useState([]);
  const [gearLoading, setGearLoading] = useState(false);

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

  return (
    <div
      className="play-page-wrapper"
      style={{
        backgroundImage: playBgImage ? `url(${playBgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ── Page chrome: MEDVALE wordmark + currency pills + avatar ────────── */}
      <div className="pp-topbar">
        <a className="pp-wordmark" href="/dashboard">MEDVALE</a>
        <div className="pp-topbar-right">
          <div className="pp-currency" aria-label="Currency">
            <span className="pp-currency-item">🪙 {user?.coins ?? 0}</span>
            <span className="pp-currency-divider" aria-hidden="true" />
            <span className="pp-currency-item">💎 {user?.gems ?? 0}</span>
          </div>
          <div className="pp-avatar" title={username || 'Player'}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={username} referrerPolicy="no-referrer" />
              : <span>{username?.[0]?.toUpperCase() || '?'}</span>}
          </div>
        </div>
      </div>

      <div className="pp-col">
        <button type="button" className="pp-back pp-rise" onClick={onBack}>← Back to Dashboard</button>
        <h1 className="pp-title pp-rise" style={{ '--pp-delay': '0.04s' }}>Deploy</h1>
        <p className="pp-subtitle pp-rise" style={{ '--pp-delay': '0.1s' }}>Choose your battlefield.</p>

        {selectedMode === 'anking' ? (
          <div className="pp-anking">
            <AnKingMode
              user={user}
              config={{ limit: 20 }}
              onBack={() => setSelectedMode('battle_royale')}
              onComplete={(results) => console.log('AnKing session complete:', results)}
            />
          </div>
        ) : (
          <>
            {/* ── Mode grid ─────────────────────────────────────────────── */}
            <div className="pp-mode-grid pp-rise" style={{ '--pp-delay': '0.16s' }}>
              {GAME_MODES.map(mode => {
                const isEnabled = gameModesConfig[mode.id]?.enabled ?? true;
                const active = selectedMode === mode.id;
                return (
                  <div
                    key={mode.id}
                    className={`pp-mode-card${active ? ' pp-mode-card--active' : ''}${!isEnabled ? ' pp-mode-card--disabled' : ''}`}
                    onClick={() => isEnabled && setSelectedMode(mode.id)}
                    role="button"
                    tabIndex={isEnabled ? 0 : -1}
                    aria-pressed={active}
                    aria-disabled={!isEnabled}
                    onKeyDown={e => {
                      if (isEnabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedMode(mode.id);
                      }
                    }}
                  >
                    {!isEnabled && <span className="pp-soon-chip">COMING SOON</span>}
                    <div className="pp-mode-icon">{mode.icon}</div>
                    <div className="pp-mode-name">{mode.name}</div>
                    <div className="pp-mode-desc">{mode.shortDesc}</div>
                    {mode.meta && <div className="pp-mode-meta">{mode.meta}</div>}
                  </div>
                );
              })}
            </div>

            {/* ── Squad Size (Fill Team toggle intentionally dropped) ────── */}
            <div className="squad-section pp-block pp-rise" style={{ '--pp-delay': '0.24s' }}>
              <label className="squad-label">SQUAD SIZE</label>
              <div className="squad-options">
                <button
                  className={squadSize === 'solo' ? 'squad-btn active' : 'squad-btn'}
                  onClick={() => setSquadSize('solo')}
                >
                  👤 SOLO
                </button>
                <button
                  className={`${squadSize === 'duo' ? 'squad-btn active' : 'squad-btn'}${duelSelected ? ' squad-btn--soon' : ''}`}
                  onClick={() => !duelSelected && setSquadSize('duo')}
                  disabled={duelSelected}
                  title={duelSelected ? 'PvP Arenas is 1v1 only — coming soon' : ''}
                >
                  {duelSelected ? '🔒 DUO' : '👥 DUO'}
                </button>
                <button
                  className={`${squadSize === 'squad' ? 'squad-btn active' : 'squad-btn'}${duelSelected ? ' squad-btn--soon' : ''}`}
                  onClick={() => !duelSelected && setSquadSize('squad')}
                  disabled={duelSelected}
                  title={duelSelected ? 'PvP Arenas is 1v1 only — coming soon' : ''}
                >
                  {duelSelected ? '🔒 SQUAD' : '👥 SQUAD (4)'}
                </button>
              </div>
              {duelSelected && (
                <p className="squad-note">PvP Arenas is 1v1 — Duo & Squad coming soon.</p>
              )}
            </div>

            {/* ── Loadout bar (read-only; gear has no gameplay effect) ───── */}
            <div className="loadout-bar pp-block pp-rise" style={{ '--pp-delay': '0.32s' }}>
              <div className="loadout-thumb" aria-hidden="true" />
              <div className="loadout-info">
                <span className="loadout-items">
                  {gearLoading
                    ? 'Loading loadout…'
                    : ownedGear.length > 0
                      ? ownedGear.slice(0, 3).map(g => g.name).join(' · ')
                      : 'No gear collected yet'}
                </span>
                <span className="loadout-label">Current loadout</span>
              </div>
              <a className="loadout-change" href="/shop">Change Loadout →</a>
            </div>

            {/* ── Deploy CTA (red octagon-cut, full width) ──────────────── */}
            <button
              className="lobby-btn lobby-btn--create pp-deploy pp-rise"
              style={{ '--pp-delay': '0.4s' }}
              onClick={handleCreateLobby}
            >
              <span className="lobby-btn-icon">⚔️</span>
              <div className="lobby-btn-text">
                <span className="lobby-btn-title">CREATE LOBBY</span>
              </div>
            </button>

            {error && <p className="pp-error">{error}</p>}

            {/* ── Preserved: Join by code + Quick Join (no mockup ref) ───── */}
            <div className="pp-secondary">
              <div className="pp-join">
                <label className="pp-mini-label">JOIN BY CODE</label>
                <div className="pp-join-row">
                  <input
                    className="pp-join-input"
                    placeholder="Enter code..."
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
                    className="pp-join-btn"
                    onClick={handleJoinLobby}
                    disabled={!lobbyCode.trim()}
                  >
                    JOIN →
                  </button>
                </div>
                {joinError && <p className="join-lobby-error">{joinError}</p>}
              </div>

              <button className="pp-quick" onClick={handleQuickJoinClick}>
                🔍 QUICK JOIN
              </button>
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
              <div className="lobby-panel-title">
                <span>⚔️</span>
                <h2>{GAME_MODES.find(m => m.id === selectedMode)?.name || 'LOBBY'}</h2>
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
