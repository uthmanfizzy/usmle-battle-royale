import { useState } from 'react';
import './QuestionParser.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

const EXAMPLE_TEXT = `1. A 45-year-old man presents with fatigue, pallor, and shortness of breath. His blood film shows hypochromic microcytic red blood cells. Serum ferritin is low. Which is the most likely diagnosis?

A. Iron deficiency anaemia
B. Anaemia of chronic disease
C. Thalassaemia trait
D. Sideroblastic anaemia
E. Vitamin B12 deficiency

Correct Answer: A

Explanation: Iron deficiency anaemia is the most common cause of hypochromic microcytic anaemia worldwide. Low serum ferritin is the most sensitive and specific marker for iron deficiency. Patients typically present with fatigue, pallor, and shortness of breath.

Why are the other options wrong?
B. Anaemia of chronic disease - Ferritin is normal or elevated due to inflammation. Iron is sequestered in macrophages.
C. Thalassaemia trait - Ferritin is normal. Red cell count is often elevated and patients are usually asymptomatic.
D. Sideroblastic anaemia - Ferritin is elevated. Blood film shows ring sideroblasts on Prussian blue staining.
E. Vitamin B12 deficiency - Causes macrocytic megaloblastic anaemia, not microcytic. Shows hypersegmented neutrophils.`;

