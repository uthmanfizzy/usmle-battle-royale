import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import socket from './socket';
import * as audio from './audio';
import { getToken, clearToken, fetchMe, getCachedUser, redirectToGoogle } from './auth';
import UsernameEntry from './components/UsernameEntry';
import ExamSelect from './components/ExamSelect';
import DifficultySelect from './components/DifficultySelect';
import LobbySelect from './components/LobbySelect';
import JoinLobbyInput from './components/JoinLobbyInput';
import SubjectSelect from './components/SubjectSelect';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Lazy load heavy components for better initial load performance
const Lobby = lazy(() => import('./components/Lobby'));
const GameRoom = lazy(() => import('./components/GameRoom'));
const SpeedRaceGame = lazy(() => import('./components/SpeedRaceGame'));
const TriviaGame = lazy(() => import('./components/TriviaGame'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const SoloGame = lazy(() => import('./components/SoloGame'));
const TowerMode = lazy(() => import('./components/TowerMode'));
const BuzzFunGame = lazy(() => import('./components/BuzzFunGame'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const TrainingGrounds = lazy(() => import('./components/TrainingGrounds'));
const PlayPage = lazy(() => import('./components/PlayPage'));
const ModeSplit = lazy(() => import('./components/ModeSplit'));
const StoryMenu = lazy(() => import('./components/ModeSplit').then(m => ({ default: m.StoryMenu })));
const JourneyMode = lazy(() => import('./components/JourneyMode'));

// phases: 'loading' | 'entry' | 'exam_select' | 'difficulty_select' | 'mode_split' | 'story_menu' | 'play_page' |
//         'how_to_play' | 'lobby_select' | 'subject_select' | 'lobby_difficulty' | 'join_input' | 'lobby' | 'game' |
//         'game_over' | 'solo_subject' | 'solo_difficulty' | 'solo_game' | 'tower' | 'training_grounds' | 'journey'

export default function App() {
  const [phase,    setPhase]    = useState('loading');
  const [user,     setUser]     = useState(null);   // logged-in Google user
  const [username, setUsername] = useState('');
  const [lobbyId,  setLobbyId]  = useState('');
  const [subject,  setSubject]  = useState('all');
  const [isHost,   setIsHost]   = useState(false);
  const [players,  setPlayers]  = useState([]);
  const [error,    setError]    = useState('');
  const [muted,      setMuted]      = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [gameMode,   setGameMode]   = useState('battle_royale');
  const [soloSubject, setSoloSubject] = useState('all');
  const [soloKey,  setSoloKey]  = useState(0);
  const [trainingTopic, setTrainingTopic] = useState(null);
  // When returning to Training Grounds via game-over "Back to Topics", auto-open the
  // subject whose topic was just practiced (so we land on its topic list, not the grid).
  const [tgInitialSubject, setTgInitialSubject] = useState(null);
  const [journeyContext,  setJourneyContext]  = useState(null); // { subject, levelKey, questionsUrl, levelLabel }
  const [journeyReentry,  setJourneyReentry]  = useState(null); // { pct, subject, levelKey?, questionsUrl?, levelLabel? }
  const [playInitialMode, setPlayInitialMode] = useState(null); // Story→AnKing passes 'anking'; Online leaves null

  const [raceProgress, setRaceProgress] = useState([]);
  const [openToQuickJoin, setOpenToQuickJoin] = useState(true);
  const [streaks, setStreaks] = useState({});
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [showSuddenDeathScreen, setShowSuddenDeathScreen] = useState(false);

  const [triviaState,     setTriviaState]     = useState(null);
  const [triviaResult,    setTriviaResult]    = useState(null);
  const [triviaDiceValue, setTriviaDiceValue] = useState(null);

  // Power-ups
  const [myPowerups,        setMyPowerups]        = useState([]);
  const [usedPowerupThisQ,  setUsedPowerupThisQ]  = useState(false);
  const [isFrozen,          setIsFrozen]          = useState(false);
  const [hiddenOptions,     setHiddenOptions]     = useState([]);
  const [extraTimeBonus,    setExtraTimeBonus]    = useState(0);
  const [showPowerupIntro,  setShowPowerupIntro]  = useState(false);

  // In-game
  const [question,           setQuestion]           = useState(null);
  const [round,              setRound]              = useState(0);
  const [timeLimit,          setTimeLimit]          = useState(20);
  const [myAnswer,           setMyAnswer]           = useState(null);
  const [hasAnswered,        setHasAnswered]        = useState(false);
  const [answeredCount,      setAnsweredCount]      = useState(0);
  const [totalAlive,         setTotalAlive]         = useState(0);
  const [myLives,            setMyLives]            = useState(3);
  const [myScore,            setMyScore]            = useState(0);
  const [isAlive,            setIsAlive]            = useState(true);
  const [answerResult,       setAnswerResult]       = useState(null);
  const [roundResults,       setRoundResults]       = useState(null);
  const [showingRoundResult, setShowingRoundResult] = useState(false);
  const [gameResult,         setGameResult]         = useState(null);

  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  // ── Auth init (runs once on mount) ────────────────────────────────────────

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    const autoPlay  = params.get('play') === '1';
    const autoTraining = params.get('training') === '1';

    if (authError) {
      window.history.replaceState({}, '', '/');
      setError('Google sign-in failed. Please try again.');
      setPhase('entry');
      return;
    }

    const token = getToken();

    if (autoPlay) {
      // Arrived from /dashboard Play Now button → show the Story/Online split
      window.history.replaceState({}, '', '/');
      if (!token) { setPhase('entry'); return; }
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
        setUsername(cached.username);
        connectSocket();
        setPhase('mode_split');
      } else {
        fetchMe().then(me => {
          if (me) { setUser(me); setUsername(me.username); connectSocket(); setPhase('mode_split'); }
          else { setPhase('entry'); }
        });
      }
      return;
    }

    if (autoTraining) {
      // Arrived from /dashboard Training Grounds button → go directly to training grounds
      window.history.replaceState({}, '', '/');
      if (!token) { setPhase('entry'); return; }
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
        setUsername(cached.username);
        connectSocket();
        setPhase('training_grounds');
      } else {
        fetchMe().then(me => {
          if (me) { setUser(me); setUsername(me.username); connectSocket(); setPhase('training_grounds'); }
          else { setPhase('entry'); }
        });
      }
      return;
    }

    if (token) {
      // Logged-in user landing on / → send to /dashboard
      window.location.replace('/dashboard');
      return;
    }

    setPhase('landing');

    // DEBUG: Fetch and log game settings
    fetch('https://usmle-battle-royale-production.up.railway.app/api/game-settings')
      .then(r => r.json())
      .then(data => {
        console.log('========================================');
        console.log('GAME SETTINGS FROM SERVER:');
        console.log('========================================');
        console.log(data);
        console.log('========================================');
        console.log('Hard Mode Settings:');
        console.log('  hardModeEnabled:', data.hardModeEnabled);
        console.log('  hardModeTimer:', data.hardModeTimer);
        console.log('  hardModeExplanationTime:', data.hardModeExplanationTime);
        console.log('  hardModeHideExplanations:', data.hardModeHideExplanations);
        console.log('  hardModeLabel:', data.hardModeLabel);
        console.log('  hardModeDescription:', data.hardModeDescription);
        console.log('========================================');
        console.log('Easy Mode Settings:');
        console.log('  timerDefault:', data.timerDefault);
        console.log('  explanationTime:', data.explanationTime);
        console.log('========================================');
      })
      .catch(e => console.error('FAILED TO FETCH SETTINGS:', e));
  }, []);

  // ── Socket events (register once; connect later when entering game) ───────

  useEffect(() => {
    socket.on('lobby_update', ({ players: ps, hostId, subject: s, gameMode: gm, openToQuickJoin: otqj }) => {
      setPlayers(ps);
      setIsHost(socket.id === hostId);
      if (s) setSubject(s);
      if (gm) setGameMode(gm);
      if (typeof otqj === 'boolean') setOpenToQuickJoin(otqj);
    });

    socket.on('game_start', ({ gameMode: gm }) => {
      setGameMode(gm || 'battle_royale');
      setPhase('game');
      setMyLives(3);
      setMyScore(0);
      setIsAlive(true);
      setQuestion(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
      setRaceProgress([]);
      setTriviaState(null);
      setTriviaResult(null);
      setTriviaDiceValue(null);
      setStreaks({});
      setSuddenDeath(false);
      setShowSuddenDeathScreen(false);
      setMyPowerups([]);
      setUsedPowerupThisQ(false);
      setIsFrozen(false);
      setHiddenOptions([]);
      setExtraTimeBonus(0);
      setShowPowerupIntro(false);
      audio.startGameMusic();
    });

    socket.on('powerup_assigned', ({ powerups }) => {
      setMyPowerups(powerups || []);
      setShowPowerupIntro(true);
      setTimeout(() => setShowPowerupIntro(false), 3000);
    });

    socket.on('powerup_result', (data) => {
      setUsedPowerupThisQ(true);
      setMyPowerups(prev => {
        const copy = [...prev];
        const idx  = copy.indexOf(data.type);
        if (idx !== -1) copy.splice(idx, 1);
        return copy;
      });
      if (data.type === '50_50')     setHiddenOptions(data.hiddenOptions || []);
      if (data.type === 'extra_time') setExtraTimeBonus(prev => prev + (data.bonusSeconds || 0));
      if (data.type === 'skip') { setMyAnswer('__skip__'); setHasAnswered(true); }
      if (data.type === 'double_xp') showToast('⭐ Double XP on your next correct answer!');
      if (data.type === 'freeze')    showToast(`❄️ ${data.targetUsername} frozen for 5 seconds!`);
    });

    socket.on('frozen', ({ duration }) => {
      setIsFrozen(true);
      showToast('❄️ You have been frozen! You cannot answer for 5 seconds.');
      setTimeout(() => setIsFrozen(false), duration);
    });

    socket.on('unfrozen', () => setIsFrozen(false));

    socket.on('sudden_death', () => {
      setSuddenDeath(true);
      setShowSuddenDeathScreen(true);
      setShowingRoundResult(false);
      audio.playWrong(); // reuse for dramatic effect
      setTimeout(() => setShowSuddenDeathScreen(false), 3000);
    });

    socket.on('race_progress', ({ progress }) => {
      setRaceProgress(progress || []);
      if (progress) {
        const s = {};
        progress.forEach(p => { s[p.id] = p.streak || 0; });
        setStreaks(s);
      }
    });

    socket.on('trivia_turn', (data) => {
      setTriviaState(data);
      setTriviaResult(null);
      setHasAnswered(false);
      setMyAnswer(null);
      setTriviaDiceValue(null);
    });

    socket.on('trivia_rolled', (data) => {
      setTriviaDiceValue(data.dice);
      setTriviaState(prev => prev ? {
        ...prev,
        positions:    data.positions,
        category:     data.category,
        isHQ:         data.isHQ,
        canEarnWedge: data.canEarnWedge,
      } : prev);
    });

    socket.on('trivia_question', (data) => {
      setTriviaState(prev => prev ? {
        ...prev,
        question:   data.question,
        category:   data.category,
        timeLimit:  data.timeLimit,
        wedgeState: data.wedgeState || prev.wedgeState,
      } : prev);
    });

    socket.on('trivia_answer_result', (data) => {
      setTriviaResult(data);
      if (data.streaks) setStreaks(data.streaks);
      if (data.onFire && data.playerId === socket.id) showToast('🔥 You\'re on fire!');
      if (data.wedgeState) {
        setTriviaState(prev => prev ? { ...prev, wedgeState: data.wedgeState } : prev);
      }
      if (data.correct) audio.playCorrect();
      else audio.playWrong();
    });

    socket.on('new_question', (data) => {
      setQuestion(data);
      setRound(data.round);
      setTimeLimit(data.timeLimit);
      setMyAnswer(null);
      setHasAnswered(false);
      setAnsweredCount(0);
      setTotalAlive(data.alivePlayers);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
      setUsedPowerupThisQ(false);
      setHiddenOptions([]);
      setExtraTimeBonus(0);
    });

    socket.on('answer_count', ({ answered, total }) => {
      setAnsweredCount(answered);
      setTotalAlive(total);
    });

    socket.on('answer_result', (result) => {
      setAnswerResult(result);
      setMyLives(result.lives);
      setMyScore(result.score);
      setIsAlive(result.alive);
      if (typeof result.streak === 'number') {
        setStreaks(prev => ({ ...prev, [socket.id]: result.streak }));
      }
      if (result.onFire) showToast('🔥 You\'re on fire!');
      if (result.correct) audio.playCorrect();
      else {
        audio.playWrong();
        if (!result.alive) audio.playEliminated();
      }
    });

    socket.on('round_results', (data) => {
      setRoundResults(data);
      setPlayers(data.players);
      setShowingRoundResult(true);
      if (data.players) {
        const s = {};
        data.players.forEach(p => { s[p.id] = p.streak || 0; });
        setStreaks(s);
      }
    });

    socket.on('game_over', (result) => {
      setGameResult(result);
      setPhase('game_over');
      audio.stopGameMusic();
      if (result.winner) audio.playVictory();
      else audio.playEliminated();

      // Refresh user stats silently after XP is awarded
      if (getToken()) {
        setTimeout(() => {
          fetchMe().then(me => { if (me) setUser(me); });
        }, 2000); // wait a moment for server to finish writing XP
      }
    });

    socket.on('game_reset', () => {
      setPhase('lobby');
      setGameResult(null);
      setQuestion(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
      setTriviaState(null);
      setTriviaResult(null);
      setTriviaDiceValue(null);
      setStreaks({});
      setSuddenDeath(false);
      setShowSuddenDeathScreen(false);
      setMyPowerups([]);
      setUsedPowerupThisQ(false);
      setIsFrozen(false);
      setHiddenOptions([]);
      setExtraTimeBonus(0);
      setShowPowerupIntro(false);
      audio.stopGameMusic();
      audio.startBgMusic();
    });

    socket.on('player_left', ({ username: uname }) => {
      showToast(`${uname} left the battle`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      ['lobby_update', 'game_start', 'new_question', 'answer_count',
       'answer_result', 'round_results', 'game_over', 'game_reset',
       'player_left', 'error', 'sudden_death',
       'race_progress', 'trivia_turn', 'trivia_rolled', 'trivia_question', 'trivia_answer_result',
       'powerup_assigned', 'powerup_result', 'frozen', 'unfrozen'].forEach(e => socket.off(e));
      socket.disconnect();
      audio.stopBgMusic();
    };
  }, [showToast]);

  // ── Connect socket with JWT when entering game flow ───────────────────────

  function connectSocket() {
    socket.auth = { token: getToken() };
    if (!socket.connected) socket.connect();
  }

  // ── Emit user_online event when user is logged in ──────────────────────

  useEffect(() => {
    if (user?.id && socket.connected) {
      socket.emit('user_online', user.id);
    }
  }, [user, socket.connected]);

  // ── Auth handlers ─────────────────────────────────────────────────────────

  function handleGoogleLogin() {
    redirectToGoogle();
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setUsername('');
    socket.disconnect();
    audio.stopBgMusic();
    audio.stopGameMusic();
    setPhase('entry');
  }

  // ── Game-flow handlers ─────────────────────────────────────────────────────

  function handleGuestLogin(name) {
    setUsername(name);
    setError('');
    connectSocket();
    setPhase('mode_split');
  }

  function handlePlayNow() {
    connectSocket();
    setPhase('mode_split');
  }

  function handleSelectStep1() {
    // Show the Story/Online split
    setPhase('mode_split');
  }

  function handleSelectDifficulty(diff) {
    setDifficulty(diff);
    setPhase('mode_split');
  }

  function handleSelectGameMode(mode) {
    setGameMode(mode);
    if (mode === 'training_grounds') {
      setPhase('training_grounds');
    } else {
      setPhase('lobby_select');
    }
  }

  function handlePlayPageModeSelect(modeOrOptions, legacyOptions = {}) {
    // Handle both old (mode, options) and new ({mode, action, ...}) signatures
    let mode, action, lobbyCode, squadSize, fillTeam, exam, step;
    if (typeof modeOrOptions === 'string') {
      // Legacy signature: handlePlayPageModeSelect('mode_id', {options})
      mode = modeOrOptions;
      action = 'find';
    } else {
      // New signature: handlePlayPageModeSelect({mode, action, lobbyCode, ...})
      mode = modeOrOptions.mode;
      action = modeOrOptions.action || 'find';
      lobbyCode = modeOrOptions.lobbyCode;
      squadSize = modeOrOptions.squadSize;
      fillTeam = modeOrOptions.fillTeam;
      exam = modeOrOptions.exam;
      step = modeOrOptions.step;
    }

    console.log('handlePlayPageModeSelect received:', { mode, action, modeOrOptions });

    setGameMode(mode);
    // Launching anything from the play page clears the Story→AnKing initial mode,
    // so returning from a game lands on the normal play page, not AnKing
    setPlayInitialMode(null);

    // For solo modes, go directly
    if (mode === 'tower') {
      setPhase('tower');
    } else if (mode === 'training_grounds') {
      setPhase('training_grounds');
    } else {
      // For multiplayer modes, handle based on action
      if (action === 'create') {
        // CREATE LOBBY - skip all intermediate screens, create directly
        setError('');
        const lobbySubject = mode === 'scan_master' ? 'scan_master' : 'all';
        const lobbyDifficulty = 'easy'; // Default to easy, can be changed in lobby
        setSubject(lobbySubject);
        setDifficulty(lobbyDifficulty);

        socket.timeout(5000).emit('create_lobby', {
          username,
          subject: lobbySubject,
          gameMode: mode,
          difficulty: lobbyDifficulty,
          clanTag: user?.clan?.tag ?? null,
          isGuest: !user
        }, (err, res) => {
          if (err) { setError('No response from server. Please try again.'); return; }
          if (!res.ok) { setError(res.error ?? 'Failed to create lobby.'); return; }
          setLobbyId(res.lobbyId);
          setIsHost(true);
          // Stay on play_page, lobby will show as overlay
          audio.startBgMusic();
        });
      } else if (action === 'join') {
        // JOIN LOBBY - skip intermediate screen, join directly with code
        setError('');
        socket.timeout(5000).emit('join_lobby', {
          username,
          lobbyId: lobbyCode,
          clanTag: user?.clan?.tag ?? null,
          isGuest: !user
        }, (err, res) => {
          if (err) { setError('No response from server. Please try again.'); return; }
          if (!res.ok) { setError(res.error ?? 'Failed to join lobby.'); return; }
          setLobbyId(res.lobbyId);
          setIsHost(false);
          // Stay on play_page, lobby will show as overlay
          audio.startBgMusic();
        });
      } else if (action === 'find') {
        // FIND MATCH - use quick join (matchmaking)
        handleQuickJoin();
      }
    }
  }

  function handleStartTrainingPractice(topicData) {
    setTrainingTopic(topicData);
    setSoloSubject(topicData.category);
    setDifficulty(topicData.difficulty);
    setPhase('solo_game');
  }

  function handlePlayJourneyLevel({ subject, levelKey, questionsUrl, levelLabel, wasMastery }) {
    setJourneyContext({ subject, levelKey, questionsUrl, levelLabel, wasMastery });
    setPhase('solo_game');
  }

  function handleJourneyComplete({ pct }) {
    setJourneyReentry({
      pct,
      subject:     journeyContext.subject,
      levelKey:    journeyContext.levelKey,
      questionsUrl: journeyContext.questionsUrl,
      levelLabel:  journeyContext.levelLabel,
      wasMastery:  journeyContext.wasMastery,
    });
    setJourneyContext(null);
    setPhase('journey');
  }

  // Training Grounds folder completion: fires at game-over for the trainingTopic path
  // (reuses SoloGame's existing J3a onComplete — no SoloGame change). Pure side-effect:
  // POSTs the folder key + pct so the server can record best % / >=85% completion.
  // The category key uniquely identifies the folder (subject/topicId) so the matching
  // folder card in Training Grounds shows the green tick.
  function handleTrainingComplete({ pct }) {
    if (!trainingTopic) return;
    const token = getToken();
    if (!token) return; // guests don't record completions
    const category = `${trainingTopic.category}/${trainingTopic.topicId}`;
    fetch('https://usmle-battle-royale-production.up.railway.app/api/training-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category, pct }),
    }).catch(() => {});
  }

  // Game-over → back to the Training Grounds topic list of the practiced subject.
  // Reuses the training_grounds phase; tgInitialSubject makes TG auto-open that subject.
  function handleBackToTopics() {
    setTgInitialSubject(trainingTopic?.category || null);
    setPhase('training_grounds');
  }

  function handleShowSubjectSelect() {
    setError('');
    // Scan Master has no subject selection — always uses image questions
    if (gameMode === 'scan_master') {
      setSubject('scan_master');
      setPhase('lobby_difficulty');
    } else {
      setPhase('subject_select');
    }
  }

  function handleLobbySubjectSelect(selectedSubject) {
    setSubject(selectedSubject);
    setPhase('lobby_difficulty');
  }

  function handleLobbyDifficultySelect(diff) {
    setDifficulty(diff);
    // Create lobby with chosen subject and difficulty
    setError('');
    socket.timeout(5000).emit('create_lobby', { username, subject, gameMode, difficulty: diff, clanTag: user?.clan?.tag ?? null, isGuest: !user }, (err, res) => {
      if (err)      { setError('No response from server. Please try again.'); return; }
      if (!res.ok)  { setError(res.error ?? 'Failed to create lobby.'); return; }
      setLobbyId(res.lobbyId);
      setIsHost(true);
      setPhase('lobby');
      audio.startBgMusic();
    });
  }

  function handleShowJoinInput() {
    setError('');
    setPhase('join_input');
  }

  function handleJoinLobby(code) {
    setError('');
    socket.timeout(5000).emit('join_lobby', { username, lobbyId: code, clanTag: user?.clan?.tag ?? null, isGuest: !user }, (err, res) => {
      if (err)      { setError('No response from server. Please try again.'); return; }
      if (!res.ok)  { setError(res.error ?? 'Failed to join lobby.'); return; }
      setLobbyId(res.lobbyId);
      setIsHost(false);
      setPhase('lobby');
      audio.startBgMusic();
    });
  }

  function handleStartGame()   { socket.emit('start_game'); }
  function handleAddBot(difficulty)  { socket.emit('add_bot',    { difficulty }); }
  function handleRemoveBot(botId)    { socket.emit('remove_bot', { botId }); }
  function handleToggleQuickJoin(open) { socket.emit('toggle_quick_join', { open }); }

  function handleQuickJoin({ onCreating, onError } = {}) {
    setError('');
    socket.timeout(8000).emit('quick_join', { username, gameMode, difficulty, clanTag: user?.clan?.tag ?? null, isGuest: !user }, (err, res) => {
      if (err) {
        setError('Quick join timed out. Please try again.');
        if (onError) onError();
        return;
      }
      if (!res.ok) {
        setError(res.error ?? 'Quick join failed.');
        if (onError) onError();
        return;
      }
      if (res.created) {
        if (onCreating) onCreating();
        setTimeout(() => {
          setLobbyId(res.lobbyId);
          setSubject(res.subject || 'all');
          setIsHost(true);
          setOpenToQuickJoin(true);
          // Stay on play_page, lobby will show as overlay
          audio.startBgMusic();
        }, 1200);
      } else {
        setLobbyId(res.lobbyId);
        setSubject(res.subject || 'all');
        setIsHost(false);
        setOpenToQuickJoin(true);
        // Stay on play_page, lobby will show as overlay
        audio.startBgMusic();
      }
    });
  }

  function handleTriviaRoll() {
    socket.emit('trivia_roll');
  }

  function handleUsePowerup(type, targetId) {
    socket.emit('use_powerup', { type, targetId: targetId || null });
  }

  function handleAnswer(answer) {
    if (hasAnswered) return;
    if (gameMode === 'battle_royale' && !isAlive) return;
    setMyAnswer(answer);
    setHasAnswered(true);
    socket.emit('submit_answer', { answer });
  }

  function handleShowSoloMode()              { setError(''); setTrainingTopic(null); setPhase('solo_subject'); }
  function handleSoloSubjectSelect(s)        { setSoloSubject(s); setPhase('solo_difficulty'); }
  function handleSoloDifficultySelect(diff)  { setDifficulty(diff); setPhase('solo_game'); }
  function handleSoloTryAgain()              { setSoloKey(k => k + 1); setPhase('solo_game'); }
  function handlePlayAgain()                 { socket.emit('reset_game'); }

  function handleReturnHome() {
    audio.stopBgMusic();
    audio.stopGameMusic();
    socket.disconnect();

    if (user) {
      window.location.href = '/dashboard';
      return;
    }

    setPhase('entry');
    setUsername('');
    setLobbyId('');
    setSubject('all');
    setDifficulty('easy');
    setIsHost(false);
    setPlayers([]);
    setError('');
    setQuestion(null);
    setRound(0);
    setMyAnswer(null);
    setHasAnswered(false);
    setAnsweredCount(0);
    setTotalAlive(0);
    setMyLives(3);
    setMyScore(0);
    setIsAlive(true);
    setAnswerResult(null);
    setRoundResults(null);
    setShowingRoundResult(false);
    setGameResult(null);
    setToast('');
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const showMuteBtn = ['lobby', 'game', 'game_over', 'solo_game', 'tower'].includes(phase);
  const showHomeBtn = !['loading', 'entry', 'landing'].includes(phase);

  return (
    <Suspense fallback={
      <div style={{
        height:'100vh', display:'flex', alignItems:'center',
        justifyContent:'center', background:'#090914',
        color:'rgba(200,165,60,0.8)', fontFamily:'Cinzel,serif', fontSize:'18px'
      }}>
        Loading MedVale...
      </div>
    }>
      <div style={{ minHeight: '100vh', overflow: 'auto' }}>
        {toast && <div className="notification">{toast}</div>}

      {showHomeBtn && (
        <button className="home-btn" onClick={handleReturnHome} title="Return to home">
          ⌂ Home
        </button>
      )}

      {showMuteBtn && (
        <button className="mute-btn" onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {phase === 'landing' && (
        <RouteErrorBoundary name="LandingPage"><LandingPage onSignIn={handleGoogleLogin} /></RouteErrorBoundary>
      )}

      {phase === 'loading' && (
        <div className="screen entry-screen">
          <div className="spinner" style={{ width: 52, height: 52 }} />
        </div>
      )}

      {phase === 'entry' && (
        <UsernameEntry
          onJoin={handleGuestLogin}
          onGoogleLogin={handleGoogleLogin}
          error={error}
        />
      )}

      {phase === 'exam_select' && (
        <ExamSelect
          username={username}
          onSelectStep1={handleSelectStep1}
        />
      )}

      {phase === 'difficulty_select' && (
        <DifficultySelect
          username={username}
          onSelectDifficulty={handleSelectDifficulty}
          onBack={() => window.location.href = '/dashboard'}
        />
      )}

      {phase === 'mode_split' && (
        <RouteErrorBoundary name="ModeSplit">
        <ModeSplit
          onStory={() => setPhase('story_menu')}
          onOnline={() => { setPlayInitialMode(null); setPhase('play_page'); }}
          onTraining={() => setPhase('training_grounds')}
          onBack={() => window.location.href = '/dashboard'}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'story_menu' && (
        <RouteErrorBoundary name="StoryMenu">
        <StoryMenu
          onBack={() => setPhase('mode_split')}
          onJourney={() => setPhase('journey')}
          onTower={() => { setGameMode('tower'); setPhase('tower'); }}
          onAnKing={() => { setPlayInitialMode('anking'); setPhase('play_page'); }}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'play_page' && (
        <RouteErrorBoundary name="PlayPage">
        <PlayPage
          user={user}
          username={username}
          initialMode={playInitialMode}
          onModeSelect={handlePlayPageModeSelect}
          onBack={() => window.location.href = '/dashboard'}
          error={error}
          onClearError={() => setError('')}
          lobbyId={lobbyId}
          lobbyPlayers={players}
          isHost={isHost}
          lobbySubject={subject}
          lobbyGameMode={gameMode}
          openToQuickJoin={openToQuickJoin}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          onToggleQuickJoin={handleToggleQuickJoin}
          onLeaveLobby={() => {
            socket.emit('leave_lobby');
            setLobbyId('');
            setPlayers([]);
            setIsHost(false);
            setError('');
          }}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'lobby_select' && (
        <LobbySelect
          username={username}
          onCreateLobby={handleShowSubjectSelect}
          onJoinLobby={handleShowJoinInput}
          onSoloMode={handleShowSoloMode}
          onQuickJoin={handleQuickJoin}
          onBack={() => setPhase('play_page')}
        />
      )}

      {phase === 'subject_select' && (
        <SubjectSelect
          username={username}
          onSelect={handleLobbySubjectSelect}
          onBack={() => { setError(''); setPhase('lobby_select'); }}
        />
      )}

      {phase === 'lobby_difficulty' && (
        <DifficultySelect
          username={username}
          onSelectDifficulty={handleLobbyDifficultySelect}
          onBack={() => setPhase(gameMode === 'scan_master' ? 'lobby_select' : 'subject_select')}
        />
      )}

      {phase === 'join_input' && (
        <JoinLobbyInput
          username={username}
          onJoin={handleJoinLobby}
          onBack={() => { setError(''); setPhase('lobby_select'); }}
          error={error}
        />
      )}

      {phase === 'lobby' && (
        <RouteErrorBoundary name="Lobby">
        <Lobby
          lobbyId={lobbyId}
          subject={subject}
          gameMode={gameMode}
          players={players}
          isHost={isHost}
          onStartGame={handleStartGame}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          openToQuickJoin={openToQuickJoin}
          onToggleQuickJoin={handleToggleQuickJoin}
          error={error}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'game' && (gameMode === 'battle_royale' || gameMode === 'scan_master') && (
        <RouteErrorBoundary name="GameRoom">
        <GameRoom
          question={question}
          round={round}
          timeLimit={timeLimit}
          myAnswer={myAnswer}
          hasAnswered={hasAnswered}
          answeredCount={answeredCount}
          totalAlive={totalAlive}
          myLives={myLives}
          myScore={myScore}
          isAlive={isAlive}
          players={players}
          answerResult={answerResult}
          roundResults={roundResults}
          showingRoundResult={showingRoundResult}
          onAnswer={handleAnswer}
          username={username}
          onTick={audio.playTick}
          streaks={streaks}
          suddenDeath={suddenDeath}
          showSuddenDeathScreen={showSuddenDeathScreen}
          myPowerups={myPowerups}
          usedPowerupThisQ={usedPowerupThisQ}
          onUsePowerup={handleUsePowerup}
          isFrozen={isFrozen}
          hiddenOptions={hiddenOptions}
          extraTimeBonus={extraTimeBonus}
          showPowerupIntro={showPowerupIntro}
          socketId={socket.id}
          gameMode={gameMode}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'game' && gameMode === 'trivia_pursuit' && (
        <RouteErrorBoundary name="TriviaGame">
        <TriviaGame
          triviaState={triviaState}
          triviaResult={triviaResult}
          onAnswer={handleAnswer}
          onRoll={handleTriviaRoll}
          diceValue={triviaDiceValue}
          username={username}
          socketId={socket.id}
          onTick={audio.playTick}
          hasAnswered={hasAnswered}
          myAnswer={myAnswer}
          streaks={streaks}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'game' && gameMode === 'speed_race' && (
        <RouteErrorBoundary name="SpeedRaceGame">
        <SpeedRaceGame
          question={question}
          round={round}
          timeLimit={timeLimit}
          myAnswer={myAnswer}
          hasAnswered={hasAnswered}
          answeredCount={answeredCount}
          totalAlive={totalAlive}
          raceProgress={raceProgress}
          answerResult={answerResult}
          onAnswer={handleAnswer}
          username={username}
          onTick={audio.playTick}
          streaks={streaks}
          myPowerups={myPowerups}
          usedPowerupThisQ={usedPowerupThisQ}
          onUsePowerup={handleUsePowerup}
          hiddenOptions={hiddenOptions}
          extraTimeBonus={extraTimeBonus}
          showPowerupIntro={showPowerupIntro}
          socketId={socket.id}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'game' && gameMode === 'buzz_fun' && (
        <RouteErrorBoundary name="BuzzFunGame">
        <BuzzFunGame
          question={question}
          round={round}
          timeLimit={timeLimit}
          myAnswer={myAnswer}
          hasAnswered={hasAnswered}
          answeredCount={answeredCount}
          totalAlive={totalAlive}
          myScore={myScore}
          players={players}
          answerResult={answerResult}
          roundResults={roundResults}
          showingRoundResult={showingRoundResult}
          onAnswer={handleAnswer}
          username={username}
          onTick={audio.playTick}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'game_over' && (
        <RouteErrorBoundary name="Leaderboard">
        <Leaderboard
          gameResult={gameResult}
          username={username}
          gameMode={gameMode}
          onPlayAgain={handlePlayAgain}
          isGuest={!user}
          onSignIn={handleGoogleLogin}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'solo_subject' && (
        <SubjectSelect
          username={username}
          onSelect={handleSoloSubjectSelect}
          onBack={() => { setError(''); setPhase('lobby_select'); }}
        />
      )}

      {phase === 'solo_difficulty' && (
        <DifficultySelect
          username={username}
          onSelectDifficulty={handleSoloDifficultySelect}
          onBack={() => setPhase('solo_subject')}
        />
      )}

      {phase === 'solo_game' && (
        <RouteErrorBoundary name="SoloGame">
        <SoloGame
          key={soloKey}
          subject={journeyContext ? journeyContext.subject.id : soloSubject}
          username={username}
          difficulty={journeyContext ? undefined : difficulty}
          onBack={journeyContext
            ? () => { setJourneyReentry({ pct: null, subject: journeyContext.subject }); setJourneyContext(null); setPhase('journey'); }
            : handleReturnHome}
          onTryAgain={journeyContext       ? undefined : handleSoloTryAgain}
          onBackToTopics={(!journeyContext && trainingTopic) ? handleBackToTopics : undefined}
          topicId={journeyContext          ? undefined : trainingTopic?.topicId}
          questionsUrl={journeyContext?.questionsUrl}
          onComplete={journeyContext       ? handleJourneyComplete : (trainingTopic ? handleTrainingComplete : undefined)}
          levelLabel={journeyContext?.levelLabel}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'journey' && (
        <RouteErrorBoundary name="JourneyMode">
        <JourneyMode
          username={username}
          onBack={() => setPhase('story_menu')}
          onPlayLevel={handlePlayJourneyLevel}
          journeyReentry={journeyReentry}
          onReentryConsumed={() => setJourneyReentry(null)}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'tower' && (
        <RouteErrorBoundary name="TowerMode">
        <TowerMode
          username={username}
          onBack={() => setPhase('play_page')}
        />
        </RouteErrorBoundary>
      )}

      {phase === 'training_grounds' && (
        <RouteErrorBoundary name="TrainingGrounds">
        <TrainingGrounds
          user={user}
          onBack={() => setPhase('play_page')}
          onStartPractice={handleStartTrainingPractice}
          initialSubject={tgInitialSubject}
          onInitialConsumed={() => setTgInitialSubject(null)}
        />
        </RouteErrorBoundary>
      )}
      </div>
    </Suspense>
  );
}
