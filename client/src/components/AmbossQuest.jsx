import { LockedCard } from './ModeSplit';
import './ModeSplit.css';

/**
 * Amboss Quest — a Story Mode campaign with sub-modes of its own, so it opens
 * onto this hub rather than straight into a bank. Same card list as the Story
 * Mode menu, so it reads as part of it.
 *
 * 200 Concepts is a real bank (questionBankModes.js, tag amboss_200_concepts).
 * Qbank and HY Ethics are locked until they have questions; to open one, swap
 * its <LockedCard> for a button the way 200 Concepts is written.
 */
export default function AmbossQuest() {
  return (
    <div className="ms-screen">
      <button className="ms-back-btn" onClick={() => { window.location.href = '/?story=1'; }}>
        ← Story Mode
      </button>

      <div className="ms-banner">
        <h1 className="ms-title">🧭 AMBOSS QUEST</h1>
        <p className="ms-tagline">Choose your quest.</p>
        <div className="ms-title-rule" />
      </div>

      <div className="ms-campaign-list">
        <LockedCard variant="amboss" icon="🗂️" name="QBANK"
          sub="The AMBOSS question bank, worked down at your own pace." />

        <button
          className="ms-journey-card ms-journey-card--amboss"
          onClick={() => { window.location.href = '/amboss-200-concepts'; }}
        >
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">💯</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">200 CONCEPTS</span>
            <span className="ms-journey-sub">
              The 200 concepts that turn up on every Step 1 exam, one question each.
            </span>
          </div>
        </button>

        <button
          className="ms-journey-card ms-journey-card--amboss"
          onClick={() => { window.location.href = '/amboss-ethics'; }}
        >
          <div className="ms-journey-art" aria-hidden="true">
            <span className="ms-journey-art-icon">⚖️</span>
          </div>
          <div className="ms-journey-body">
            <span className="ms-journey-name">HY ETHICS</span>
            <span className="ms-journey-sub">
              The Ethics Ward — talk each patient through their dilemma and learn the rule behind it.
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
