import './ModeSplit.css';

/**
 * Mehlman — a Story Mode campaign with two sub-modes, so it opens onto this
 * hub rather than straight into a bank (the same pattern as Amboss Quest).
 *
 * Rapid Fire Qbank is the question-bank machine (questionBankModes.js, tag
 * mehlman_rapid_fire). HY Arrows is its own page: arrow tables by system.
 */
export default function MehlmanHub() {
  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={() => { window.location.href = '/?story=1'; }}>
        ← Story Mode
      </button>

      <div className="ms-banner">
        <h1 className="ms-title">⚡ MEHLMAN</h1>
        <p className="ms-tagline">Pick your drill.</p>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-campaign-list">
        <button className="ms-journey-card ms-journey-card--yellow" onClick={() => { window.location.href = '/mehlman-rapid-fire'; }}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">⚡</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">RAPID FIRE QBANK</span>
            <span className="ms-journey-sub">
              Mehlman&apos;s high-yield facts, fired at you one after another.
            </span>
          </div>
        </button>

        <button className="ms-journey-card ms-journey-card--yellow" onClick={() => { window.location.href = '/hy-arrows'; }}>
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">↕️</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">HY ARROWS</span>
            <span className="ms-journey-sub">
              Up, down or unchanged? Fill in the arrow table for each scenario, system by system.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
