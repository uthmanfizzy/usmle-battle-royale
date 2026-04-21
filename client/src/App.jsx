import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import UsernameEntry from './components/UsernameEntry';
import LobbySelect from './components/LobbySelect';
import JoinLobbyInput from './components/JoinLobbyInput';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Leaderboard from './components/Leaderboard';

// phases: 'entry' | 'lobby_select' | 'join_input' | 'lobby' | 'game' | 'game_over'

export default function App() {
  const [phase,    setPhase]    = useState('entry');
  const [username, setUsername] = useState('');
  const [lobbyId,  setLobbyId]  = useState('');
  const [isHost,   setIsHost]   = useState(false);
  const [players,  setPlayers]  = useState([]);
  const [error,    setError]    = useState('');

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

  // ── Socket events ──────────────────────────────────────────────────────────

  useEffect(() => {
    socket.connect();

    // Any player list change in the lobby
    socket.on('lobby_update', ({ players: ps, hostId }) => {
      setPlayers(ps);
      setIsHost(socket.id === hostId);
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
    });

    socket.on('round_results', (data) => {
      setRoundResults(data);
      setPlayers(data.players);
      setShowingRoundResult(true);
    });

    socket.on('game_over', (result) => {
      setGameResult(result);
      setPhase('game_over');
    });

    // Play Again: stay in same lobby, reset game state
    socket.on('game_reset', () => {
      setPhase('lobby');
      setGameResult(null);
      setQuestion(null);
      setAnswerResult(null);
      setRoundResults(null);
      setShowingRoundResult(false);
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
    };
  }, [showToast]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleUsernameSubmit(name) {
    setUsername(name);
    setError('');
    setPhase('lobby_select');
  }

  function handleCreateLobby() {
    setError('');
    socket.timeout(5000).emit('create_lobby', { username }, (err, res) => {
      if (err) {
        setError('No response from server. Please try again.');
        return;
      }
      if (!res.ok) { setError(res.error ?? 'Failed to create lobby.'); return; }
      setLobbyId(res.lobbyId);
      setIsHost(true);
      setPhase('lobby');
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

  function handlePlayAgain() {
    socket.emit('reset_game');
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {toast && <div className="notification">{toast}</div>}

      {phase === 'entry' && (
        <UsernameEntry onJoin={handleUsernameSubmit} error={error} />
      )}

      {phase === 'lobby_select' && (
        <LobbySelect
          username={username}
          onCreateLobby={handleCreateLobby}
          onJoinLobby={handleShowJoinInput}
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
        />
      )}

      {phase === 'game_over' && (
        <Leaderboard
          gameResult={gameResult}
          username={username}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
