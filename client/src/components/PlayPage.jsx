import { useState, useEffect } from 'react';
import { authFetch } from '../auth';
import './PlayPage.css';
import AnKingMode from './AnKingMode';

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
  {
    id: 'anking',
    name: 'ANKING',
    icon: '🃏',
    shortDesc: 'Master AnKing flashcards',
    longDescription: 'Study and master AnKing flashcards. Flip cards, test your knowledge, and track your progress through the entire AnKing deck.',
    supportsSolo: true,
  },
];

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
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [openPanel, setOpenPanel] = useState(null); // 'category' | 'difficulty' | null
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    if (selectedCategory && selectedDifficulty) fetchTopics();
  }, [selectedCategory, selectedDifficulty]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/topics`);
      const data = await res.json();
      console.log('Topics API response:', data);

      // Extract unique categories from topics array
      const topicsArray = data.topics || [];
      const unique = [...new Set(topicsArray.map(t => t.category).filter(Boolean))];
      setCategories(unique);
    } catch(e) {
      console.error('fetchCategories error:', e);
    }
    setLoading(false);
  };

  const fetchTopics = async () => {
    if (!selectedCategory || !selectedDifficulty) return;
    setLoading(true);
    try {
      // Fetch topics
      const topicsRes = await fetch(`${SERVER_URL}/api/topics?category=${encodeURIComponent(selectedCategory)}`);
      const topicsData = await topicsRes.json();
      console.log('Topics for category:', topicsData);

      // Filter by difficulty on client side (API returns all topics for the category)
      const topicsArray = topicsData.topics || [];
      const filtered = topicsArray.filter(t => (t.difficulty || 'easy') === selectedDifficulty);

      // Fetch question counts filtered by subject and difficulty
      const countsRes = await fetch(`${SERVER_URL}/api/questions/counts?subject=${encodeURIComponent(selectedCategory)}&difficulty=${selectedDifficulty}`);
      const counts = await countsRes.json();
      console.log('Question counts:', counts);

      // Merge counts into topics
      const topicsWithCounts = filtered.map(t => ({
        ...t,
        questionCount: counts[t.id] || 0
      }));

      setTopics(topicsWithCounts);
    } catch(e) {
      console.error('fetchTopics error:', e);
      setTopics([]);
    }
    setLoading(false);
  };

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.find(t => t.id === topic.id)
        ? prev.filter(t => t.id !== topic.id)
        : [...prev, topic]
    );
  };

  const handleStart = () => {
    if (!selectedCategory || !selectedDifficulty) return;
    onStart({
      category: selectedCategory,
      difficulty: selectedDifficulty,
      topicIds: selectedTopics.map(t => t.id),
      topicNames: selectedTopics.map(t => t.name),
      mode: selectedTopics.length === 0 ? 'all' : 'multi'
    });
  };

  const canStart = selectedCategory && selectedDifficulty;

  return (
    <div className="tg-flow">

      {/* BUTTON 1 - Choose Category */}
      <div className="tg-selector">
        <button
          className={`tg-selector-btn ${selectedCategory ? 'tg-selector-btn--selected' : ''} ${openPanel === 'category' ? 'tg-selector-btn--open' : ''}`}
          onClick={() => setOpenPanel(openPanel === 'category' ? null : 'category')}
        >
          <span className="tg-selector-icon">📚</span>
          <span className="tg-selector-label">
            {selectedCategory || 'Choose Category'}
          </span>
          <span className="tg-selector-arrow">{openPanel === 'category' ? '▴' : '▾'}</span>
        </button>

        {openPanel === 'category' && (
          <div className="tg-dropdown">
            {loading && <p className="tg-loading">Loading...</p>}
            <div className="tg-category-chips">
              {categories.map(cat => (
                <div
                  className={`tg-category-chip ${selectedCategory === cat ? 'tg-category-chip--selected' : ''}`}
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedTopics([]);
                    setOpenPanel(null);
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BUTTON 2 - Choose Difficulty */}
      <div className="tg-selector">
        <button
          className={`tg-selector-btn ${selectedDifficulty ? 'tg-selector-btn--selected' : ''} ${openPanel === 'difficulty' ? 'tg-selector-btn--open' : ''}`}
          onClick={() => setOpenPanel(openPanel === 'difficulty' ? null : 'difficulty')}
        >
          <span className="tg-selector-icon">
            {selectedDifficulty === 'easy' ? '🟢' : selectedDifficulty === 'hard' ? '🔴' : '⚔️'}
          </span>
          <span className="tg-selector-label">
            {selectedDifficulty ? (selectedDifficulty === 'easy' ? 'Easy Mode' : 'Hard Mode') : 'Choose Difficulty'}
          </span>
          <span className="tg-selector-arrow">{openPanel === 'difficulty' ? '▴' : '▾'}</span>
        </button>

        {openPanel === 'difficulty' && (
          <div className="tg-dropdown tg-dropdown--difficulty">
            <div
              className={`tg-diff-option tg-diff-option--easy ${selectedDifficulty === 'easy' ? 'tg-diff-option--selected' : ''}`}
              onClick={() => { setSelectedDifficulty('easy'); setSelectedTopics([]); setOpenPanel(null); }}
            >
              <span>🟢</span>
              <div>
                <p className="tg-diff-name">Easy Mode</p>
                <p className="tg-diff-desc">Standard foundational questions</p>
              </div>
              {selectedDifficulty === 'easy' && <span className="tg-check">✓</span>}
            </div>
            <div
              className={`tg-diff-option tg-diff-option--hard ${selectedDifficulty === 'hard' ? 'tg-diff-option--selected' : ''}`}
              onClick={() => { setSelectedDifficulty('hard'); setSelectedTopics([]); setOpenPanel(null); }}
            >
              <span>🔴</span>
              <div>
                <p className="tg-diff-name">Hard Mode</p>
                <p className="tg-diff-desc">Advanced clinical questions</p>
              </div>
              {selectedDifficulty === 'hard' && <span className="tg-check">✓</span>}
            </div>
          </div>
        )}
      </div>

      {/* OPTIONAL - Choose Topics (only shown after category + difficulty selected) */}
      {canStart && (
        <div className="tg-selector">
          <button
            className={`tg-selector-btn ${selectedTopics.length > 0 ? 'tg-selector-btn--selected' : ''} ${openPanel === 'topics' ? 'tg-selector-btn--open' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'topics' ? null : 'topics')}
          >
            <span className="tg-selector-icon">📁</span>
            <span className="tg-selector-label">
              {selectedTopics.length === 0 ? 'Choose Topics (Optional)' : `${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''} selected`}
            </span>
            <span className="tg-selector-arrow">{openPanel === 'topics' ? '▴' : '▾'}</span>
          </button>

          {openPanel === 'topics' && (
            <div className="tg-dropdown tg-dropdown--topics">
              {loading && <p className="tg-loading">Loading topics...</p>}
              {selectedTopics.length > 0 && (
                <div className="tg-selected-chips">
                  {selectedTopics.map(t => (
                    <span className="tg-selected-chip" key={t.id}>
                      {t.name}
                      <button onClick={(e) => { e.stopPropagation(); toggleTopic(t); }}>✕</button>
                    </span>
                  ))}
                  <button className="tg-clear-all" onClick={() => setSelectedTopics([])}>Clear all</button>
                </div>
              )}
              <div className="tg-topics-list">
                {topics.map(topic => {
                  const isEmpty = topic.questionCount === 0;
                  const isSelected = selectedTopics.find(t => t.id === topic.id);
                  return (
                    <div
                      className={`tg-topic-card ${isSelected ? 'tg-topic-card--selected' : ''} ${isEmpty ? 'tg-topic-card--empty' : ''}`}
                      key={topic.id}
                      onClick={() => !isEmpty && toggleTopic(topic)}
                      style={{ cursor: isEmpty ? 'not-allowed' : 'pointer' }}
                    >
                      <span className="tg-topic-icon">📁</span>
                      <span className="tg-topic-name">{topic.name}</span>
                      <span className={`tg-topic-count ${isEmpty ? 'tg-topic-count--empty' : ''}`}>
                        {isEmpty ? 'No Qs' : `${topic.questionCount} Q`}
                      </span>
                      {!isEmpty && (isSelected
                        ? <span className="tg-topic-check">✓</span>
                        : <span className="tg-topic-plus">+</span>)}
                    </div>
                  );
                })}
                {!loading && topics.length === 0 && <p className="tg-empty">No topics found.</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* START BUTTON */}
      <button
        className={`tg-start-btn ${!canStart ? 'tg-start-btn--disabled' : ''}`}
        onClick={handleStart}
        disabled={!canStart}
      >
        {!selectedCategory ? '← Select a category first' :
         !selectedDifficulty ? '← Select difficulty' :
         selectedTopics.length === 0 ? '▶ Start — All Topics' :
         `▶ Start — ${selectedTopics.length} Topic${selectedTopics.length > 1 ? 's' : ''}`}
      </button>

    </div>
  );
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [recentPlayersOnline, setRecentPlayersOnline] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [inviteSent, setInviteSent] = useState({});

  const selectedModeData = GAME_MODES.find(m => m.id === selectedMode) || GAME_MODES[0];

  // Fetch game modes, exam boards configs, and background image
  useEffect(() => {
    async function loadConfigs() {
      try {
        const res = await authFetch('/api/game-settings');
        const data = await res.json();
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
        const res = await fetch(`${SERVER_URL}/api/daily-quests/${user?.id || 'guest'}`);
        const data = await res.json();
        const quests = (data || []).slice(0, 3).map(q => ({
          id: q.id,
          name: q.name || 'Complete quest',
          icon: q.icon || '🎯',
          icon_image: q.icon_image || null,
          progress: `${q.progress || 0}/${q.target || 1}`,
          current: q.progress || 0,
          target: q.target || 1,
          percent: Math.min(100, ((q.progress || 0) / (q.target || 1)) * 100),
          coin_reward: q.coin_reward || 0,
          gem_reward: q.gem_reward || 0,
          completed: q.completed || false,
        }));
        setDailyChallenges(quests.length > 0 ? quests : getPlaceholderChallenges());
      } catch (e) {
        console.error('Failed to fetch daily challenges:', e);
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

  const fetchOnlinePlayers = async () => {
    setLoadingInvites(true);
    try {
      const [friendsRes, recentRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/friends/${user?.id}`),
        fetch(`${SERVER_URL}/api/players/recent/${user?.id}`)
      ]);
      const friendsData = await friendsRes.json();
      const recentData = await recentRes.json().catch(() => []);

      // Filter to only online friends
      const online = (friendsData || []).filter(f => f.status === 'online' || f.is_online);
      setOnlineFriends(online);
      setRecentPlayersOnline((recentData || []).filter(p => p.status === 'online' || p.is_online));
    } catch(e) {
      console.error('fetchOnlinePlayers error:', e);
    }
    setLoadingInvites(false);
  };

  const handleInviteClick = () => {
    setShowInviteModal(true);
    fetchOnlinePlayers();
  };

  const handleSendInvite = async (playerId, playerName) => {
    try {
      await fetch(`${SERVER_URL}/api/lobby/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: user?.id,
          fromUsername: user?.username,
          toUserId: playerId,
          lobbyCode: lobbyState?.code || null,
          gameMode: selectedMode
        })
      });
      setInviteSent(prev => ({ ...prev, [playerId]: true }));
      setTimeout(() => setInviteSent(prev => ({ ...prev, [playerId]: false })), 3000);
    } catch(e) { console.error(e); }
  };

  function handleStartTraining(config) {
    console.log('handleStartTraining called with:', config);
    const { mode: studyMode, ...rest } = config; // rename 'mode' from config to 'studyMode'
    // Navigate to solo practice / training game with the config
    onModeSelect({
      mode: 'training_grounds',
      action: 'start_training',
      studyMode,  // 'all', 'specific', or 'multi'
      ...rest,
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
          <div className="mode-detail-card">
            <h2 className="mode-detail-title">
              <span className="mode-detail-icon">{selectedModeData.icon}</span>
              {selectedModeData.name}
            </h2>

            {/* Hide image and description for training_grounds */}
            {selectedMode !== 'training_grounds' && (
              <>
                <div className="mode-detail-image">
                  {(() => {
                    const modeImage = gameModesConfig[selectedMode]?.image;

                    if (modeImage) {
                      return (
                        <img
                          loading="lazy"
                          src={modeImage}
                          alt={selectedModeData.name}
                          className="mode-detail-img"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
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
              </>
            )}

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

            {/* ANKING MODE or TRAINING GROUNDS FLOW or LOBBY ACTIONS */}
            {selectedMode === 'anking' ? (
              <div className="mode-detail-card" style={{overflow:'hidden', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <AnKingMode
                  user={user}
                  config={{limit: 20}}
                  onBack={() => setSelectedMode('battle_royale')}
                  onComplete={(results) => console.log('AnKing session complete:', results)}
                />
              </div>
            ) : selectedMode === 'training_grounds' ? (
              <>
                {/* Training Grounds Image */}
                <div className="mode-detail-image" style={{flexShrink: 0, height: '100px'}}>
                  {(() => {
                    const modeImage = gameModesConfig['training_grounds']?.image;
                    if (modeImage) {
                      return (
                        <img
                          loading="lazy"
                          src={modeImage}
                          alt="Training Grounds"
                          style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'8px'}}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      );
                    }
                    return (
                      <div className="mode-image-placeholder" style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        <span style={{fontSize:'40px'}}>📚</span>
                      </div>
                    );
                  })()}
                </div>

                <TrainingGroundsFlow onStart={handleStartTraining} />
              </>
            ) : (
              <>
                <div className="lobby-actions">

                  {/* CREATE LOBBY - full width */}
                  <button
                    className="lobby-btn lobby-btn--create"
                    onClick={handleCreateLobby}
                  >
                    <span className="lobby-btn-icon">⚔️</span>
                    <div className="lobby-btn-text">
                      <span className="lobby-btn-title">CREATE LOBBY</span>
                    </div>
                  </button>

                  {/* JOIN LOBBY + FIND MATCH - side by side */}
                  <div className="lobby-btn-row">

                    {/* JOIN LOBBY with inline input */}
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
                      {joinError && <p className="join-lobby-error">{joinError}</p>}
                    </div>

                    {/* FIND MATCH */}
                    <button
                      className="lobby-btn lobby-btn--find"
                      onClick={handleFindMatch}
                    >
                      <span className="lobby-btn-icon">🔍</span>
                      <div className="lobby-btn-text">
                        <span className="lobby-btn-title">FIND MATCH</span>
                      </div>
                    </button>

                  </div>

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
            {dailyChallenges.length === 0 ? (
              <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:'Cinzel,serif', textAlign:'center', padding:'10px'}}>
                No challenges today
              </p>
            ) : (
              dailyChallenges.map(challenge => (
                <div key={challenge.id} className="challenge-item">
                  <div className="challenge-icon">
                    {challenge.icon_image ? (
                      <img src={challenge.icon_image} alt={challenge.name} style={{width:'28px', height:'28px', objectFit:'cover', borderRadius:'6px'}} />
                    ) : (
                      <span style={{fontSize:'20px'}}>{challenge.icon || '⚔️'}</span>
                    )}
                  </div>
                  <div className="challenge-info">
                    <p>{challenge.name}</p>
                    <div className="challenge-progress-bar">
                      <div style={{ width: `${challenge.percent}%` }} className="challenge-fill" />
                    </div>
                    <span>{challenge.progress}</span>
                  </div>
                  <span className="challenge-reward">
                    {challenge.coin_reward > 0 && `🪙 ${challenge.coin_reward}`}
                    {challenge.gem_reward > 0 && ` 💎 ${challenge.gem_reward}`}
                  </span>
                </div>
              ))
            )}
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
                <img loading="lazy" src={user.avatar_url} className="party-avatar" alt={username} referrerPolicy="no-referrer" />
              ) : (
                <div className="party-avatar party-avatar-placeholder">
                  {username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="party-name">{username}</span>
              <span className="leader-tag">Leader</span>
            </div>
            {[1, 2, 3].map(i => (
              <div className="party-member" key={i} onClick={handleInviteClick} style={{ cursor: 'pointer' }}>
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
                    <img loading="lazy" src={player.avatar} className="recent-player-avatar" alt={player.username} referrerPolicy="no-referrer" />
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

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="invite-modal-overlay" onClick={e => e.target === e.currentTarget && setShowInviteModal(false)}>
          <div className="invite-modal">
            <div className="invite-modal-header">
              <h3>Invite to Game</h3>
              <button className="invite-modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>

            {loadingInvites ? (
              <div className="invite-loading">Loading players...</div>
            ) : (
              <div className="invite-modal-content">

                {/* Online Friends */}
                <div className="invite-section">
                  <p className="invite-section-label">👥 FRIENDS ONLINE</p>
                  {onlineFriends.length === 0 ? (
                    <p className="invite-empty">No friends currently online</p>
                  ) : (
                    onlineFriends.map(friend => (
                      <div className="invite-player-row" key={friend.id}>
                        <div className="invite-player-avatar">
                          {friend.avatar_url
                            ? <img src={friend.avatar_url} alt={friend.username} />
                            : <span>{friend.username?.[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div className="invite-player-info">
                          <span className="invite-player-name">{friend.username}</span>
                          <span className="invite-player-status">🟢 Online</span>
                        </div>
                        <button
                          className={`invite-send-btn ${inviteSent[friend.id] ? 'invite-send-btn--sent' : ''}`}
                          onClick={() => handleSendInvite(friend.id, friend.username)}
                          disabled={inviteSent[friend.id]}
                        >
                          {inviteSent[friend.id] ? '✓ Sent!' : '⚔️ Invite'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Players Online */}
                {recentPlayersOnline.length > 0 && (
                  <div className="invite-section">
                    <p className="invite-section-label">🕐 RECENT PLAYERS ONLINE</p>
                    {recentPlayersOnline.map(player => (
                      <div className="invite-player-row" key={player.id}>
                        <div className="invite-player-avatar">
                          {player.avatar_url
                            ? <img src={player.avatar_url} alt={player.username} />
                            : <span>{player.username?.[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div className="invite-player-info">
                          <span className="invite-player-name">{player.username}</span>
                          <span className="invite-player-status">🟢 Online</span>
                        </div>
                        <button
                          className={`invite-send-btn ${inviteSent[player.id] ? 'invite-send-btn--sent' : ''}`}
                          onClick={() => handleSendInvite(player.id, player.username)}
                          disabled={inviteSent[player.id]}
                        >
                          {inviteSent[player.id] ? '✓ Sent!' : '⚔️ Invite'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
