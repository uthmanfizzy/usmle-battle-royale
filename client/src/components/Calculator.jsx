import { useState, useRef, useEffect } from 'react';
import './Calculator.css';

export default function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const [position, setPosition] = useState({ x: window.innerWidth - 250, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('.calc-close-btn') || e.target.closest('.calc-button')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Show tooltip on first load
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('calc-tooltip-seen');
    if (!hasSeenTooltip) {
      setShowTooltip(true);
      setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('calc-tooltip-seen', 'true');
      }, 3000);
    }
  }, []);

  const handleInput = (value) => {
    if (display === '0' || display === 'Error') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const handleOperator = (op) => {
    if (display === 'Error') {
      setDisplay('0');
      return;
    }
    // Don't add duplicate operators
    const lastChar = display[display.length - 1];
    if (['+', '-', '×', '÷'].includes(lastChar)) {
      setDisplay(display.slice(0, -1) + op);
    } else {
      setDisplay(display + op);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleEquals = () => {
    try {
      // Replace × and ÷ with * and /
      let expression = display.replace(/×/g, '*').replace(/÷/g, '/');

      // Safe math evaluation using Function constructor instead of eval
      // Only allows math operations, no arbitrary code execution
      const sanitized = expression.replace(/[^0-9+\-*/.()]/g, '');
      if (!sanitized) throw new Error('Invalid expression');

      // Use Function constructor for safer evaluation than eval
      const result = Function('"use strict"; return (' + sanitized + ')')();

      if (!isFinite(result)) throw new Error('Invalid result');
      setDisplay(String(result));
      setLastResult(result);
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handlePercent = () => {
    try {
      const value = parseFloat(display);
      setDisplay(String(value / 100));
    } catch {
      setDisplay('Error');
    }
  };

  const handleSqrt = () => {
    try {
      const value = parseFloat(display);
      setDisplay(String(Math.sqrt(value)));
    } catch {
      setDisplay('Error');
    }
  };

  const handleSquare = () => {
    try {
      const value = parseFloat(display);
      setDisplay(String(value * value));
    } catch {
      setDisplay('Error');
    }
  };

  const handleToggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  // Memory functions
  const handleMemoryAdd = () => {
    try {
      const value = parseFloat(display);
      setMemory(memory + value);
    } catch {}
  };

  const handleMemorySubtract = () => {
    try {
      const value = parseFloat(display);
      setMemory(memory - value);
    } catch {}
  };

  const handleMemoryRecall = () => {
    setDisplay(String(memory));
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  // On mobile, position: relative overrides these inline styles
  const panelStyle = window.innerWidth > 768 ? { left: `${position.x}px`, top: `${position.y}px` } : {};

  return (
    <div
      ref={panelRef}
      className="calculator-panel"
      style={panelStyle}
      onMouseDown={handleMouseDown}
    >
      {showTooltip && (
        <div className="calc-tooltip">
          Use calculator for biostatistics calculations
        </div>
      )}

      <div className="calc-header">
        <span className="calc-title">Calculator</span>
        <button className="calc-close-btn" onClick={onClose}>×</button>
      </div>

        <div className="calc-display">{display}</div>

        <div className="calc-buttons">
          {/* Memory row */}
          <button className="calc-button mem-btn" onClick={handleMemoryClear}>MC</button>
          <button className="calc-button mem-btn" onClick={handleMemoryRecall}>MR</button>
          <button className="calc-button mem-btn" onClick={handleMemoryAdd}>M+</button>
          <button className="calc-button mem-btn" onClick={handleMemorySubtract}>M-</button>

          {/* Function row */}
          <button className="calc-button func-btn" onClick={handleClear}>C</button>
          <button className="calc-button func-btn" onClick={handleBackspace}>⌫</button>
          <button className="calc-button func-btn" onClick={() => handleInput('(')}>{'('}</button>
          <button className="calc-button func-btn" onClick={() => handleInput(')')}>{')'}</button>

          {/* Scientific functions */}
          <button className="calc-button func-btn" onClick={handleSqrt}>√</button>
          <button className="calc-button func-btn" onClick={handleSquare}>x²</button>
          <button className="calc-button func-btn" onClick={handlePercent}>%</button>
          <button className="calc-button op-btn" onClick={() => handleOperator('÷')}>÷</button>

          {/* Number pad */}
          <button className="calc-button num-btn" onClick={() => handleInput('7')}>7</button>
          <button className="calc-button num-btn" onClick={() => handleInput('8')}>8</button>
          <button className="calc-button num-btn" onClick={() => handleInput('9')}>9</button>
          <button className="calc-button op-btn" onClick={() => handleOperator('×')}>×</button>

          <button className="calc-button num-btn" onClick={() => handleInput('4')}>4</button>
          <button className="calc-button num-btn" onClick={() => handleInput('5')}>5</button>
          <button className="calc-button num-btn" onClick={() => handleInput('6')}>6</button>
          <button className="calc-button op-btn" onClick={() => handleOperator('-')}>-</button>

          <button className="calc-button num-btn" onClick={() => handleInput('1')}>1</button>
          <button className="calc-button num-btn" onClick={() => handleInput('2')}>2</button>
          <button className="calc-button num-btn" onClick={() => handleInput('3')}>3</button>
          <button className="calc-button op-btn" onClick={() => handleOperator('+')}>+</button>

          <button className="calc-button num-btn" onClick={handleToggleSign}>±</button>
          <button className="calc-button num-btn" onClick={() => handleInput('0')}>0</button>
          <button className="calc-button num-btn" onClick={() => handleInput('.')}>.</button>
          <button className="calc-button equals-btn" onClick={handleEquals}>=</button>
        </div>
    </div>
  );
}
