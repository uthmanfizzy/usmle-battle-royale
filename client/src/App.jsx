import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import * as audio from './audio';
import UsernameEntry from './components/UsernameEntry';
import LobbySelect from './components/LobbySelect';
import JoinLobbyInput from './components/JoinLobbyInput';
import SubjectSelect from './components/SubjectSelect';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leaderboard';
import SoloGame from './components/SoloGame';

// phases: 'entry' | 'lobby_select' | 'subject_select' | 'join_input' | 'lobby' | 'game' | 'game_over' | 'solo_subject' | 'solo_game'

export default function App() {
  const [phase,    setPhase]    = useState('entry');
  const [username, setUsername] = useState('');
  const [lobbyId,  setLobbyId]  = useState('');
  const [subject,  setSubject]  = useState('all');
  const [isHost,   setIsHost]   = useState(false);
  const [players,  setPlayers]  = useState([]);
  const [error,    setError]    = useState('');
  const [muted,    setMuted]    = useState(false);
  const [soloSubject, setSoloSubject] = useState('all');
  const [soloKey,  setSoloKey]  = useState(0);

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

  // ── Global button click sound ──────────────────────────────────────────────

  useEffect(() => {
    const onBtnClick = (e) => { if (e.target.closest('button')) audio.playClick(); };
    document.addEventListener('click', onBtnClick, true);
    return () => document.removeEventListener('click', onBtnClick, true);
  }, []);

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    socket.connect();

    socket.on('lobby_update', ({ players: ps, hostId, subject: s }) => {
      setPlayers(ps);
      setIsHost(socket.id === hostId);
      if (s) setSubject(s);
    });

    socket.on('game_start', () => {
      setPhase('game');
      setMyLives(3);
      setMyScore(0);
      setIsAlive(true);
      setQuestion(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
      audio.startGameMusic();
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
      if (result.correct) {
        audio.playCorrect();
      } else {
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
    });

    socket.on('game_reset', () => {
      setPhase('lobby');
      setGameResult(null);
      setQuestion(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
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
       'player_left', 'error'].forEach(e => socket.off(e));
      socket.disconnect();
      audio.stopBgMusic();
    };
  }, [showToast]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleUsernameSubmit(name) {
    setUsername(name);
    setError('');
    setPhase('lobby_select');
  }

  function handleShowSubjectSelect() {
    setError('');
    setPhase('subject_select');
  }

  function handleCreateLobby(selectedSubject) {
    setSubject(selectedSubject);
    setError('');
    socket.timeout(5000).emit('create_lobby', { username, subject: selectedSubject }, (err, res) => {
      if (err) {
        setError('No response from server. Please try again.');
        return;
      }
      if (!res.ok) { setError(res.error ?? 'Failed to create lobby.'); return; }
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
    socket.timeout(5000).emit('join_lobby', { username, lobbyId: code }, (err, res) => {
      if (err) {
        setError('No response from server. Please try again.');
        return;
      }
      if (!res.ok) { setError(res.error ?? 'Failed to join lobby.'); return; }
      setLobbyId(res.lobbyId);
      setIsHost(false);
      setPhase('lobby');
      audio.startBgMusic();
    });
  }

  function handleStartGame() {
    socket.emit('start_game');
  }

  function handleAnswer(answer) {
    if (hasAnswered || !isAlive) return;
    setMyAnswer(answer);
    setHasAnswered(true);
    socket.emit('submit_answer', { answer });
  }

  function handleShowSoloMode() {
    setError('');
    setPhase('solo_subject');
  }

  function handleSoloSubjectSelect(selectedSubject) {
    setSoloSubject(selectedSubject);
    setPhase('solo_game');
  }

  function handleSoloTryAgain() {
    setSoloKey(k => k + 1);
    setPhase('solo_game');
  }

  function handlePlayAgain() {
    socket.emit('reset_game');
  }

  function handleReturnHome() {
    audio.stopBgMusic();
    audio.stopGameMusic();
    socket.disconnect();
    socket.connect();
    setPhase('entry');
    setUsername('');
    setLobbyId('');
    setSubject('all');
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
  const showHomeBtn = phase !== 'entry';

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

      {phase === 'entry' && (
        <UsernameEntry onJoin={handleUsernameSubmit} error={error} />
      )}

      {phase === 'lobby_select' && (
        <LobbySelect
          username={username}
          onCreateLobby={handleShowSubjectSelect}
          onJoinLobby={handleShowJoinInput}
          onSoloMode={handleShowSoloMode}
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
          players={players}
          isHost={isHost}
          onStartGame={handleStartGame}
          error={error}
        />
      )}

      {phase === 'game' && (
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

      {phase === 'game_over' && (
        <Leaderboard
          gameResult={gameResult}
          username={username}
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
