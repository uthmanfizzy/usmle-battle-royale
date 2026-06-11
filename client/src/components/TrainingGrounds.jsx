import { useState } from 'react';
import './TrainingGrounds.css';

const SERVER = 'https://usmle-battle-royale-production.up.railway.app';

// Subject categories matching SubjectSelect
const SUBJECTS = [
  { id: 'cardiology',       label: 'Cardiology',                   icon: '❤️',  desc: 'Heart, ECG, vascular'                    },
  { id: 'neurology',        label: 'Neurology',                    icon: '🧠', desc: 'Brain, nerves, seizures'                  },
  { id: 'pharmacology',     label: 'Pharmacology',                 icon: '💊', desc: 'Drugs, mechanisms, interactions'          },
  { id: 'microbiology',     label: 'Microbiology',                 icon: '🦠', desc: 'Bacteria, viruses, fungi'                 },
  { id: 'biochemistry',     label: 'Biochemistry',                 icon: '⚗️', desc: 'Metabolism, enzymes, genetics'            },
  { id: 'biostatistics',    label: 'Biostatistics',                icon: '📊', desc: 'Stats, study design, bias'               },
  { id: 'pathology',        label: 'Pathology',                    icon: '🔬', desc: 'Disease mechanisms, histology'            },
  { id: 'pulmonology',      label: 'Pulmonology',                  icon: '🫁', desc: 'Lungs, airways, respiratory'              },
  { id: 'nephrology',       label: 'Nephrology',                   icon: '💧', desc: 'Kidneys, fluids, electrolytes'            },
  { id: 'gastroenterology', label: 'Gastroenterology',             icon: '🫃', desc: 'GI tract, liver, pancreas'               },
  { id: 'endocrinology',    label: 'Endocrinology',                icon: '🦋', desc: 'Hormones, thyroid, diabetes'             },
  { id: 'haematology',      label: 'Haematology',                  icon: '🩸', desc: 'Blood, anaemia, coagulation'             },
  { id: 'immunology',       label: 'Immunology',                   icon: '🛡️', desc: 'Immune system, autoimmune'               },
  { id: 'musculoskeletal',  label: 'Musculoskeletal',              icon: '🦴', desc: 'Bones, joints, muscles'                  },
  { id: 'dermatology',      label: 'Dermatology',                  icon: '🩹', desc: 'Skin, hair, nails'                       },
  { id: 'reproductive',     label: 'Reproductive & Obstetrics',    icon: '👶', desc: 'Reproduction, pregnancy, birth'          },
  { id: 'psychiatry',       label: 'Psychiatry & Behavioural Science', icon: '🧠', desc: 'Mental health, behaviour'            },
  { id: 'ophthalmology',    label: 'Ophthalmology',                icon: '👁️', desc: 'Eyes, vision, ocular disease'            },
  { id: 'ent',              label: 'ENT',                          icon: '👂', desc: 'Ear, nose & throat'                      },
  { id: 'genetics',         label: 'Genetics & Embryology',        icon: '🧬', desc: 'Genetics, inheritance, development'      },
  { id: 'anatomy',          label: 'Anatomy',                      icon: '🫀', desc: 'Structure, physiology, systems'          },
];

