import { LockedCard } from './ModeSplit';
import './ModeSplit.css';

/**
 * Kaplan — a Story Mode campaign with sub-modes of its own, so it opens onto
 * this hub rather than straight into a game (the same pattern as Amboss
 * Quest). The card list matches the Story Mode menu, so it reads as part of it.
 *
 * 100 HY Ethics is open (/kaplan-ethics, "The Ethics Tribunal"). The Qbank is
 * locked until it has questions; to open it, swap its <LockedCard> for a
 * button written like the Ethics one.
 */
export default function KaplanHub() {
  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={() => { window.location.href = '/?story=1'; }}>
        ← Story Mode
      </button>

      <div className="ms-banner">
        <h1 className="ms-title">🎓 KAPLAN</h1>
        <p className="ms-tagline">Choose your course.</p>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-campaign-list">
        <button
          className="ms-journey-card ms-journey-card--kaplan"
          onClick={() => { window.location.href = '/kaplan-ethics'; }}
        >
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">⚖️</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">100 HY ETHICS</span>
            <span className="ms-journey-sub">
              The Ethics Tribunal: rule on each case file, stake your confidence, and learn the rule behind the verdict.
            </span>
          </div>
        </button>

        <LockedCard variant="kaplan" icon="🗂️" name="QBANK" chip="SOON"
          sub="The Kaplan question bank, worked down at your own pace." />
      </div>
    </div>
  );
}
