import { parseRichText } from '../utils/parseRichText';

/**
 * Formats explanation text with rich text formatting and proper sentence spacing
 * Supports: **bold**, *italic*, __underline__, [color]text[/color]
 */
export default function ExplanationText({ text, className = '' }) {
  if (!text) return null;

  // Split into sentences - handle periods followed by space and capital letter,
  // or period at end of string
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])$/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return (
    <div className={`explanation-text explanation-rich ${className}`}>
      {sentences.map((sentence, idx) => (
        <p key={idx} className="explanation-sentence">
          {parseRichText(sentence)}
        </p>
      ))}
    </div>
  );
}
