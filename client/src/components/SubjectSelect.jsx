const SUBJECTS = [
  { id: 'all',            label: 'All Subjects',   icon: '🏥', desc: 'Mixed questions from all topics' },
  { id: 'cardiology',     label: 'Cardiology',     icon: '❤️', desc: 'Heart, ECG, vascular' },
  { id: 'neurology',      label: 'Neurology',      icon: '🧠', desc: 'Brain, nerves, seizures' },
  { id: 'pharmacology',   label: 'Pharmacology',   icon: '💊', desc: 'Drugs, mechanisms, interactions' },
  { id: 'microbiology',   label: 'Microbiology',   icon: '🦠', desc: 'Bacteria, viruses, fungi' },
  { id: 'biochemistry',   label: 'Biochemistry',   icon: '⚗️', desc: 'Metabolism, enzymes, genetics' },
  { id: 'biostatistics',  label: 'Biostatistics',  icon: '📊', desc: 'Stats, study design, bias' },
];

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
          {SUBJECTS.map(s => (
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
      </div>
    </div>
  );
}

export { SUBJECTS };
