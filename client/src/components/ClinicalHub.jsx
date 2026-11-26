import { useParams } from 'react-router-dom';
import { SPECIALTIES, specialtyById, loadBest } from '../clinical';
import { useAdminAccess } from './useAdminAccess';
import './Clinical.css';

/**
 * Clinical: /clinical lists the specialties, /clinical/:specialty lists its
 * cases. Admin-only for now; anyone else gets the locked screen.
 */
const go = (path) => { window.location.href = path; };

export function AdminOnly({ children }) {
  const access = useAdminAccess();
  if (access === 'checking') {
    return <div className="cl-screen"><div className="cl-gate"><div className="cl-spinner" aria-label="Checking access" /></div></div>;
  }
  if (!access) {
    return (
      <div className="cl-screen">
        <div className="cl-gate">
          <span className="cl-gate-icon" aria-hidden="true">🔒</span>
          <h1>Clinical is locked</h1>
          <p>It is still being built and is open to admins only for now.</p>
          <button type="button" className="cl-btn" onClick={() => go('/')}>Back to the menu</button>
        </div>
      </div>
    );
  }
  return children;
}

function Hub() {
  return (
    <div className="cl-screen">
      <header className="cl-top">
        <button type="button" className="cl-back" onClick={() => go('/')}>← Menu</button>
        <span className="cl-admin-chip">Admin preview</span>
      </header>
      <section className="cl-hero">
        <span className="cl-hero-icon" aria-hidden="true">🩺</span>
        <div>
          <p className="cl-kicker">Clinical</p>
          <h1 className="cl-title">On the spot</h1>
          <p className="cl-sub">
            Manage a patient from the first question to the last order: take the history, examine,
            choose your tests, make the diagnosis and treat. A senior tells you straight away when
            something was not needed, and shows you what you missed.
          </p>
        </div>
      </section>
      <div className="cl-grid">
        {SPECIALTIES.map(s => {
          const open = s.cases.length > 0;
          return open ? (
            <button key={s.id} type="button" className="cl-spec" onClick={() => go(`/clinical/${s.id}`)}>
              <span className="cl-spec-icon" aria-hidden="true">{s.icon}</span>
              <span className="cl-spec-name">{s.name}</span>
              <span className="cl-spec-blurb">{s.blurb}</span>
              <span className="cl-spec-count">{s.cases.length} case{s.cases.length === 1 ? '' : 's'} →</span>
            </button>
          ) : (
            <div key={s.id} className="cl-spec is-locked" aria-disabled="true">
              <span className="cl-spec-icon" aria-hidden="true">{s.icon}</span>
              <span className="cl-spec-name">{s.name}</span>
              <span className="cl-spec-blurb">{s.blurb}</span>
              <span className="cl-spec-count">🔒 Soon</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Specialty({ spec }) {
  const best = loadBest();
  return (
    <div className="cl-screen">
      <header className="cl-top">
        <button type="button" className="cl-back" onClick={() => go('/clinical')}>← Clinical</button>
        <span className="cl-admin-chip">Admin preview</span>
      </header>
      <section className="cl-hero">
        <span className="cl-hero-icon" aria-hidden="true">{spec.icon}</span>
        <div>
          <p className="cl-kicker">Clinical</p>
          <h1 className="cl-title">{spec.name}</h1>
          <p className="cl-sub">{spec.blurb}</p>
        </div>
      </section>
      <div className="cl-cases">
        {spec.cases.map(c => (
          <button key={c.id} type="button" className="cl-case-card" onClick={() => go(`/clinical/${spec.id}/${c.id}`)}>
            <span className="cl-case-avatar" aria-hidden="true">{c.patient.icon}</span>
            <span className="cl-case-body">
              <span className="cl-case-title">{c.title}</span>
              <span className="cl-case-tag">{c.tagline}</span>
              <span className="cl-case-meta">{c.patient.name} · {c.patient.age} · {c.setting.split(' · ')[0]}</span>
            </span>
            <span className="cl-case-best">{best[c.id] != null ? <><b>{best[c.id]}</b><small>best</small></> : <small>New</small>}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ClinicalHub() {
  const { specialty } = useParams();
  const spec = specialty ? specialtyById(specialty) : null;
  return (
    <AdminOnly>
      {specialty && spec?.cases.length ? <Specialty spec={spec} /> : <Hub />}
    </AdminOnly>
  );
}
