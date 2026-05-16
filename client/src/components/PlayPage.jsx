import { useState, useEffect } from 'react';
import { authFetch } from '../auth';
import './PlayPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

const GAME_MODES = [
  {
    id: 'battle_royale',
    name: 'BATTLE ROYALE',
    icon: '💀',
    shortDesc: 'Last doctor standing wins',
    longDescription: 'Drop into the medical arena. Wrong answers cost lives. Outlast every other player through skill and knowledge. Strategy and speed will lead you to victory.',
    supportsSolo: false,
  },
  {
    id: 'speed_race',
    name: 'SPEED RACE',
    icon: '🏁',
    shortDesc: 'First to 20 correct answers wins',
    longDescription: 'Race against the clock and your opponents. Answer 20 questions correctly as fast as possible. No lives lost, just pure speed and accuracy.',
    supportsSolo: false,
  },
  {
    id: 'trivia_pursuit',
    name: 'TRIVIA PURSUIT',
    icon: '🎯',
    shortDesc: 'Collect all 6 subject wedges',
    longDescription: 'Take turns answering questions across 6 medical subjects. Earn a wedge for each correct answer. First player to collect all 6 subject wedges wins the game.',
    supportsSolo: false,
  },
  {
    id: 'scan_master',
    name: 'SCAN MASTER',
    icon: '🔬',
    shortDesc: 'Identify conditions from medical images',
    longDescription: 'Study real medical images including ECGs, X-rays, histology slides, and dermatology photos. Last doctor standing wins through visual diagnosis mastery.',
    supportsSolo: false,
  },
  {
    id: 'buzz_fun',
    name: 'BUZZ FUN',
    icon: '⚡',
    shortDesc: 'Buzzwords, triads & classic HY facts',
    longDescription: 'Fast-paced flash cards of buzzwords, triads, side effects and classic high-yield associations. 8 seconds each — fast answers earn bonus points!',
    supportsSolo: false,
  },
  {
    id: 'tower',
    name: 'THE TOWER',
    icon: '🏰',
    shortDesc: 'Climb 100 floors of knowledge',
    longDescription: 'Solo story mode. Ascend 10 zones across 100 floors. Face normal, challenge, and boss floors. How far can you climb through the medical tower?',
    supportsSolo: true,
  },
  {
    id: 'training_grounds',
    name: 'TRAINING GROUNDS',
    icon: '📚',
    shortDesc: 'Study by subject and topic',
    longDescription: 'Choose a medical subject, select your difficulty, then pick a specific topic folder. Practice questions at your own pace with detailed explanations.',
    supportsSolo: true,
  },
];

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Subject categories for Training Grounds
const SUBJECTS = [
  { id: 'cardiology', label: 'Cardiology', icon: '❤️' },
  { id: 'neurology', label: 'Neurology', icon: '🧠' },
  { id: 'pharmacology', label: 'Pharmacology', icon: '💊' },
  { id: 'microbiology', label: 'Microbiology', icon: '🦠' },
  { id: 'biochemistry', label: 'Biochemistry', icon: '⚗️' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊' },
  { id: 'pathology', label: 'Pathology', icon: '🔬' },
  { id: 'pulmonology', label: 'Pulmonology', icon: '🫁' },
  { id: 'nephrology', label: 'Nephrology', icon: '💧' },
  { id: 'gastroenterology', label: 'Gastroenterology', icon: '🫃' },
  { id: 'endocrinology', label: 'Endocrinology', icon: '🦋' },
  { id: 'haematology', label: 'Haematology', icon: '🩸' },
  { id: 'immunology', label: 'Immunology', icon: '🛡️' },
  { id: 'musculoskeletal', label: 'Musculoskeletal', icon: '🦴' },
  { id: 'dermatology', label: 'Dermatology', icon: '🩹' },
  { id: 'reproductive', label: 'Reproductive', icon: '👶' },
  { id: 'psychiatry', label: 'Psychiatry', icon: '🧠' },
  { id: 'ophthalmology', label: 'Ophthalmology', icon: '👁️' },
  { id: 'ent', label: 'ENT', icon: '👂' },
  { id: 'genetics', label: 'Genetics', icon: '🧬' },
  { id: 'anatomy', label: 'Anatomy', icon: '🫀' },
];

// Training Grounds Flow Component
function TrainingGroundsFlow({ onStart }) {
  const [tgStep, setTgStep] = useState('category'); // 'category' | 'difficulty' | 'topic'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null); // null = all topics
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTopics = async (category, difficulty) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/topics?category=${category}`);
      const data = await res.json();
      const allTopics = data.topics || [];
      // Filter by difficulty if provided
      const filtered = difficulty ? allTopics.filter(t => !t.difficulty || t.difficulty === difficulty) : allTopics;
      setTopics(filtered);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setTopics([]);
    }
    setLoading(false);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setTgStep('difficulty');
  };

  const handleDifficultySelect = (diff) => {
    setSelectedDifficulty(diff);
    fetchTopics(selectedCategory.id, diff);
    setTgStep('topic');
  };

  const handleStart = () => {
    onStart({
      category: selectedCategory.id,
      difficulty: selectedDifficulty,
      topicId: selectedTopic?.id || null,
      topicName: selectedTopic?.name || null,
      mode: selectedTopic ? 'specific' : 'all'
    });
  };

  // STEP: Category
  if (tgStep === 'category') {
    return (
      <div className="tg-flow">
        <div className="tg-header">
          <h3 className="tg-title">📚 Training Grounds</h3>
          <p className="tg-subtitle">Choose a category to begin</p>
        </div>
        {loading ? <p className="tg-loading">Loading...</p> : (
          <div className="tg-category-grid">
            {SUBJECTS.map(cat => (
              <div className="tg-category-card" key={cat.id} onClick={() => handleCategorySelect(cat)}>
                <span className="tg-category-name">{cat.label}</span>
              </div>
            ))}
            {SUBJECTS.length === 0 && <p className="tg-empty">No categories found.</p>}
          </div>
        )}
      </div>
    );
  }

  // STEP: Difficulty
  if (tgStep === 'difficulty') {
    return (
      <div className="tg-flow">
        <div className="tg-header">
          <button className="tg-back" onClick={() => setTgStep('category')}>← Back</button>
          <h3 className="tg-title">{selectedCategory.label}</h3>
          <p className="tg-subtitle">Choose difficulty</p>
        </div>
        <div className="tg-difficulty-row">
          <div className="tg-diff-card tg-diff-card--easy" onClick={() => handleDifficultySelect('easy')}>
            <span className="tg-diff-icon">🟢</span>
            <span className="tg-diff-label">Easy</span>
            <span className="tg-diff-sub">Standard questions</span>
          </div>
          <div className="tg-diff-card tg-diff-card--hard" onClick={() => handleDifficultySelect('hard')}>
            <span className="tg-diff-icon">🔴</span>
            <span className="tg-diff-label">Hard</span>
            <span className="tg-diff-sub">Advanced clinical</span>
          </div>
        </div>
      </div>
    );
  }

  // STEP: Topic (optional)
  if (tgStep === 'topic') {
    return (
      <div className="tg-flow">
        <div className="tg-header">
          <button className="tg-back" onClick={() => { setTgStep('difficulty'); setSelectedTopic(null); }}>← Back</button>
          <h3 className="tg-title">{selectedCategory.label} · {selectedDifficulty}</h3>
          <p className="tg-subtitle">Choose a topic — or skip to study all</p>
        </div>

        {/* Selected topic indicator */}
        {selectedTopic && (
          <div className="tg-selected-topic">
            <span>📁 {selectedTopic.name}</span>
            <button className="tg-clear-topic" onClick={() => setSelectedTopic(null)}>✕ Clear</button>
          </div>
        )}

        {/* Topic list */}
        {loading ? <p className="tg-loading">Loading topics...</p> : (
          <div className="tg-topics-list">
            {topics.map(topic => (
              <div
                className={`tg-topic-card ${selectedTopic?.id === topic.id ? 'tg-topic-card--selected' : ''}`}
                key={topic.id}
                onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
              >
                <span className="tg-topic-icon">📁</span>
                <span className="tg-topic-name">{topic.name}</span>
                {selectedTopic?.id === topic.id && <span className="tg-topic-check">✓</span>}
              </div>
            ))}
            {topics.length === 0 && <p className="tg-empty">No topics found.</p>}
          </div>
        )}

        {/* START button - always visible */}
        <button className="tg-start-btn" onClick={handleStart}>
          {selectedTopic ? `▶ Start — ${selectedTopic.name}` : '▶ Start — All Topics'}
        </button>
      </div>
    );
  }

  return null;
}

export default function PlayPage({
  user, username, onModeSelect, onBack, error, onClearError,
  lobbyId, lobbyPlayers, isHost, lobbySubject, lobbyGameMode, openToQuickJoin,
  onStartGame, onAddBot, onRemoveBot, onToggleQuickJoin, onLeaveLobby
}) {
  const [selectedMode, setSelectedMode] = useState('battle_royale');
  const [squadSize, setSquadSize] = useState('solo');
  const [fillTeam, setFillTeam] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [seasonTimeLeft, setSeasonTimeLeft] = useState('');
  const [selectedExam, setSelectedExam] = useState('usmle'); // default to USMLE
  const [selectedStep, setSelectedStep] = useState('step1'); // default to Step 1
  const [gameModesConfig, setGameModesConfig] = useState({});
  const [examBoardsConfig, setExamBoardsConfig] = useState({});
  const [playBgImage, setPlayBgImage] = useState('');
  const [lobbyCode, setLobbyCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const selectedModeData = GAME_MODES.find(m => m.id === selectedMode) || GAME_MODES[0];

  // Fetch game modes, exam boards configs, and background image
  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await authFetch('/api/game-settings');
        const data = await res.json();
        console.log('[PlayPage] Raw game_modes_config:', data.game_modes_config);
        console.log('[PlayPage] Type:', typeof data.game_modes_config);
        setGameModesConfig(data.game_modes_config || {});
        setExamBoardsConfig(data.exam_boards_config || {});
        setPlayBgImage(data.play_page_background || '');
      } catch (err) {
        console.error('Failed to load configs:', err);
      }
    }
    loadConfigs();
  }, []);

  // Fetch daily challenges
  useEffect(() => {
    async function loadChallenges() {
      try {
        const res = await authFetch('/api/quest-progress');
        const data = await res.json();
        const progress = (data.progress || []).slice(0, 3).map(p => ({
          id: p.quest_id,
          name: p.quest_name || 'Complete quest',
          icon: '🎯',
          progress: `${p.current_progress || 0}/${p.target || 1}`,
          percent: Math.min(100, ((p.current_progress || 0) / (p.target || 1)) * 100),
          reward: p.reward_coins || 100,
        }));
        setDailyChallenges(progress.length > 0 ? progress : getPlaceholderChallenges());
      } catch {
        setDailyChallenges(getPlaceholderChallenges());
      }
    }
    if (user) loadChallenges();
    else setDailyChallenges(getPlaceholderChallenges());
  }, [user]);

  // Fetch recent players
  useEffect(() => {
    async function loadRecentPlayers() {
      try {
        const res = await authFetch('/api/leaderboard/players');
        const data = await res.json();
        const players = (data.players || []).slice(0, 3).map(p => ({
          id: p.id,
          username: p.username,
          avatar: p.avatar_url || '',
          status: 'offline',
          statusText: 'Offline',
        }));
        setRecentPlayers(players);
      } catch {
        setRecentPlayers([]);
      }
    }
    if (user) loadRecentPlayers();
  }, [user]);

  // Season countdown timer (6 days from now)
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 6);
    targetDate.setHours(23, 59, 59, 999);

    function updateTimer() {
      const now = new Date();
      const diff = targetDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setSeasonTimeLeft(`${days}D ${hours}H ${mins}M`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  function getPlaceholderChallenges() {
    return [
      { id: 1, name: 'Answer 10 questions', icon: '🎯', progress: '0/10', percent: 0, reward: 100 },
      { id: 2, name: 'Win 3 matches', icon: '🏆', progress: '0/3', percent: 0, reward: 250 },
      { id: 3, name: 'Study Cardiology', icon: '❤️', progress: '0/1', percent: 0, reward: 150 },
    ];
  }

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

  function handleStartTraining(config) {
    // Navigate to solo practice / training game with the config
    onModeSelect({
      mode: 'training_grounds',
      action: 'start_training',
      ...config,
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
      <div className="play-page">

        {/* LEFT PANEL - Game Mode List */}
        <div className="play-left">
          <h3 className="panel-title">GAME MODE</h3>
          <div className="mode-list">
            {GAME_MODES.map(mode => {
              const isEnabled = gameModesConfig[mode.id]?.enabled ?? true;
              return (
                <div
                  key={mode.id}
                  className={`mode-list-item ${selectedMode === mode.id ? 'mode-list-item--active' : ''} ${!isEnabled ? 'mode-list-item--disabled' : ''}`}
                  onClick={() => isEnabled && setSelectedMode(mode.id)}
                >
                  <div className="mode-list-icon">{mode.icon}</div>
                  <div className="mode-list-info">
                    <h4>{mode.name}</h4>
                    <p>{!isEnabled ? 'Coming Soon' : mode.shortDesc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="exam-board-section">
            <h4 className="exam-board-title">CHOOSE EXAM BOARD</h4>

            <div className="exam-board-list">

              {/* USMLE */}
              {(() => {
                const usmlEnabled = examBoardsConfig.usmle?.enabled ?? true;
                const step1Enabled = examBoardsConfig.usmle?.steps?.step1?.enabled ?? true;
                const step2Enabled = examBoardsConfig.usmle?.steps?.step2?.enabled ?? true;

                return (
                  <>
                    <div
                      className={`exam-board-item ${selectedExam === 'usmle' ? 'exam-board-item--active' : ''} ${!usmlEnabled ? 'exam-board-item--locked' : ''}`}
                      onClick={() => usmlEnabled && setSelectedExam(selectedExam === 'usmle' ? null : 'usmle')}
                      title={!usmlEnabled ? 'Coming Soon' : ''}
                    >
                      <span className="exam-board-name">USMLE</span>
                      {!usmlEnabled ? (
                        <span className="coming-soon-tag">Soon</span>
                      ) : (
                        <span className="exam-board-arrow">{selectedExam === 'usmle' ? '▾' : '▸'}</span>
                      )}
                    </div>

                    {/* USMLE Steps - shown when USMLE is selected */}
                    {selectedExam === 'usmle' && usmlEnabled && (
                      <div className="exam-steps">
                        <div
                          className={`exam-step-item ${selectedStep === 'step1' ? 'exam-step-item--active' : ''} ${!step1Enabled ? 'exam-step-item--locked' : ''}`}
                          onClick={() => step1Enabled && setSelectedStep('step1')}
                          title={!step1Enabled ? 'Coming Soon' : ''}
                        >
                          <span className={`step-dot ${step1Enabled ? 'step-dot--available' : 'step-dot--locked'}`}>
                            {step1Enabled ? '●' : '🔒'}
                          </span>
                          Step 1
                          {!step1Enabled && <span className="coming-soon-tag">Soon</span>}
                        </div>
                        <div
                          className={`exam-step-item ${selectedStep === 'step2' ? 'exam-step-item--active' : ''} ${!step2Enabled ? 'exam-step-item--locked' : ''}`}
                          onClick={() => step2Enabled && setSelectedStep('step2')}
                          title={!step2Enabled ? 'Coming Soon' : ''}
                        >
                          <span className={`step-dot ${step2Enabled ? 'step-dot--available' : 'step-dot--locked'}`}>
                            {step2Enabled ? '●' : '🔒'}
                          </span>
                          Step 2
                          {!step2Enabled && <span className="coming-soon-tag">Soon</span>}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* PLAB */}
              {(() => {
                const plabEnabled = examBoardsConfig.plab?.enabled ?? false;
                return (
                  <div
                    className={`exam-board-item ${!plabEnabled ? 'exam-board-item--locked' : ''}`}
                    title={!plabEnabled ? 'Coming Soon' : ''}
                  >
                    <span className="exam-board-name">PLAB</span>
                    <span className="coming-soon-tag">Soon</span>
                  </div>
                );
              })()}

              {/* AMC */}
              {(() => {
                const amcEnabled = examBoardsConfig.amc?.enabled ?? false;
                return (
                  <div
                    className={`exam-board-item ${!amcEnabled ? 'exam-board-item--locked' : ''}`}
                    title={!amcEnabled ? 'Coming Soon' : ''}
                  >
                    <span className="exam-board-name">AMC</span>
                    <span className="coming-soon-tag">Soon</span>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>

        {/* CENTER PANEL - Selected Mode Detail */}
        <div className="play-center">
          <h1 className="play-title">PLAY</h1>
          <p className="play-subtitle">Choose your mode. Fight for glory.</p>

          <div className="mode-detail-card">
            <h2 className="mode-detail-title">
              <span className="mode-detail-icon">{selectedModeData.icon}</span>
              {selectedModeData.name}
            </h2>

            <div className="mode-detail-image">
              {(() => {
                const modeImage = gameModesConfig[selectedMode]?.image;
                console.log(`[PlayPage] Mode '${selectedMode}' image:`, modeImage);
                console.log('[PlayPage] Full config for mode:', gameModesConfig[selectedMode]);

                if (modeImage) {
                  return (
                    <img
                      src={modeImage}
                      alt={selectedModeData.name}
                      className="mode-detail-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        console.error('[PlayPage] Image failed to load:', modeImage);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => console.log('[PlayPage] Image loaded successfully:', modeImage)}
                    />
                  );
                }

                return (
                  <div className="mode-image-placeholder" style={{
                    background: `linear-gradient(135deg, rgba(40,60,40,0.8), rgba(20,30,20,0.9))`
                  }}>
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>{selectedModeData.icon}</span>
                  </div>
                );
              })()}
            </div>

            <p className="mode-detail-desc">{selectedModeData.longDescription}</p>

            {!selectedModeData.supportsSolo && (
              <>
                <div className="squad-section">
                  <label className="squad-label">SQUAD SIZE</label>
                  <div className="squad-options">
                    <button
                      className={squadSize === 'solo' ? 'squad-btn active' : 'squad-btn'}
                      onClick={() => setSquadSize('solo')}
                    >
                      👤 SOLO
                    </button>
                    <button
                      className={squadSize === 'duo' ? 'squad-btn active' : 'squad-btn'}
                      onClick={() => setSquadSize('duo')}
                    >
                      👥 DUO
                    </button>
                    <button
                      className={squadSize === 'squad' ? 'squad-btn active' : 'squad-btn'}
                      onClick={() => setSquadSize('squad')}
                    >
                      👥 SQUAD (4)
                    </button>
                  </div>
                </div>

                <div className="fill-team-section">
                  <label className="squad-label">FILL TEAM</label>
                  <div className="toggle-options">
                    <button
                      className={!fillTeam ? 'toggle-btn active' : 'toggle-btn'}
                      onClick={() => setFillTeam(false)}
                    >
                      OFF
                    </button>
                    <button
                      className={fillTeam ? 'toggle-btn active' : 'toggle-btn'}
                      onClick={() => setFillTeam(true)}
                    >
                      ON
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TRAINING GROUNDS FLOW or LOBBY ACTIONS */}
            {selectedMode === 'training_grounds' ? (
              <TrainingGroundsFlow onStart={handleStartTraining} />
            ) : (
              <>
                <div className="lobby-actions">

                  {/* CREATE LOBBY */}
                  <button
                    className="lobby-btn lobby-btn--create"
                    onClick={() => handleCreateLobby()}
                  >
                    <span className="lobby-btn-icon">⚔️</span>
                    <div className="lobby-btn-text">
                      <span className="lobby-btn-title">CREATE LOBBY</span>
                      <span className="lobby-btn-sub">Host your own game</span>
                    </div>
                  </button>

                  {/* JOIN LOBBY */}
                  <div className="join-lobby-combined">
                    <div className="join-lobby-label">
                      <span className="lobby-btn-icon">🚪</span>
                      <span className="join-lobby-title">JOIN LOBBY</span>
                    </div>
                    <div className="join-lobby-inline">
                      <input
                        className="join-lobby-inline-input"
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
                        className="join-lobby-inline-btn"
                        onClick={handleJoinLobby}
                        disabled={!lobbyCode.trim()}
                      >
                        JOIN →
                      </button>
                    </div>
                    {(joinError || error) && <p className="join-lobby-error">{joinError || error}</p>}
                  </div>

                  {/* FIND MATCH */}
                  <button
                    className="lobby-btn lobby-btn--find"
                    onClick={() => handleFindMatch()}
                  >
                    <span className="lobby-btn-icon">🔍</span>
                    <div className="lobby-btn-text">
                      <span className="lobby-btn-title">FIND MATCH</span>
                      <span className="lobby-btn-sub">Auto matchmaking</span>
                    </div>
                  </button>

                </div>

                <p className="wait-time">Estimated wait time: 00:15</p>
              </>
            )}
          </div>

        </div>

        {/* RIGHT PANEL - Season + Challenges + Rewards */}
        <div className="play-right">

          <div className="season-card">
            <h3>SEASON 2</h3>
            <div className="season-badge">2</div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '8px 0 4px' }}>
              SEASON ENDS IN
            </p>
            <p className="season-timer">{seasonTimeLeft}</p>
          </div>

          <div className="challenges-card">
            <h3>DAILY CHALLENGES</h3>
            {dailyChallenges.map(challenge => (
              <div key={challenge.id} className="challenge-item">
                <div className="challenge-icon">{challenge.icon}</div>
                <div className="challenge-info">
                  <p>{challenge.name}</p>
                  <div className="challenge-progress-bar">
                    <div style={{ width: `${challenge.percent}%` }} className="challenge-fill" />
                  </div>
                  <span>{challenge.progress}</span>
                </div>
                <span className="challenge-reward">🪙 {challenge.reward}</span>
              </div>
            ))}
            <button className="view-all-btn">VIEW ALL CHALLENGES</button>
          </div>

        </div>

      </div>

      {/* PARTY BAR - fixed at bottom above nav */}
      <div className="party-bar">

        {/* LEFT: Your Party + View All Friends */}
        <div className="party-left-group">
          <h4 className="party-bar-label">YOUR PARTY</h4>
          <div className="party-members">
            <div className="party-member">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="party-avatar" alt={username} referrerPolicy="no-referrer" />
              ) : (
                <div className="party-avatar party-avatar-placeholder">
                  {username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="party-name">{username}</span>
              <span className="leader-tag">Leader</span>
            </div>
            {[1, 2, 3].map(i => (
              <div className="party-member" key={i}>
                <div className="party-invite-btn">+</div>
                <span className="party-name">Invite</span>
              </div>
            ))}
          </div>
          <button className="view-friends-btn">VIEW ALL FRIENDS →</button>
        </div>

        {/* DIVIDER */}
        <div className="party-divider" />

        {/* RIGHT: Recent Players */}
        <div className="party-right-group">
          <h4 className="party-bar-label">RECENT PLAYERS</h4>
          <div className="recent-players-list">
            {recentPlayers.length > 0 ? (
              recentPlayers.map(player => (
                <div key={player.id} className="recent-player-item">
                  {player.avatar ? (
                    <img src={player.avatar} className="recent-player-avatar" alt={player.username} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="recent-player-avatar recent-player-avatar-placeholder">
                      {player.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="recent-player-name">{player.username}</span>
                  <span className={`status-dot status-dot--${player.status}`}></span>
                  <span className="status-text">{player.statusText}</span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>No recent players</p>
            )}
          </div>
        </div>

      </div>

      {/* LOBBY OVERLAY - shows when lobby is active */}
      {lobbyId && (
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
                <button className="lobby-add-bot-btn" onClick={() => onAddBot('medium')}>
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
