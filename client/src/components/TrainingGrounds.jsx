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

export default function TrainingGrounds({ user, onBack, onStartPractice }) {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [easyFolders, setEasyFolders] = useState([]);
  const [hardFolders, setHardFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allFolders, setAllFolders] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  // Fetch topics for selected subject
  async function fetchFolders(subjectId) {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/topics?category=${subjectId}`);
      const data = await res.json();
      const folders = data.topics || [];

      setAllFolders(folders);
      setAllGroups(data.groups || []);
      setSelectedSubject(subjectId);
      setSelectedDifficulty(null); // Reset difficulty when changing subject
    } catch (err) {
      console.error('Failed to load topics:', err);
      setAllFolders([]);
      setAllGroups([]);
    }
    setLoading(false);
  }

  // Handle difficulty selection and filter folders
  function handleDifficultySelect(difficulty) {
    setSelectedDifficulty(difficulty);

    // Split folders by difficulty
    const easy = allFolders.filter(f => !f.difficulty || f.difficulty === 'easy');
    const hard = allFolders.filter(f => f.difficulty === 'hard');

    setEasyFolders(easy);
    setHardFolders(hard);
  }

  // Handle folder selection and start practice
  function handleFolderClick(folder) {
    const subject = SUBJECTS.find(s => s.id === selectedSubject);
    onStartPractice({
      topicId: folder.id,
      topicName: folder.name,
      subjectName: subject?.label || selectedSubject,
      category: selectedSubject,
    });
  }

  // Back to subject selection
  function handleBackToSubjects() {
    setSelectedSubject(null);
    setSelectedDifficulty(null);
    setAllFolders([]);
    setAllGroups([]);
    setEasyFolders([]);
    setHardFolders([]);
  }

  // Back to difficulty selection
  function handleBackToDifficulty() {
    setSelectedDifficulty(null);
    setEasyFolders([]);
    setHardFolders([]);
  }

  // SCREEN 1: Subject Selection
  if (!selectedSubject) {
    return (
      <div className="training-grounds">
        <div className="training-overlay">
          <button className="tg-back-btn" onClick={onBack}>← Back to Game Modes</button>

          <div className="tg-header">
            <h1 className="tg-title">⚔️ Training Grounds</h1>
            <p className="tg-subtitle">Choose a subject to begin your training</p>
          </div>

          <div className="tg-subject-grid">
            {SUBJECTS.map(subject => (
              <button
                key={subject.id}
                className="tg-subject-card"
                onClick={() => fetchFolders(subject.id)}
              >
                <div className="tg-subject-icon">{subject.icon}</div>
                <div className="tg-subject-label">{subject.label}</div>
                <div className="tg-subject-desc">{subject.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subject = SUBJECTS.find(s => s.id === selectedSubject);

  // SCREEN 2: Difficulty Selection
  if (!selectedDifficulty) {
    return (
      <div className="training-grounds">
        <div className="training-overlay">
          <button className="tg-back-btn" onClick={handleBackToSubjects}>← Back to Subjects</button>

          <div className="tg-header">
            <div className="tg-breadcrumb">
              Training Grounds › {subject?.label || selectedSubject}
            </div>
            <h1 className="tg-title">Choose Difficulty</h1>
            <p className="tg-subtitle">Select the challenge level for your training</p>
          </div>

          {loading ? (
            <div className="tg-loading">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <div className="tg-difficulty-grid">
              <button
                className="tg-difficulty-card tg-difficulty-card--easy"
                onClick={() => handleDifficultySelect('easy')}
              >
                <div className="tg-diff-icon">🟢</div>
                <h3 className="tg-diff-title">Easy Mode</h3>
                <p className="tg-diff-desc">
                  Standard questions with straightforward presentations. Perfect for building foundational knowledge.
                </p>
                <div className="tg-diff-count">
                  {allFolders.filter(f => !f.difficulty || f.difficulty === 'easy').length} topics available
                </div>
              </button>

              <button
                className="tg-difficulty-card tg-difficulty-card--hard"
                onClick={() => handleDifficultySelect('hard')}
              >
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
          )}
        </div>
      </div>
    );
  }

  // SCREEN 3: Folder Selection

  const activeFolders    = selectedDifficulty === 'easy' ? easyFolders : hardFolders;
  const activeGroups     = allGroups.filter(g => (g.difficulty || 'easy') === selectedDifficulty);
  const ungroupedFolders = activeFolders.filter(f => !f.group_id);

  // Identical markup to the original folder card — clicking still starts one topic
  const renderFolderCard = (folder) => (
    <button
      key={folder.id}
      className={`tg-folder-card tg-folder-card--${selectedDifficulty}`}
      onClick={() => handleFolderClick(folder)}
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
        <button className="tg-back-btn" onClick={handleBackToDifficulty}>← Back to Difficulty</button>

        <div className="tg-header">
          <div className="tg-breadcrumb">
            Training Grounds › {subject?.label || selectedSubject} › {selectedDifficulty === 'easy' ? 'Easy Mode' : 'Hard Mode'}
          </div>
          <h1 className="tg-title">{subject?.icon} {subject?.label}</h1>
          <p className="tg-subtitle">Select a topic folder to practice</p>
        </div>

        {loading ? (
          <div className="tg-loading">
            <div className="spinner"></div>
            <p>Loading topics...</p>
          </div>
        ) : (
          <div className="training-folders">
            {/* Grouped topics first (display-only sections), then ungrouped exactly as before */}
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
                selectedDifficulty === 'easy' ? (
                  <div className="tg-empty">
                    <p>No easy topics available for this subject yet.</p>
                    <p className="tg-empty-sub">Try selecting Hard mode or check back soon!</p>
                  </div>
                ) : (
                  <div className="tg-empty">
                    <p>No hard topics available for this subject yet.</p>
                    <p className="tg-empty-sub">Try selecting Easy mode or check back soon!</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
