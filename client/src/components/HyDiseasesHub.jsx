import { LockedCard } from './ModeSplit';
import './ModeSplit.css';

/**
 * HY Diseases — a Story Mode campaign: high-yield diseases taught as
 * patients you diagnose. One subject per card; Biochemistry is open
 * (/hy-diseases/biochem, "Clinic Rounds"), the others are on the way.
 * To open a subject, swap its <LockedCard> for a button like Biochemistry's.
 */
export default function HyDiseasesHub() {
  return (
    <div className="ms-screen ms-story">
      <button className="ms-back-btn" onClick={() => { window.location.href = '/?story=1'; }}>
        ← Story Mode
      </button>

      <div className="ms-banner">
        <h1 className="ms-title">
          <span className="ms-title-icon" aria-hidden="true">🩺</span> <span className="ms-title-text">HY DISEASES</span>
        </h1>
        <p className="ms-tagline">Meet the patient. Name the disease. Never forget it.</p>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-campaign-list">
        <button
          className="ms-journey-card ms-journey-card--hyd"
          onClick={() => { window.location.href = '/hy-diseases/biochem'; }}
        >
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">⚗️</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">BIOCHEMISTRY</span>
            <span className="ms-journey-sub">
              88 animated patients: storage diseases, vitamins, genetics and more. Diagnose them at your own pace.
            </span>
          </div>
        </button>

        <LockedCard variant="blue" icon="🛡️" name="IMMUNOLOGY" chip="SOON"
          sub="Immunodeficiencies and hypersensitivity, patient by patient." />
        <LockedCard variant="green" icon="🦠" name="MICROBIOLOGY" chip="SOON"
          sub="The classic bugs, from the bedside." />
        <LockedCard variant="magenta" icon="🩸" name="HAEMATOLOGY" chip="SOON"
          sub="Anaemias, bleeding and clotting disorders." />
        <LockedCard variant="violet" icon="🧠" name="NEUROLOGY" chip="SOON"
          sub="Strokes, seizures and neurodegeneration." />
        <LockedCard variant="orange" icon="🫀" name="CARDIOLOGY" chip="SOON"
          sub="Murmurs, cardiomyopathies and congenital defects." />
        <LockedCard variant="yellow" icon="🦋" name="ENDOCRINOLOGY" chip="SOON"
          sub="Thyroid, adrenal and pituitary patients." />
        <LockedCard variant="ukmla" icon="🫁" name="RESPIRATORY" chip="SOON"
          sub="Obstructive, restrictive and the lungs at work." />
      </div>
    </div>
  );
}
