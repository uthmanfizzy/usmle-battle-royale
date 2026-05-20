import { useState, useEffect, useCallback } from 'react';
import './AnKingMode.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function AnKingMode({ user, config, onBack, onComplete }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [filter, setFilter] = useState({ subject: config?.subject || '', deck: config?.deck || '' });

  useEffect(() => {
    fetchCards();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: config?.limit || 20,
      });
      if (filter.subject) params.append('subject', filter.subject);
      if (filter.deck) params.append('deck', filter.deck);

      const res = await fetch(`${SERVER_URL}/api/questions/anking?${params}`);
      const data = await res.json();

      // Shuffle cards
      const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } catch(e) {
      console.error('Failed to fetch AnKing cards:', e);
    }
    setLoading(false);
  };

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex) / cards.length) * 100 : 0;

  const handleFlip = () => setFlipped(!flipped);

  const handleRate = (rating) => {
    setResults(prev => ({ ...prev, [rating]: prev[rating] + 1 }));

    if (currentIndex >= cards.length - 1) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setFlipped(false);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setSessionComplete(false);
    setResults({ again: 0, hard: 0, good: 0, easy: 0 });
    setShowExplanation(false);
    fetchCards();
  };

  if (loading) return (
    <div className="anking-loading">
      <div className="anking-spinner">🃏</div>
      <p>Loading AnKing cards...</p>
    </div>
  );

  if (cards.length === 0) return (
    <div className="anking-empty">
      <span>📭</span>
      <h3>No AnKing Cards Found</h3>
      <p>Import an AnKing .apkg file in the Admin panel first.</p>
      <button className="anking-back-btn" onClick={onBack}>← Go Back</button>
    </div>
  );

  if (sessionComplete) return (
    <div className="anking-complete">
      <div className="anking-complete-card">
        <h2>🎉 Session Complete!</h2>
        <p>You reviewed {cards.length} cards</p>

        <div className="anking-results-grid">
          <div className="anking-result-item anking-result--again">
            <span className="anking-result-num">{results.again}</span>
            <span className="anking-result-label">Again</span>
          </div>
          <div className="anking-result-item anking-result--hard">
            <span className="anking-result-num">{results.hard}</span>
            <span className="anking-result-label">Hard</span>
          </div>
          <div className="anking-result-item anking-result--good">
            <span className="anking-result-num">{results.good}</span>
            <span className="anking-result-label">Good</span>
          </div>
          <div className="anking-result-item anking-result--easy">
            <span className="anking-result-num">{results.easy}</span>
            <span className="anking-result-label">Easy</span>
          </div>
        </div>

        <div className="anking-complete-actions">
          <button className="anking-restart-btn" onClick={handleRestart}>🔄 Study Again</button>
          <button className="anking-back-btn" onClick={onBack}>← Back to Play</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="anking-mode">

      {/* Header */}
      <div className="anking-header">
        <button className="anking-back-btn-sm" onClick={onBack}>← Back</button>
        <div className="anking-progress-section">
          <span className="anking-progress-text">{currentIndex + 1} / {cards.length}</span>
          <div className="anking-progress-bar">
            <div className="anking-progress-fill" style={{width: `${progress}%`}} />
          </div>
        </div>
        <div className="anking-session-stats">
          <span className="stat-again">↺ {results.again}</span>
          <span className="stat-hard">😰 {results.hard}</span>
          <span className="stat-good">👍 {results.good}</span>
          <span className="stat-easy">⚡ {results.easy}</span>
        </div>
      </div>

      {/* Card */}
      <div className="anking-card-container" onClick={handleFlip}>
        <div className={`anking-card ${flipped ? 'anking-card--flipped' : ''}`}>

          {/* Front */}
          <div className="anking-card-face anking-card-front">
            <div className="anking-card-label">QUESTION</div>
            <div className="anking-card-content">
              {currentCard?.question}
            </div>
            {currentCard?.subject && (
              <div className="anking-card-subject">{currentCard.subject}</div>
            )}
            <div className="anking-card-tap-hint">Tap to reveal answer</div>
          </div>

          {/* Back */}
          <div className="anking-card-face anking-card-back">
            <div className="anking-card-label">ANSWER</div>
            <div className="anking-card-content">
              {currentCard?.correct}
            </div>
            {currentCard?.explanation && (
              <div className="anking-explanation-toggle">
                <button
                  className="anking-explain-btn"
                  onClick={(e) => { e.stopPropagation(); setShowExplanation(!showExplanation); }}
                >
                  {showExplanation ? '▲ Hide' : '▼ Explanation'}
                </button>
                {showExplanation && (
                  <div className="anking-explanation">
                    {currentCard.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rating buttons - only show when flipped */}
      {flipped && (
        <div className="anking-rating-buttons">
          <button className="anking-rate-btn anking-rate--again" onClick={() => handleRate('again')}>
            <span>↺</span>
            <span>Again</span>
          </button>
          <button className="anking-rate-btn anking-rate--hard" onClick={() => handleRate('hard')}>
            <span>😰</span>
            <span>Hard</span>
          </button>
          <button className="anking-rate-btn anking-rate--good" onClick={() => handleRate('good')}>
            <span>👍</span>
            <span>Good</span>
          </button>
          <button className="anking-rate-btn anking-rate--easy" onClick={() => handleRate('easy')}>
            <span>⚡</span>
            <span>Easy</span>
          </button>
        </div>
      )}

      {/* Flip hint when not flipped */}
      {!flipped && (
        <div className="anking-flip-hint">
          <button className="anking-flip-btn" onClick={handleFlip}>
            🃏 Flip Card
          </button>
        </div>
      )}

    </div>
  );
}
