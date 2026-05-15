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
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch topics for selected subject
  async function fetchFolders(subjectId) {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER}/api/topics?category=${subjectId}`);
      const data = await res.json();
      setFolders(data.topics || []);
      setSelectedSubject(subjectId);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setFolders([]);
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
    setFolders([]);
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
        ) : folders.length === 0 ? (
          <div className="tg-empty">
            <p>No topics available for this subject yet.</p>
            <p className="tg-empty-sub">Check back soon!</p>
          </div>
        ) : (
          <div className="tg-folder-grid">
            {folders.map(folder => (
              <button
                key={folder.id}
                className="tg-folder-card"
                onClick={() => handleFolderClick(folder)}
              >
                <div className="tg-folder-icon">📁</div>
                <div className="tg-folder-name">{folder.name}</div>
                <div className="tg-folder-difficulty">
                  {folder.difficulty === 'hard' ? '🔴 Hard' :
                   folder.difficulty === 'medium' ? '🟡 Medium' :
                   '🟢 Easy'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
