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
  const [easyFolders, setEasyFolders] = useState([]);
  const [hardFolders, setHardFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch topics for selected subject and split by difficulty
  async function fetchFolders(subjectId) {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/topics?category=${subjectId}`);
      const data = await res.json();
      const allFolders = data.topics || [];

      // Split folders by difficulty
      const easy = allFolders.filter(f => !f.difficulty || f.difficulty === 'easy');
      const hard = allFolders.filter(f => f.difficulty === 'hard');

      setEasyFolders(easy);
      setHardFolders(hard);
      setSelectedSubject(subjectId);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setEasyFolders([]);
      setHardFolders([]);
    }
    setLoading(false);
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

  // SCREEN 2: Folder Selection
  const subject = SUBJECTS.find(s => s.id === selectedSubject);

  return (
    <div className="training-grounds">
      <div className="training-overlay">
        <button className="tg-back-btn" onClick={handleBackToSubjects}>← Back to Subjects</button>

        <div className="tg-header">
          <div className="tg-breadcrumb">
            Training Grounds › {subject?.label || selectedSubject}
          </div>
          <h1 className="tg-title">{subject?.icon} {subject?.label}</h1>
          <p className="tg-subtitle">Select a topic folder to practice</p>
        </div>

        {loading ? (
          <div className="tg-loading">
            <div className="spinner"></div>
            <p>Loading topics...</p>
          </div>
        ) : (easyFolders.length === 0 && hardFolders.length === 0) ? (
          <div className="tg-empty">
            <p>No topics available for this subject yet.</p>
            <p className="tg-empty-sub">Check back soon!</p>
          </div>
        ) : (
          <div className="training-folders">

            {/* EASY SECTION */}
            <div className="difficulty-section">
              <div className="difficulty-header difficulty-header--easy">
                <span className="difficulty-icon">🟢</span>
                <h3>EASY</h3>
                <span className="folder-count">{easyFolders.length} {easyFolders.length === 1 ? 'folder' : 'folders'}</span>
              </div>
              <div className="tg-folder-grid">
                {easyFolders.map(folder => (
                  <button
                    key={folder.id}
                    className="tg-folder-card tg-folder-card--easy"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <div className="tg-folder-icon">📁</div>
                    <div className="tg-folder-name">{folder.name}</div>
                    {folder.question_count > 0 && (
                      <div className="tg-folder-qcount">{folder.question_count} questions</div>
                    )}
                  </button>
                ))}
                {easyFolders.length === 0 && (
                  <p className="no-folders">No easy folders available</p>
                )}
              </div>
            </div>

            {/* HARD SECTION */}
            <div className="difficulty-section">
              <div className="difficulty-header difficulty-header--hard">
                <span className="difficulty-icon">🔴</span>
                <h3>HARD</h3>
                <span className="folder-count">{hardFolders.length} {hardFolders.length === 1 ? 'folder' : 'folders'}</span>
              </div>
              <div className="tg-folder-grid">
                {hardFolders.map(folder => (
                  <button
                    key={folder.id}
                    className="tg-folder-card tg-folder-card--hard"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <div className="tg-folder-icon">📁</div>
                    <div className="tg-folder-name">{folder.name}</div>
                    {folder.question_count > 0 && (
                      <div className="tg-folder-qcount">{folder.question_count} questions</div>
                    )}
                  </button>
                ))}
                {hardFolders.length === 0 && (
                  <p className="no-folders">No hard folders available</p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
