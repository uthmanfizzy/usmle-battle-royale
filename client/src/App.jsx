import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import * as audio from './audio';
import { getToken, clearToken, fetchMe, getCachedUser, redirectToGoogle } from './auth';
import UsernameEntry from './components/UsernameEntry';
import ExamSelect from './components/ExamSelect';
import DifficultySelect from './components/DifficultySelect';
import ModeSelect from './components/ModeSelect';
import LobbySelect from './components/LobbySelect';
import JoinLobbyInput from './components/JoinLobbyInput';
import SubjectSelect from './components/SubjectSelect';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import SpeedRaceGame from './components/SpeedRaceGame';
import TriviaGame from './components/TriviaGame';
import Leaderboard from './components/Leaderboard';
import SoloGame from './components/SoloGame';

// phases: 'loading' | 'entry' | 'exam_select' | 'difficulty_select' | 'mode_select' |
//         'lobby_select' | 'subject_select' | 'join_input' | 'lobby' | 'game' |
//         'game_over' | 'solo_subject' | 'solo_game'

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

  const [triviaState,  setTriviaState]  = useState(null);
  const [triviaResult, setTriviaResult] = useState(null);

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
    socket.on('lobby_update', ({ players: ps, hostId, subject: s, gameMode: gm }) => {
      setPlayers(ps);
      setIsHost(socket.id === hostId);
      if (s) setSubject(s);
      if (gm) setGameMode(gm);
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
      audio.startGameMusic();
    });

    socket.on('race_progress', ({ progress }) => {
      setRaceProgress(progress || []);
    });

    socket.on('trivia_turn', (data) => {
      setTriviaState(data);
      setTriviaResult(null);
      setHasAnswered(false);
      setMyAnswer(null);
    });

    socket.on('trivia_rolled', (data) => {
      setTriviaState(prev => prev ? { ...prev, positions: data.positions } : prev);
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
       'player_left', 'error',
       'race_progress', 'trivia_turn', 'trivia_rolled', 'trivia_question', 'trivia_answer_result'].forEach(e => socket.off(e));
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
    setPhase('lobby_select');
  }

  function handleShowSubjectSelect() {
    setError('');
    setPhase('subject_select');
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

  const showMuteBtn = ['lobby', 'game', 'game_over', 'solo_game'].includes(phase);
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

      {phase === 'lobby_select' && (
        <LobbySelect
          username={username}
          onCreateLobby={handleShowSubjectSelect}
          onJoinLobby={handleShowJoinInput}
          onSoloMode={handleShowSoloMode}
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
          error={error}
        />
      )}

      {phase === 'game' && gameMode === 'battle_royale' && (
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
        />
      )}

      {phase === 'game' && gameMode === 'trivia_pursuit' && (
        <TriviaGame
          triviaState={triviaState}
          triviaResult={triviaResult}
          onAnswer={handleAnswer}
          username={username}
          socketId={socket.id}
          onTick={audio.playTick}
          hasAnswered={hasAnswered}
          myAnswer={myAnswer}
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
    </div>
  );
}
