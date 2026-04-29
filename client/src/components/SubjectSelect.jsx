const ACTIVE_SUBJECTS = [
  { id: 'all',           label: 'All Subjects',  icon: '🏥', desc: 'Mixed questions from all topics' },
  { id: 'cardiology',    label: 'Cardiology',    icon: '❤️',  desc: 'Heart, ECG, vascular' },
  { id: 'neurology',     label: 'Neurology',     icon: '🧠', desc: 'Brain, nerves, seizures' },
  { id: 'pharmacology',  label: 'Pharmacology',  icon: '💊', desc: 'Drugs, mechanisms, interactions' },
  { id: 'microbiology',  label: 'Microbiology',  icon: '🦠', desc: 'Bacteria, viruses, fungi' },
  { id: 'biochemistry',  label: 'Biochemistry',  icon: '⚗️', desc: 'Metabolism, enzymes, genetics' },
  { id: 'biostatistics', label: 'Biostatistics', icon: '📊', desc: 'Stats, study design, bias' },
];

const COMING_SOON_SUBJECTS = [
  { id: 'pulmonology',      label: 'Pulmonology',                      icon: '🫁', desc: 'Lungs, airways, respiratory'          },
  { id: 'nephrology',       label: 'Nephrology',                       icon: '💧', desc: 'Kidneys, fluids, electrolytes'         },
  { id: 'gastroenterology', label: 'Gastroenterology',                 icon: '🫃', desc: 'GI tract, liver, pancreas'            },
  { id: 'endocrinology',    label: 'Endocrinology',                    icon: '🦋', desc: 'Hormones, thyroid, diabetes'          },
  { id: 'haematology',      label: 'Haematology',                      icon: '🩸', desc: 'Blood, anaemia, coagulation'          },
  { id: 'immunology',       label: 'Immunology',                       icon: '🛡️', desc: 'Immune system, autoimmune'            },
  { id: 'musculoskeletal',  label: 'Musculoskeletal',                  icon: '🦴', desc: 'Bones, joints, muscles'              },
  { id: 'dermatology',      label: 'Dermatology',                      icon: '🩹', desc: 'Skin, hair, nails'                   },
  { id: 'reproductive',     label: 'Reproductive & Obstetrics',        icon: '👶', desc: 'Reproduction, pregnancy, birth'       },
  { id: 'psychiatry',       label: 'Psychiatry & Behavioural Science', icon: '🧠', desc: 'Mental health, behaviour'             },
  { id: 'ophthalmology',    label: 'Ophthalmology',                    icon: '👁️', desc: 'Eyes, vision, ocular disease'         },
  { id: 'ent',              label: 'ENT',                              icon: '👂', desc: 'Ear, nose & throat'                  },
  { id: 'genetics',         label: 'Genetics & Embryology',            icon: '🧬', desc: 'Genetics, inheritance, development'   },
  { id: 'anatomy',          label: 'Anatomy',                          icon: '🫀', desc: 'Structure, physiology, systems'       },
];

// Full list exported for Lobby.jsx subject lookup
const SUBJECTS = [...ACTIVE_SUBJECTS, ...COMING_SOON_SUBJECTS];

export default function SubjectSelect({ username, onSelect, onBack }) {
  return (
    <div className="screen subject-screen">
      <div className="subject-card">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Choose a Subject</h2>
        <p className="subject-sub">
          Select what <strong>{username}</strong>'s lobby will be quizzed on
        </p>

        <div className="subject-grid">
          {ACTIVE_SUBJECTS.map(s => (
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

        <div className="subj-cs-section">
          <div className="subj-cs-heading">
            <span className="subj-cs-line" />
            <span className="subj-cs-title">More Coming Soon</span>
            <span className="subj-cs-line" />
          </div>
          <p className="subj-cs-sub">Questions for these topics are in development — stay tuned!</p>
          <div className="subject-grid subject-grid-cs">
            {COMING_SOON_SUBJECTS.map(s => (
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
      </div>
    </div>
  );
}

export { SUBJECTS };
