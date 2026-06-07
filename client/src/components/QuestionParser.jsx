import { useState } from 'react';
import './QuestionParser.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function QuestionParser({ activeFolder, selectedDifficulty, onImport, onClose }) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState('input'); // 'input' | 'preview' | 'done'
  const [importing, setImporting] = useState(false);
  const [difficulty, setDifficulty] = useState(selectedDifficulty || 'easy');
  const [gameModes, setGameModes] = useState(['battle_royale', 'speed_race', 'trivia_pursuit']);

  const parseQuestions = () => {
    const questions = [];
    const errs = [];

    // Split by common question separators
    // Handles: numbered questions (1. 2. Q1. Question 1:), blank lines between questions
    const blocks = rawText
      .split(/\n{2,}|\n(?=\s*(?:Q?\d+[\.\):]|\bQuestion\s+\d+))/i)
      .map(b => b.trim())
      .filter(Boolean);

    blocks.forEach((block, blockIndex) => {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 3) return; // skip blocks too short to be a question

        let questionText = '';
        let choices = [];
        let correctLetter = '';
        let explanation = '';
        let inExplanation = false;
        let questionLines = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Detect explanation section
          if (/^(explanation|answer explanation|rationale|discussion)[\s:]/i.test(line) ||
              /^(correct answer[\s:]*[A-H].*\n)/i.test(line)) {
            inExplanation = true;
            // Extract explanation text after the label
            const expText = line.replace(/^(explanation|answer explanation|rationale|discussion)[\s:]*/i, '').trim();
            if (expText) explanation += expText + '\n';
            continue;
          }

          if (inExplanation) {
            explanation += line + '\n';
            continue;
          }

          // Detect answer line: "Correct Answer: B" or "Answer: B" or "Correct: B"
          const answerMatch = line.match(/^(?:correct\s+)?answer[\s:]+([A-H])/i) ||
                              line.match(/^(?:the\s+)?correct\s+(?:answer\s+)?(?:is\s+)?([A-H])[.\s]/i);
          if (answerMatch) {
            correctLetter = answerMatch[1].toUpperCase();
            // Check if explanation follows on same line
            const rest = line.replace(/^.*?[A-H][.\s]*/i, '').trim();
            if (rest && rest.length > 5) explanation += rest + '\n';
            inExplanation = true;
            continue;
          }

          // Detect choices: A. B. C. D. or A) B) C) D) or (A) (B) (C) (D)
          const choiceMatch = line.match(/^([A-H])[.)]\s+(.+)/) ||
                              line.match(/^\(([A-H])\)\s+(.+)/);
          if (choiceMatch) {
            choices.push({
              letter: choiceMatch[1].toUpperCase(),
              text: choiceMatch[2].trim()
            });
            continue;
          }

          // Otherwise it's part of the question text
          // Strip leading question number: "1." "Q1." "Question 1:" etc
          const stripped = line
            .replace(/^\s*(?:Q(?:uestion)?\s*)?\d+[\.\):\s]+/i, '')
            .trim();
          if (stripped) questionLines.push(stripped);
        }

        questionText = questionLines.join(' ').trim();

        // Validate
        if (!questionText) {
          errs.push(`Block ${blockIndex + 1}: Could not extract question text`);
          return;
        }
        if (choices.length < 2) {
          errs.push(`Block ${blockIndex + 1}: Less than 2 choices found - "${questionText.substring(0, 50)}..."`);
          return;
        }
        if (!correctLetter) {
          errs.push(`Block ${blockIndex + 1}: No correct answer found - "${questionText.substring(0, 50)}..."`);
          return;
        }

        // Format choices with letter prefix
        const formattedChoices = choices.map(c => `${c.letter}. ${c.text}`);

        questions.push({
          question: questionText,
          choices: formattedChoices,
          correct: correctLetter,
          explanation: explanation.trim(),
          why_others_wrong: '',
          difficulty,
          game_modes: gameModes
        });

      } catch (e) {
        errs.push(`Block ${blockIndex + 1}: Parse error - ${e.message}`);
      }
    });

    setParsed(questions);
    setErrors(errs);
    if (questions.length > 0) setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(`${SERVER_URL}/admin/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('adminPassword') || ''
        },
        body: JSON.stringify({
          questions: parsed,
          topic_id: null,
          category: activeFolder !== 'all' ? activeFolder : null,
          difficulty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setStep('done');
      setTimeout(() => {
        onImport(data);
        onClose();
      }, 1500);
    } catch (e) {
      alert('Import failed: ' + e.message);
    }
    setImporting(false);
  };

  const updateQuestion = (index, field, value) => {
    setParsed(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (index) => {
    setParsed(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qp-modal">
        <div className="qp-header">
          <h2>📋 Question Parser</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {step === 'input' && (
          <div className="qp-body">
            <p className="qp-desc">
              Paste questions in any common format. The parser handles:
              <br />• Numbered questions (1. Q1. Question 1:)
              <br />• Multiple choice (A. B. C. or A) B) C) or (A) (B) (C))
              <br />• Answer lines (Correct Answer: B, Answer: C)
              <br />• Explanation sections
              <br />Separate multiple questions with a blank line.
            </p>

            <div className="qp-example">
              <p className="qp-example-label">Example format:</p>
              <pre className="qp-example-text">{`1. A 45-year-old man presents with fatigue and pallor. Blood film shows microcytic hypochromic cells. What is the most likely diagnosis?

A. Iron deficiency anaemia
B. Thalassaemia
C. Vitamin B12 deficiency
D. Anaemia of chronic disease

Correct Answer: A

Explanation: Iron deficiency anaemia is the most common cause of microcytic anaemia worldwide...`}</pre>
            </div>

            <div className="qp-settings-row">
              <div className="qp-setting">
                <label>Default Difficulty</label>
                <select
                  className="qp-select"
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="qp-setting">
                <label>Game Modes</label>
                <div className="qp-checkboxes">
                  {['battle_royale', 'speed_race', 'trivia_pursuit'].map(mode => (
                    <label key={mode} className="qp-checkbox">
                      <input
                        type="checkbox"
                        checked={gameModes.includes(mode)}
                        onChange={e => setGameModes(prev =>
                          e.target.checked
                            ? [...prev, mode]
                            : prev.filter(m => m !== mode)
                        )}
                      />
                      {mode.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <textarea
              className="qp-textarea"
              placeholder="Paste your questions here..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={16}
            />

            <div className="qp-footer">
              <button className="qp-cancel" onClick={onClose}>Cancel</button>
              <button
                className="qp-parse-btn"
                onClick={parseQuestions}
                disabled={!rawText.trim()}
              >
                🔍 Parse Questions
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="qp-body">
            <div className="qp-preview-header">
              <div className="qp-preview-stats">
                <span className="qp-stat qp-stat--success">✅ {parsed.length} questions parsed</span>
                {errors.length > 0 && <span className="qp-stat qp-stat--error">⚠️ {errors.length} errors</span>}
              </div>
              <button className="qp-back-btn" onClick={() => setStep('input')}>← Back</button>
            </div>

            {errors.length > 0 && (
              <div className="qp-errors">
                <p className="qp-errors-title">⚠️ Parse Errors (these questions were skipped):</p>
                {errors.map((err, i) => (
                  <p key={i} className="qp-error-item">• {err}</p>
                ))}
              </div>
            )}

            <div className="qp-preview-list">
              {parsed.map((q, i) => (
                <div className="qp-preview-card" key={i}>
                  <div className="qp-preview-card-header">
                    <span className="qp-preview-num">Q{i + 1}</span>
                    <div className="qp-preview-badges">
                      <span className={`qp-difficulty-badge qp-difficulty-badge--${q.difficulty}`}>
                        {q.difficulty}
                      </span>
                      <span className="qp-correct-badge">✓ {q.correct}</span>
                    </div>
                    <button className="qp-remove-btn" onClick={() => removeQuestion(i)}>🗑</button>
                  </div>
                  <p className="qp-preview-question">{q.question}</p>
                  <div className="qp-preview-choices">
                    {q.choices.map((c, j) => (
                      <span
                        key={j}
                        className={`qp-preview-choice ${c.startsWith(q.correct + '.') || c.startsWith(q.correct + ')') ? 'qp-preview-choice--correct' : ''}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="qp-preview-explanation">
                      <span className="qp-preview-explanation-label">Explanation:</span>
                      <p>{q.explanation.substring(0, 150)}{q.explanation.length > 150 ? '...' : ''}</p>
                    </div>
                  )}
                  <div className="qp-preview-edit-row">
                    <select
                      className="qp-select qp-select--sm"
                      value={q.difficulty}
                      onChange={e => updateQuestion(i, 'difficulty', e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="hard">Hard</option>
                    </select>
                    <select
                      className="qp-select qp-select--sm"
                      value={q.correct}
                      onChange={e => updateQuestion(i, 'correct', e.target.value)}
                    >
                      {q.choices.map((_, j) => (
                        <option key={j} value={String.fromCharCode(65 + j)}>
                          Correct: {String.fromCharCode(65 + j)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="qp-why-wrong-input"
                      placeholder="Why others wrong? (optional)"
                      value={q.why_others_wrong || ''}
                      onChange={e => updateQuestion(i, 'why_others_wrong', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="qp-footer">
              <span className="qp-footer-info">
                {parsed.length} question{parsed.length !== 1 ? 's' : ''} ready to import
              </span>
              <button
                className="qp-import-btn"
                onClick={handleImport}
                disabled={importing || parsed.length === 0}
              >
                {importing ? '⏳ Importing...' : `📥 Import ${parsed.length} Questions`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="qp-body qp-done">
            <div className="qp-done-icon">✅</div>
            <h3>Import Complete!</h3>
            <p>{parsed.length} questions imported successfully.</p>
            <button className="qp-import-btn" onClick={onClose}>Close</button>
          </div>
        )}

      </div>
    </div>
  );
}
