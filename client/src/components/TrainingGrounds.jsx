import { useState, useEffect } from 'react';
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
  { id: 'haematology_oncology', label: 'Haematology & Oncology',   icon: '🩸', desc: 'Blood cancers, leukaemia, lymphoma'     },
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

// Fallback when /api/subjects is unreachable — the server's known-active defaults
const DEFAULT_ACTIVE_IDS = new Set([
  'cardiology', 'neurology', 'pharmacology', 'microbiology', 'biochemistry', 'biostatistics',
]);

// Placeholder per-subject progress ring. Driven by subjectProgress[s.id] ?? 0 —
// real completion data drops in later by populating that map; no markup change.
function ProgressRing({ percent }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <div className="tg-progress-ring" title={`${percent}% complete`}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle className="tg-ring-track" cx="20" cy="20" r={r} />
        <circle
          className="tg-ring-fill"
          cx="20" cy="20" r={r}
          strokeDasharray={`${(percent / 100) * c} ${c}`}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <span className="tg-ring-label">{percent}%</span>
    </div>
  );
}

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
  // screens flattened: 'subject' | 'topics'
  // (difficulty is a toggle inside 'topics'; topic click is a selection, not a screen)
  const [screen, setScreen] = useState('subject');
  const [activeIds, setActiveIds] = useState(DEFAULT_ACTIVE_IDS);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [allFolders, setAllFolders] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  // PLACEHOLDER: per-subject completion. Real data lands later via one
  // useEffect that fetches and setSubjectProgress({ [subjectId]: percent }).
  const [subjectProgress] = useState({});

  // Videos cached per category|difficulty — one fetch serves the whole rail
  const [videosCache, setVideosCache] = useState({});
  const [videosLoading, setVideosLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null); // one player at a time

  const subject = SUBJECTS.find(s => s.id === selectedSubject);

  // Active subjects from the admin-managed flag (mirrors SubjectSelect.jsx)
  useEffect(() => {
    fetch(`${SERVER}/api/subjects`)
      .then(r => r.json())
      .then(data => {
        const ids = new Set();
        (data.subjects || []).forEach(s => { if (s.active) ids.add(s.id); });
        if (ids.size > 0) setActiveIds(ids);
      })
      .catch(() => {}); // keep defaults on network error
  }, []);

  const activeSubjects = SUBJECTS.filter(s => activeIds.has(s.id));

  // ── Data ─────────────────────────────────────────────────────────────────────

  async function fetchFolders(subjectId) {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/topics?category=${subjectId}`);
      const data = await res.json();
      setAllFolders(data.topics || []);
      setAllGroups(data.groups || []);
      setSelectedSubject(subjectId);
      setSelectedDifficulty('easy');
      setSelectedTopic(null);
      setPlayingId(null);
      setScreen('topics');
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

  // ── Interaction ──────────────────────────────────────────────────────────────

  function handleDifficultyToggle(difficulty) {
    if (difficulty === selectedDifficulty) return;
    setSelectedDifficulty(difficulty);
    setSelectedTopic(null);
    setPlayingId(null);
  }

  function handleTopicClick(folder) {
    setPlayingId(null);
    if (selectedTopic?.id === folder.id) {
      setSelectedTopic(null); // re-click deselects
      return;
    }
    setSelectedTopic(folder);
    loadVideos(selectedSubject, selectedDifficulty);
  }

  function backToSubjects() {
    setScreen('subject');
    setSelectedTopic(null);
    setPlayingId(null);
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

  const easyCount = allFolders.filter(f => !f.difficulty || f.difficulty === 'easy').length;
  const hardCount = allFolders.filter(f => f.difficulty === 'hard').length;

  const videosKey     = `${selectedSubject}|${selectedDifficulty}`;
  const videos        = videosCache[videosKey]; // undefined = not fetched yet
  const topicVideos   = selectedTopic ? (videos || []).filter(v => v.topic_id === selectedTopic.id) : [];
  const generalVideos = (videos || []).filter(v => !v.topic_id);
  const videoCount    = topicVideos.length + generalVideos.length;

  const diffLabel = selectedDifficulty === 'hard' ? 'Hard Mode' : 'Easy Mode';

  // ── Render pieces ────────────────────────────────────────────────────────────

  const renderFolderCard = (folder) => (
    <button
      key={folder.id}
      className={`tg-folder-card tg-folder-card--${selectedDifficulty} ${selectedTopic?.id === folder.id ? 'tg-folder-card--selected' : ''}`}
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
      <div className={`training-overlay tg-overlay-wide ${selectedTopic ? 'tg-has-cta' : ''}`}>

        {/* ── TOP BAR: back + title + breadcrumb ──────────────────── */}
        <div className="tg-topbar">
          <button
            className="tg-back-btn"
            onClick={screen === 'subject' ? onBack : backToSubjects}
          >
            {screen === 'subject' ? '← Back to Game Modes' : '← Subjects'}
          </button>
          <div className="tg-topbar-text">
            <h1 className="tg-topbar-title">⚔️ TRAINING GROUNDS</h1>
            <div className="tg-breadcrumb">
              {screen === 'subject' ? (
                <span className="tg-crumb">Training Grounds</span>
              ) : (
                <>
                  <span className="tg-crumb tg-crumb--link" onClick={backToSubjects}>Training Grounds</span>
                  <span className="tg-crumb-sep"> › </span>
                  <span className="tg-crumb">{subject?.label}</span>
                  <span className="tg-crumb-sep"> › </span>
                  <span className="tg-crumb">{diffLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── 3-ZONE LAYOUT: center selection + right video rail ──── */}
        <div className="tg-layout">

          <div className="tg-center">
            {screen === 'subject' && (
              loading ? (
                <div className="tg-loading"><div className="spinner"></div><p>Loading...</p></div>
              ) : (
                <div className="tg-subject-grid">
                  {activeSubjects.map(s => (
                    <button key={s.id} className="tg-subject-card" onClick={() => fetchFolders(s.id)}>
                      <ProgressRing percent={subjectProgress[s.id] ?? 0} />
                      <div className="tg-subject-icon">{s.icon}</div>
                      <div className="tg-subject-label">{s.label}</div>
                      <div className="tg-subject-desc">{s.desc}</div>
                    </button>
                  ))}
                </div>
              )
            )}

            {screen === 'topics' && (
              <>
                {/* Difficulty toggle (replaces the full-screen difficulty step) */}
                <div className="tg-diff-toggle">
                  <button
                    className={`tg-diff-pill tg-diff-pill--easy ${selectedDifficulty === 'easy' ? 'active' : ''}`}
                    onClick={() => handleDifficultyToggle('easy')}
                  >
                    🟢 Easy <span className="tg-diff-pill-count">{easyCount}</span>
                  </button>
                  <button
                    className={`tg-diff-pill tg-diff-pill--hard ${selectedDifficulty === 'hard' ? 'active' : ''}`}
                    onClick={() => handleDifficultyToggle('hard')}
                  >
                    🔴 Hard <span className="tg-diff-pill-count">{hardCount}</span>
                  </button>
                </div>

                {/* Start Questions CTA — appears once a topic is selected */}
                {selectedTopic && (
                  <button className="tg-start-bar" onClick={startQuestions}>
                    <span className="tg-start-bar-play">▶</span>
                    <span className="tg-start-bar-text">
                      START QUESTIONS — {selectedTopic.name} · {selectedTopic.question_count || 0} question{(selectedTopic.question_count || 0) !== 1 ? 's' : ''}
                    </span>
                  </button>
                )}

                {/* Topic folder grid (keeps the group sections) */}
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
          </div>

          {/* ── RIGHT RAIL: videos ──────────────────────────────────── */}
          <aside className="tg-rail">
            <h3 className="tg-rail-head">🎬 VIDEOS</h3>
            {!selectedTopic ? (
              <div className="tg-rail-ghost">
                <span className="tg-rail-ghost-icon">🎬</span>
                <p>Select a topic to see its videos</p>
              </div>
            ) : videos === undefined ? (
              <div className="tg-loading tg-rail-loading"><div className="spinner"></div><p>Loading videos...</p></div>
            ) : videoCount === 0 ? (
              <div className="tg-rail-empty">
                <p>No videos for this topic yet — check back soon</p>
              </div>
            ) : (
              <div className="tg-rail-list">
                {topicVideos.length > 0 && (
                  <>
                    <div className="tg-rail-section">📁 {selectedTopic.name}</div>
                    {topicVideos.map(v => (
                      <VideoCard key={v.id} video={v} playing={playingId === v.id} onPlay={() => setPlayingId(v.id)} />
                    ))}
                  </>
                )}
                {generalVideos.length > 0 && (
                  <>
                    <div className="tg-rail-section">📚 GENERAL</div>
                    {generalVideos.map(v => (
                      <VideoCard key={v.id} video={v} general playing={playingId === v.id} onPlay={() => setPlayingId(v.id)} />
                    ))}
                  </>
                )}
              </div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
