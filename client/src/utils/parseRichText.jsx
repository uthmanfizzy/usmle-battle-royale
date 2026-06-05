import React from 'react';

const COLORS = {
  red:    '#ff6b6b',
  blue:   '#74b9ff',
  green:  '#55efc4',
  yellow: '#fdcb6e',
  orange: '#fd9644',
  purple: '#a29bfe',
  gold:   '#ffd700',
  pink:   '#fd79a8',
  cyan:   '#00cec9',
  white:  '#ffffff',
};

export function parseRichText(text) {
  if (!text) return null;

  // Split by newlines first to handle line breaks
  const lines = text.split('\n');

  return lines.map((line, lineIndex) => {
    const parts = [];
    let remaining = line;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Check for color tags [color]...[/color]
      const colorMatch = remaining.match(/^\[(\w+)\]([\s\S]*?)\[\/\1\]/);
      if (colorMatch) {
        const [full, color, content] = colorMatch;
        if (COLORS[color]) {
          parts.push(
            <span key={keyIndex++} style={{ color: COLORS[color] }}>
              {parseInline(content, keyIndex)}
            </span>
          );
          remaining = remaining.slice(full.length);
          continue;
        }
      }

      // Check for bold **text**
      const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIndex++} style={{ fontWeight: 700 }}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic *text*
      const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
      if (italicMatch) {
        parts.push(
          <em key={keyIndex++}>
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for underline __text__
      const underlineMatch = remaining.match(/^__([\s\S]*?)__/);
      if (underlineMatch) {
        parts.push(
          <u key={keyIndex++}>
            {underlineMatch[1]}
          </u>
        );
        remaining = remaining.slice(underlineMatch[0].length);
        continue;
      }

      // No match - consume one character as plain text
      // Batch plain characters together
      let plainEnd = 0;
      while (plainEnd < remaining.length) {
        const next = remaining.slice(plainEnd);
        if (
          next.match(/^\*\*/) ||
          next.match(/^\*[^*]/) ||
          next.match(/^__/) ||
          next.match(/^\[\w+\]/)
        ) break;
        plainEnd++;
      }
      if (plainEnd === 0) plainEnd = 1;
      parts.push(remaining.slice(0, plainEnd));
      remaining = remaining.slice(plainEnd);
    }

    return (
      <React.Fragment key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// Parse inline formatting (bold/italic inside color tags)
function parseInline(text, startKey = 0) {
  const parts = [];
  let remaining = text;
  let k = startKey;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={k++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    const italicMatch = remaining.match(/^\*([\s\S]*?)\*/);
    if (italicMatch) {
      parts.push(<em key={k++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    let plainEnd = 0;
    while (plainEnd < remaining.length) {
      const next = remaining.slice(plainEnd);
      if (next.match(/^\*\*/) || next.match(/^\*[^*]/)) break;
      plainEnd++;
    }
    if (plainEnd === 0) plainEnd = 1;
    parts.push(remaining.slice(0, plainEnd));
    remaining = remaining.slice(plainEnd);
  }
  return parts;
}

export default parseRichText;
