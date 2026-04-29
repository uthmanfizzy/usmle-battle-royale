import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import * as audio from './audio';
import { getToken, clearToken, fetchMe, getCachedUser, redirectToGoogle } from './auth';
import UsernameEntry from './components/UsernameEntry';
import ExamSelect from './components/ExamSelect';
import DifficultySelect from './components/DifficultySelect';
import ModeSelect from './components/ModeSelect';
import HowToPlay from './components/HowToPlay';
import LobbySelect from './components/LobbySelect';
import JoinLobbyInput from './components/JoinLobbyInput';
import SubjectSelect from './components/SubjectSelect';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import SpeedRaceGame from './components/SpeedRaceGame';
import TriviaGame from './components/TriviaGame';
import Leaderboard from './components/Leaderboard';
import SoloGame from './components/SoloGame';
import TowerMode from './components/TowerMode';

// phases: 'loading' | 'entry' | 'exam_select' | 'difficulty_select' | 'mode_select' |
//         'how_to_play' | 'lobby_select' | 'subject_select' | 'join_input' | 'lobby' | 'game' |
//         'game_over' | 'solo_subject' | 'solo_game' | 'tower'

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

    if (authError) {
      window.history.replaceState({}, '', '/');
      setError('Google sign-in failed. Please try again.');
      setPhase('entry');
      return;
    }

    const token = getToken();

    if (autoPlay) {
      // Arrived from /dashboard Play Now button
      window.history.replaceState({}, '', '/');
      if (!token) { setPhase('entry'); return; }
      const cached = getCachedUser();
      if (cached) {
        setUser(cached);
        setUsername(cached.username);
        connectSocket();
        setPhase('exam_select');
      } else {
        fetchMe().then(me => {
          if (me) { setUser(me); setUsername(me.username); connectSocket(); setPhase('exam_select'); }
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

    setPhase('entry');
  }, []);

  // ── Global button click sound ──────────────────────────────────────────────

  useEffect(() => {
    const onBtnClick = (e) => { if (e.target.closest('button')) audio.playClick(); };
    document.addEventListener('click', onBtnClick, true);
    return () => document.removeEventListener('click', onBtnClick, true);
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
    setPhase('exam_select');
  }

  function handlePlayNow() {
    connectSocket();
    setPhase('exam_select');
  }

  function handleSelectStep1() {
    setPhase('difficulty_select');
  }

  function handleSelectDifficulty(diff) {
    setDifficulty(diff);
    setPhase('mode_select');
  }

  function handleSelectGameMode(mode) {
    setGameMode(mode);
    setPhase('how_to_play');
  }

  function handleHowToPlayContinue() {
    if (gameMode === 'tower') { setPhase('tower'); return; }
    setPhase('lobby_select');
  }

  function handleShowSubjectSelect() {
    setError('');
    // Scan Master has no subject selection — always uses image questions
    if (gameMode === 'scan_master') {
      handleCreateLobby('scan_master');
    } else {
      setPhase('subject_select');
    }
  }

  function handleCreateLobby(selectedSubject) {
    setSubject(selectedSubject);
    setError('');
    socket.timeout(5000).emit('create_lobby', { username, subject: selectedSubject, gameMode, clanTag: user?.clan?.tag ?? null }, (err, res) => {
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
    socket.timeout(5000).emit('join_lobby', { username, lobbyId: code, clanTag: user?.clan?.tag ?? null }, (err, res) => {
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
    socket.timeout(8000).emit('quick_join', { username, gameMode, clanTag: user?.clan?.tag ?? null }, (err, res) => {
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
          setPhase('lobby');
          audio.startBgMusic();
        }, 1200);
      } else {
        setLobbyId(res.lobbyId);
        setSubject(res.subject || 'all');
        setIsHost(false);
        setOpenToQuickJoin(true);
        setPhase('lobby');
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

  function handleShowSoloMode()              { setError(''); setPhase('solo_subject'); }
  function handleSoloSubjectSelect(s)        { setSoloSubject(s); setPhase('solo_game'); }
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
  const showHomeBtn = !['loading', 'entry'].includes(phase);

  return (
    <div>
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
          onBack={() => setPhase('exam_select')}
        />
      )}

      {phase === 'mode_select' && (
        <ModeSelect
          username={username}
          onSelect={handleSelectGameMode}
          onBack={() => setPhase('difficulty_select')}
        />
      )}

      {phase === 'how_to_play' && (
        <HowToPlay
          gameMode={gameMode}
          onContinue={handleHowToPlayContinue}
          onBack={() => setPhase('mode_select')}
        />
      )}

      {phase === 'lobby_select' && (
        <LobbySelect
          username={username}
          onCreateLobby={handleShowSubjectSelect}
          onJoinLobby={handleShowJoinInput}
          onSoloMode={handleShowSoloMode}
          onQuickJoin={handleQuickJoin}
          onBack={() => setPhase('mode_select')}
        />
      )}

      {phase === 'subject_select' && (
        <SubjectSelect
          username={username}
          onSelect={handleCreateLobby}
          onBack={() => { setError(''); setPhase('lobby_select'); }}
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
      )}

      {phase === 'game' && (gameMode === 'battle_royale' || gameMode === 'scan_master') && (
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
      )}

      {phase === 'game' && gameMode === 'trivia_pursuit' && (
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
      )}

      {phase === 'game' && gameMode === 'speed_race' && (
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
      )}

      {phase === 'game_over' && (
        <Leaderboard
          gameResult={gameResult}
          username={username}
          gameMode={gameMode}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {phase === 'solo_subject' && (
        <SubjectSelect
          username={username}
          onSelect={handleSoloSubjectSelect}
          onBack={() => { setError(''); setPhase('lobby_select'); }}
        />
      )}

      {phase === 'solo_game' && (
        <SoloGame
          key={soloKey}
          subject={soloSubject}
          username={username}
          onBack={handleReturnHome}
          onTryAgain={handleSoloTryAgain}
          onChangeSubject={() => setPhase('solo_subject')}
        />
      )}

      {phase === 'tower' && (
        <TowerMode
          username={username}
          onBack={() => setPhase('mode_select')}
        />
      )}
    </div>
  );
}
