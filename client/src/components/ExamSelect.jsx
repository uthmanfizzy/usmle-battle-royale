export default function ExamSelect({ username, onSelectStep1 }) {
  return (
    <div className="screen exam-screen">
      <div className="exam-card">
        <div className="exam-header">
          <span className="exam-header-icon">🏥</span>
          <h2>USMLE Battle Royale</h2>
          <p>Welcome, <strong>{username}</strong>. Choose your exam.</p>
        </div>

        <div className="exam-options">
          {/* Step 1 — active */}
          <button className="exam-option step1-option" onClick={onSelectStep1}>
            <div className="exam-step-badge step1-badge">STEP 1</div>
            <div className="exam-option-icon">📚</div>
            <h3>USMLE Step 1</h3>
            <p>Basic sciences, mechanisms, and foundational medical knowledge tested through clinical vignettes.</p>
            <div className="exam-cta">Start Preparing →</div>
          </button>

          {/* Step 2 — coming soon */}
          <div className="exam-option step2-option">
            <div className="coming-soon-badge">Coming Soon</div>
            <div className="exam-step-badge step2-badge">STEP 2</div>
            <div className="exam-option-icon muted-icon">🩺</div>
            <h3>USMLE Step 2 CK</h3>
            <p>We are currently developing Step 2 content. Complete Step 1 preparation first!</p>
            <div className="exam-cta-disabled">Not Yet Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