// Click-to-play video card: thumbnail until clicked, then the embedded player.
function VideoCard({ video, general, playing, onPlay }) {
  const embedSrc = video.video_type === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${video.embed_id}?autoplay=1`
    : `https://player.vimeo.com/video/${video.embed_id}?autoplay=1`;
  return (
    <div className="tg-video-card">
      <div className="tg-video-frame">
        {playing ? (
          <iframe
            src={embedSrc}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button className="tg-video-thumb-btn" onClick={onPlay} title={`Play ${video.title}`}>
            {video.video_type === 'youtube' ? (
              <img
                className="tg-video-thumb"
                src={`https://img.youtube.com/vi/${video.embed_id}/hqdefault.jpg`}
                alt={video.title}
                loading="lazy"
              />
            ) : (
              <div className="tg-video-thumb tg-video-thumb--vimeo">🎬</div>
            )}
            <span className="tg-video-play">▶</span>
          </button>
        )}
      </div>
      <div className="tg-video-meta">
        <span className="tg-video-title">{video.title}</span>
        <span className="tg-video-badges">
          {general && <span className="tg-video-general">GENERAL</span>}
          <span className={`tg-video-source tg-video-source--${video.video_type}`}>
            {video.video_type === 'youtube' ? '▶ YouTube' : '🎬 Vimeo'}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function TrainingGrounds({ user, onBack, onStartPractice }) {
  // screens: 'subject' | 'difficulty' | 'topic' | 'action' | 'videos'
  const [screen, setScreen] = useState('subject');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [allFolders, setAllFolders] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // Videos cached per category|difficulty — one fetch serves both the
  // action-screen count and the videos grid
  const [videosCache, setVideosCache] = useState({});
  const [videosLoading, setVideosLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null); // one player at a time

  const subject = SUBJECTS.find(s => s.id === selectedSubject);

  // ── Data ─────────────────────────────────────────────────────────────────────

  async function fetchFolders(subjectId) {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/topics?category=${subjectId}`);
      const data = await res.json();
      setAllFolders(data.topics || []);
      setAllGroups(data.groups || []);
      setSelectedSubject(subjectId);
      setSelectedDifficulty(null);
      setSelectedTopic(null);
      setScreen('difficulty');
    } catch (err) {
      console.error('Failed to load topics:', err);
      setAllFolders([]);
      setAllGroups([]);
    }
    setLoading(false);
  }

  async function loadVideos(category, difficulty) {
    const key = `${category}|${difficulty}`;
    if (key in videosCache) return;
    setVideosLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/videos?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}`);
      const data = await res.json();
      setVideosCache(prev => ({ ...prev, [key]: data.videos || [] }));
    } catch (err) {
      console.error('Failed to load videos:', err);
      setVideosCache(prev => ({ ...prev, [key]: [] }));
    }
    setVideosLoading(false);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function goTo(target) {
    setPlayingId(null);
    setScreen(target);
  }

  function handleDifficultySelect(difficulty) {
    setSelectedDifficulty(difficulty);
    setSelectedTopic(null);
    setScreen('topic');
  }

  function handleTopicClick(folder) {
    setSelectedTopic(folder);
    setPlayingId(null);
    setScreen('action');
    loadVideos(selectedSubject, selectedDifficulty);
  }

  function startQuestions() {
    // Same payload shape as before, plus difficulty (App.jsx reads
    // topicData.difficulty — it was previously missing from this page)
    onStartPractice({
      topicId: selectedTopic.id,
      topicName: selectedTopic.name,
      subjectName: subject?.label || selectedSubject,
      category: selectedSubject,
      difficulty: selectedDifficulty,
    });
  }

  // ── Derived data ─────────────────────────────────────────────────────────────

  const activeFolders    = allFolders.filter(f => (f.difficulty || 'easy') === selectedDifficulty);
  const activeGroups     = allGroups.filter(g => (g.difficulty || 'easy') === selectedDifficulty);
  const ungroupedFolders = activeFolders.filter(f => !f.group_id);

  const videosKey     = `${selectedSubject}|${selectedDifficulty}`;
  const videos        = videosCache[videosKey]; // undefined = not fetched yet
  const topicVideos   = selectedTopic ? (videos || []).filter(v => v.topic_id === selectedTopic.id) : [];
  const generalVideos = (videos || []).filter(v => !v.topic_id);
  const videoCount    = topicVideos.length + generalVideos.length;

  const diffLabel = selectedDifficulty === 'hard' ? 'Hard Mode' : 'Easy Mode';

  // ── Shared header: back button + clickable breadcrumb ────────────────────────

  const BACK = {
    subject:    { label: '← Back to Game Modes', go: onBack },
    difficulty: { label: '← Subjects',           go: () => goTo('subject') },
    topic:      { label: '← Difficulty',         go: () => goTo('difficulty') },
    action:     { label: '← Topics',             go: () => goTo('topic') },
    videos:     { label: '← Back',               go: () => goTo('action') },
  }[screen];

  const crumbs = [
    { label: 'Training Grounds', target: 'subject', show: true },
    { label: subject?.label, target: 'difficulty', show: !!subject && screen !== 'subject' },
    { label: diffLabel, target: 'topic', show: !!selectedDifficulty && ['topic', 'action', 'videos'].includes(screen) },
    { label: selectedTopic?.name, target: 'action', show: !!selectedTopic && ['action', 'videos'].includes(screen) },
  ].filter(c => c.show);

  function renderHeader(title, subtitle) {
    return (
      <div className="tg-header">
        <div className="tg-breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.target}>
              {i > 0 && <span className="tg-crumb-sep"> › </span>}
              {i < crumbs.length - 1 ? (
                <span className="tg-crumb tg-crumb--link" onClick={() => goTo(c.target)}>{c.label}</span>
              ) : (
                <span className="tg-crumb">{c.label}</span>
              )}
            </span>
          ))}
        </div>
        <h1 className="tg-title">{title}</h1>
        {subtitle && <p className="tg-subtitle">{subtitle}</p>}
      </div>
    );
  }

  // ── Render pieces ────────────────────────────────────────────────────────────

  const renderFolderCard = (folder) => (
    <button
      key={folder.id}
      className={`tg-folder-card tg-folder-card--${selectedDifficulty}`}
      onClick={() => handleTopicClick(folder)}
    >
      <div className="tg-folder-icon">📁</div>
      <div className="tg-folder-name">{folder.name}</div>
      {folder.question_count > 0 && (
        <div className="tg-folder-qcount">{folder.question_count} questions</div>
      )}
    </button>
  );

  return (
    <div className="training-grounds">
      <div className="training-overlay">
        <button className="tg-back-btn" onClick={BACK.go}>{BACK.label}</button>

        {/* ── SCREEN: Subject ──────────────────────────────────────── */}
        {screen === 'subject' && (
          <>
            {renderHeader('⚔️ Training Grounds', 'Choose a subject to begin your training')}
            {loading ? (
              <div className="tg-loading"><div className="spinner"></div><p>Loading...</p></div>
            ) : (
              <div className="tg-subject-grid">
                {SUBJECTS.map(s => (
                  <button key={s.id} className="tg-subject-card" onClick={() => fetchFolders(s.id)}>
                    <div className="tg-subject-icon">{s.icon}</div>
                    <div className="tg-subject-label">{s.label}</div>
                    <div className="tg-subject-desc">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SCREEN: Difficulty ───────────────────────────────────── */}
        {screen === 'difficulty' && (
          <>
            {renderHeader('Choose Difficulty', 'Select the challenge level for your training')}
            <div className="tg-difficulty-grid">
              <button className="tg-difficulty-card tg-difficulty-card--easy" onClick={() => handleDifficultySelect('easy')}>
                <div className="tg-diff-icon">🟢</div>
                <h3 className="tg-diff-title">Easy Mode</h3>
                <p className="tg-diff-desc">
                  Standard questions with straightforward presentations. Perfect for building foundational knowledge.
                </p>
                <div className="tg-diff-count">
                  {allFolders.filter(f => !f.difficulty || f.difficulty === 'easy').length} topics available
                </div>
              </button>
              <button className="tg-difficulty-card tg-difficulty-card--hard" onClick={() => handleDifficultySelect('hard')}>
                <div className="tg-diff-icon">🔴</div>
                <h3 className="tg-diff-title">Hard Mode</h3>
                <p className="tg-diff-desc">
                  Complex clinical scenarios with tricky presentations. Test your deeper understanding.
                </p>
                <div className="tg-diff-count">
                  {allFolders.filter(f => f.difficulty === 'hard').length} topics available
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN: Topic folders (keeps PR-3 group sections) ────── */}
        {screen === 'topic' && (
          <>
            {renderHeader(`${subject?.icon || ''} ${subject?.label || ''}`, 'Select a topic to practice or watch videos')}
            <div className="training-folders">
              {activeGroups.map(group => {
                const members = activeFolders.filter(f => f.group_id === group.id);
                if (members.length === 0) return null;
                return (
                  <div className="tg-group-section" key={group.id}>
                    <div className="tg-group-label">🗂️ {group.name}</div>
                    <div className="tg-folder-grid">{members.map(renderFolderCard)}</div>
                  </div>
                );
              })}
              <div className="tg-folder-grid">
                {ungroupedFolders.map(renderFolderCard)}
                {activeFolders.length === 0 && (
                  <div className="tg-empty">
                    <p>No {selectedDifficulty} topics available for this subject yet.</p>
                    <p className="tg-empty-sub">
                      Try selecting {selectedDifficulty === 'easy' ? 'Hard' : 'Easy'} mode or check back soon!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── SCREEN: Action (Start Questions / Watch Videos) ──────── */}
        {screen === 'action' && selectedTopic && (
          <>
            {renderHeader(`📁 ${selectedTopic.name}`,
              `${selectedTopic.question_count || 0} questions · ${subject?.label} · ${diffLabel}`)}
            <div className="tg-action-cards">
              <button className="tg-action-card tg-action-card--questions" onClick={startQuestions}>
                <span className="tg-action-card-icon">▶</span>
                <span className="tg-action-card-title">START QUESTIONS</span>
                <span className="tg-action-card-sub">
                  {selectedTopic.question_count || 0} question{(selectedTopic.question_count || 0) !== 1 ? 's' : ''} · practice at your own pace
                </span>
              </button>
              <button
                className={`tg-action-card tg-action-card--videos ${videos !== undefined && videoCount === 0 ? 'tg-action-card--disabled' : ''}`}
                onClick={() => goTo('videos')}
                disabled={videos !== undefined && videoCount === 0}
              >
                <span className="tg-action-card-icon">🎬</span>
                <span className="tg-action-card-title">WATCH VIDEOS</span>
                <span className="tg-action-card-sub">
                  {videos === undefined
                    ? (videosLoading ? 'Loading…' : '')
                    : videoCount === 0
                      ? 'No videos yet'
                      : `${videoCount} video${videoCount !== 1 ? 's' : ''} for this topic & subject`}
                </span>
              </button>
            </div>
          </>
        )}

        {/* ── SCREEN: Videos ────────────────────────────────────────── */}
        {screen === 'videos' && selectedTopic && (
          <>
            {renderHeader(`🎬 ${selectedTopic.name}`, 'Watch and learn — then test yourself')}
            {videos === undefined ? (
              <div className="tg-loading"><div className="spinner"></div><p>Loading videos...</p></div>
            ) : videoCount === 0 ? (
              <div className="tg-empty">
                <p>No videos for this topic yet — check back soon!</p>
                <button className="tg-start-instead-btn" onClick={startQuestions}>▶ Start Questions instead</button>
              </div>
            ) : (
              <div className="tg-videos-wrap">
                {topicVideos.length > 0 && (
                  <div className="tg-videos-section">
                    <h3 className="tg-videos-section-head">📁 {selectedTopic.name}</h3>
                    <div className="tg-video-grid">
                      {topicVideos.map(v => (
                        <VideoCard key={v.id} video={v} playing={playingId === v.id} onPlay={() => setPlayingId(v.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {topicVideos.length === 0 && generalVideos.length > 0 && (
                  <p className="tg-videos-note">
                    No videos for this topic yet — here are the general {subject?.label} videos.
                  </p>
                )}
                {generalVideos.length > 0 && (
                  <div className="tg-videos-section">
                    <h3 className="tg-videos-section-head">📚 General {subject?.label} videos</h3>
                    <div className="tg-video-grid">
                      {generalVideos.map(v => (
                        <VideoCard key={v.id} video={v} general playing={playingId === v.id} onPlay={() => setPlayingId(v.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
