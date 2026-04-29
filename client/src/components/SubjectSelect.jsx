import { useState, useEffect } from 'react';

const SERVER = 'https://usmle-battle-royale-production.up.railway.app';

// Master list — kept static so Lobby.jsx can do a fast lookup by id.
// Active/inactive state is fetched from the API at render time.
const ALL_SUBJECTS = [
  { id: 'all',              label: 'All Subjects',                 icon: '🏥', desc: 'Mixed questions from all topics'          },
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

// Default active set — matches server seed, avoids flash before API responds
const DEFAULT_ACTIVE_IDS = new Set([
  'all', 'cardiology', 'neurology', 'pharmacology',
  'microbiology', 'biochemistry', 'biostatistics',
]);

// Named export used by Lobby.jsx for subject lookup by id
export const SUBJECTS = ALL_SUBJECTS;

export default function SubjectSelect({ username, onSelect, onBack }) {
  const [activeIds, setActiveIds] = useState(DEFAULT_ACTIVE_IDS);

  useEffect(() => {
    fetch(`${SERVER}/api/subjects`)
      .then(r => r.json())
      .then(data => {
        const ids = new Set(['all']); // 'all' is always available
        (data.subjects || []).forEach(s => { if (s.active) ids.add(s.id); });
        setActiveIds(ids);
      })
      .catch(() => {}); // keep defaults on network error
  }, []);

  const activeSubjects   = ALL_SUBJECTS.filter(s =>  activeIds.has(s.id));
  const inactiveSubjects = ALL_SUBJECTS.filter(s => !activeIds.has(s.id));

  return (
    <div className="screen subject-screen">
      <div className="subject-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Choose a Subject</h2>
        <p className="subject-sub">
          Select what <strong>{username}</strong>'s lobby will be quizzed on
        </p>

        <div className="subject-grid">
          {activeSubjects.map(s => (
            <button
              key={s.id}
              className="subject-option"
              onClick={() => onSelect(s.id)}
            >
              <span className="subj-icon">{s.icon}</span>
              <span className="subj-label">{s.label}</span>
              <span className="subj-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        {inactiveSubjects.length > 0 && (
          <div className="subj-cs-section">
            <div className="subj-cs-heading">
              <span className="subj-cs-line" />
              <span className="subj-cs-title">More Coming Soon</span>
              <span className="subj-cs-line" />
            </div>
            <p className="subj-cs-sub">Questions for these topics are in development — stay tuned!</p>
            <div className="subject-grid subject-grid-cs">
              {inactiveSubjects.map(s => (
                <div
                  key={s.id}
                  className="subject-option subject-option-cs"
                  title="Questions coming soon!"
                >
                  <span className="subj-icon">{s.icon}</span>
                  <span className="subj-label">{s.label}</span>
                  <span className="subj-desc">{s.desc}</span>
                  <span className="subj-cs-badge">Coming Soon</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
