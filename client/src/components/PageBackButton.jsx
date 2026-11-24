import './PageBackButton.css';

/**
 * The "← Back" pill for full-page dashboard tabs (News, Leaderboards) in the
 * shells that have no back control of their own (classic and Celestial —
 * Moonlit's tab frame and DashboardNew's subhead already carry one, so those
 * mounts simply do not pass onBack).
 */
export default function PageBackButton({ onBack, label = 'Back to home' }) {
  if (!onBack) return null;
  return (
    <button type="button" className="page-back" onClick={onBack}>
      <span className="page-back-arrow" aria-hidden="true">←</span>
      {label}
    </button>
  );
}