export default function QuestionParser({ activeFolder, selectedDifficulty, onImport, onClose }) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState('input'); // 'input' | 'preview' | 'done'
  const [importing, setImporting] = useState(false);
  const [difficulty, setDifficulty] = useState(selectedDifficulty || 'easy');
  const [gameModes, setGameModes] = useState(['battle_royale', 'speed_race', 'trivia_pursuit']);
  const [copied, setCopied] = useState(false);

  const parseQuestions = () => {
    const questions = [];
    const errs = [];

    if (!rawText.trim()) return;

    // Split into blocks by double newlines
    // Merge all non-question-starting blocks with previous to keep multi-paragraph explanations together
    const blocks = rawText
      .trim()
      .split(/\n\s*\n/)
      .reduce((acc, block) => {
        const trimmed = block.trim();
        if (!trimmed) return acc;
        // Check if this block starts a new question
        const isQuestion = /^(Q?\d+[.):\s]|Question\s+\d+)/i.test(trimmed);

        // If NOT a new question and we have previous blocks, merge with last block
        if (acc.length > 0 && !isQuestion) {
          acc[acc.length - 1] += '\n\n' + trimmed;
        } else {
          acc.push(trimmed);
        }
        return acc;
      }, []);

    // If only one block after reduction, treat whole text as one question
    const finalBlocks = blocks.length === 0 ? [rawText.trim()] : blocks;

    finalBlocks.forEach((block, blockIndex) => {
      try {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 3) return;

        let questionLines = [];
        let choices = [];
        let correctLetter = '';
        let explanation = '';
        let whyOthersWrong = '';
        let mode = 'question'; // 'question' | 'choices' | 'answer' | 'explanation' | 'why'

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // ── Detect section headers ──────────────────
          // Why others wrong
          if (/^why\s+(are\s+)?(the\s+)?other/i.test(line) ||
              /^incorrect\s+options?/i.test(line) ||
              /^wrong\s+options?/i.test(line)) {
            mode = 'why';
            // grab any text after the header on same line
            const rest = line.replace(/^[^:?]*[?:]?\s*/i, '').trim();
            if (rest) whyOthersWrong += rest + '\n';
            continue;
          }

          // Explanation
          if (/^(explanation|rationale|discussion|answer\s+explanation)[\s:]*/i.test(line)) {
            mode = 'explanation';
            const rest = line.replace(/^(explanation|rationale|discussion|answer\s+explanation)[\s:]*/i, '').trim();
            if (rest) explanation += rest + '\n';
            continue;
          }

          // Educational objective - append to explanation
          if (/^educational\s+objective[\s:]*/i.test(line)) {
            mode = 'explanation';
            const rest = line.replace(/^educational\s+objective[\s:]*/i, '').trim();
            if (rest) explanation += '\n[gold]Educational Objective:[/gold] ' + rest + '\n';
            continue;
          }

          // Correct answer line
          const answerMatch = line.match(/^(?:correct\s+)?answer[\s:]+([A-H])/i) ||
                              line.match(/^(?:the\s+)?correct\s+(?:answer\s+)?(?:is\s+)?:?\s*([A-H])[.\s,)]/i);
          if (answerMatch) {
            correctLetter = answerMatch[1].toUpperCase();
            mode = 'answer';
            continue;
          }

          // ── Handle content by mode ──────────────────
          if (mode === 'why') {
            whyOthersWrong += line + '\n';
            continue;
          }

          if (mode === 'explanation' || mode === 'answer') {
            // If we hit a choice after explanation start, it's part of why others wrong
            const choiceInExp = line.match(/^([A-H])[.)]\s+(.+)/);
            if (choiceInExp && mode === 'explanation' && choices.find(c => c.letter === choiceInExp[1])) {
              // this looks like a distractor explanation
              whyOthersWrong += line + '\n';
            } else {
              explanation += line + '\n';
            }
            continue;
          }

          // Choice detection: A. B) (A) A -
          const choiceMatch = line.match(/^([A-H])[.)]\s+(.+)/) ||
                              line.match(/^\(([A-H])\)\s+(.+)/) ||
                              line.match(/^([A-H])\s+-\s+(.+)/);
          if (choiceMatch) {
            choices.push({ letter: choiceMatch[1].toUpperCase(), text: choiceMatch[2].trim() });
            mode = 'choices';
            continue;
          }

          // Question text - strip leading number
          if (mode === 'question') {
            const stripped = line
              .replace(/^\s*(?:Q(?:uestion)?\s*)?\d+\s*[.):\s]\s*/i, '')
              .trim();
            if (stripped) questionLines.push(stripped);
          }
        }

        const questionText = questionLines.join(' ').trim();

        // Validate
        if (!questionText) {
          errs.push(`Block ${blockIndex + 1}: No question text found`);
          return;
        }
        if (choices.length < 2) {
          errs.push(`Block ${blockIndex + 1}: Need at least 2 choices — found ${choices.length}. Text: "${questionText.substring(0,60)}..."`);
          return;
        }
        if (!correctLetter) {
          errs.push(`Block ${blockIndex + 1}: No correct answer found — "${questionText.substring(0,60)}..."`);
          return;
        }

        const formattedChoices = choices.map(c => `${c.letter}. ${c.text}`);

        questions.push({
          question: questionText,
          choices: formattedChoices,
          correct: correctLetter,
          explanation: explanation.trim(),
          why_others_wrong: whyOthersWrong.trim(),
          difficulty,
          game_modes: gameModes
        });

      } catch(e) {
        errs.push(`Block ${blockIndex + 1}: Error — ${e.message}`);
      }
    });

    setParsed(questions);
    setErrors(errs);
    if (questions.length > 0) {
      setStep('preview');
    } else {
      setErrors(prev => [...prev, 'No valid questions found. Make sure choices use A. B. C. format and include "Correct Answer: X"']);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch(`${SERVER_URL}/admin/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': localStorage.getItem('usmle_admin_session') || ''
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
          <div className="qp-body-horizontal">

            {/* LEFT COLUMN - Example and settings */}
            <div className="qp-left-col">

              {/* Example section */}
              <div className="qp-example-section">
                <div className="qp-example-header">
                  <div className="qp-example-dots">
                    <span className="qp-dot qp-dot--red" />
                    <span className="qp-dot qp-dot--yellow" />
                    <span className="qp-dot qp-dot--green" />
                  </div>
                  <span className="qp-example-title">Example Format</span>
                  <button
                    className="qp-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(EXAMPLE_TEXT);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <pre className="qp-example-text">{EXAMPLE_TEXT}</pre>
              </div>

              {/* Settings */}
              <div className="qp-settings-col">
                <div className="qp-setting-group">
                  <label>DIFFICULTY</label>
                  <div className="qp-difficulty-toggle">
                    <button
                      className={`qp-diff-btn ${difficulty === 'easy' ? 'qp-diff-btn--easy--active' : ''}`}
                      onClick={() => setDifficulty('easy')}
                    >🟢 Easy</button>
                    <button
                      className={`qp-diff-btn ${difficulty === 'hard' ? 'qp-diff-btn--hard--active' : ''}`}
                      onClick={() => setDifficulty('hard')}
                    >🔴 Hard</button>
                  </div>
                </div>
                <div className="qp-setting-group">
                  <label>GAME MODES</label>
                  <div className="qp-mode-toggles">
                    {[
                      { id: 'battle_royale', label: '⚔️ Battle Royale' },
                      { id: 'speed_race', label: '🏎️ Speed Race' },
                      { id: 'trivia_pursuit', label: '🎯 Trivia' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        className={`qp-mode-btn ${gameModes.includes(mode.id) ? 'qp-mode-btn--active' : ''}`}
                        onClick={() => setGameModes(prev =>
                          prev.includes(mode.id)
                            ? prev.filter(m => m !== mode.id)
                            : [...prev, mode.id]
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="qp-setting-group">
                  <label>SUPPORTS</label>
                  <div className="qp-supports-list">
                    <span>🔢 Numbered questions</span>
                    <span>🔤 A. B. C. or A) B) C)</span>
                    <span>✅ Correct Answer: B</span>
                    <span>📝 Explanation:</span>
                    <span>❌ Why others wrong:</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - Paste area */}
            <div className="qp-right-col">
              <div className="qp-paste-header">
                <span className="qp-paste-label">📄 Paste Your Questions</span>
                {rawText && (
                  <button className="qp-clear-btn" onClick={() => setRawText('')}>✕ Clear</button>
                )}
              </div>
              <textarea
                className="qp-textarea"
                placeholder={`Paste questions here...\n\nSeparate multiple questions with a blank line.`}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                autoFocus
              />
              {rawText && (
                <p className="qp-char-count">
                  {rawText.length.toLocaleString()} chars · ~{Math.max(1, rawText.split(/\n{2,}/).length)} question block{rawText.split(/\n{2,}/).length !== 1 ? 's' : ''} detected
                </p>
              )}
              <div className="qp-right-footer">
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
                      <p style={{whiteSpace: 'pre-wrap'}}>{q.explanation}</p>
                    </div>
                  )}
                  {q.why_others_wrong && (
                    <div className="qp-preview-why-wrong">
                      <span className="qp-preview-explanation-label">Why Others Wrong:</span>
                      <p style={{whiteSpace: 'pre-wrap'}}>{q.why_others_wrong}</p>
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
