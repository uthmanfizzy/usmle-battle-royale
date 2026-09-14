// Flat SVG glyphs shared by the mobile home cards and the notifications panel.
// Colours are baked in to match the home mockup (gold trophy, white swords…);
// pass className for sizing.

export const SwordsGlyph = ({ className = 'dash-play-swords' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    {/* Two blades crossing, each with a crossguard, grip and pommel. */}
    <g fill="#fff">
      <path d="M6 6 L12.5 7.5 L31 26 L26 31 L7.5 12.5 Z" />
      <path d="M42 6 L35.5 7.5 L17 26 L22 31 L40.5 12.5 Z" />
    </g>
    <g fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round">
      <path d="M24 34 L34 24" /><path d="M14 24 L24 34" />
      <path d="M31 31 L37 37" /><path d="M17 31 L11 37" />
    </g>
    <circle cx="39" cy="39" r="2.8" fill="#fff" /><circle cx="9" cy="39" r="2.8" fill="#fff" />
  </svg>
);

export const TrophyGlyph = ({ className = 'dash-tile-glyph' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#e8b04b" d="M14 6h20v4h8v5c0 6-4 10-9.5 10.8A11 11 0 0 1 26 31v5h6v6H16v-6h6v-5a11 11 0 0 1-6.5-5.2C10 25 6 21 6 15v-5h8V6Zm-4 8v1c0 3.3 1.8 5.8 4.6 6.6A18 18 0 0 1 14 17v-3h-4Zm24 0v3c0 1.6-.2 3.1-.6 4.6C36.2 20.8 38 18.3 38 15v-1h-4Z"/>
  </svg>
);

export const GroupGlyph = ({ className = 'dash-tile-glyph', color = '#e9ecf2' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <g fill={color}>
      <circle cx="24" cy="15" r="7" /><circle cx="11" cy="19" r="5" /><circle cx="37" cy="19" r="5" />
      <path d="M12 40c0-7 5.4-12 12-12s12 5 12 12Z" />
      <path d="M2 38c0-5 3.6-9 8.5-9 1.6 0 3 .4 4.2 1.1A15 15 0 0 0 10 38Z" />
      <path d="M46 38c0-5-3.6-9-8.5-9-1.6 0-3 .4-4.2 1.1A15 15 0 0 1 38 38Z" />
    </g>
  </svg>
);

export const PlayRingGlyph = ({ className = 'dash-tile-glyph' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.35)" stroke="#e8b04b" strokeWidth="3" />
    <path fill="#e8b04b" d="M19 15.5v17l14-8.5Z" />
  </svg>
);

export const PlayGlyph = ({ className, color = '#c4b5fd' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill={color} d="M15 9.5v29l24-14.5Z" />
  </svg>
);

export const ScrollGlyph = ({ className, color = '#e8b04b' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <rect x="11" y="7" width="26" height="34" rx="3" fill="none" stroke={color} strokeWidth="3" />
    <g stroke={color} strokeWidth="2.6" strokeLinecap="round">
      <path d="M17 16h14" /><path d="M17 22h14" /><path d="M17 28h14" /><path d="M17 34h9" />
    </g>
  </svg>
);

export const WrenchGlyph = ({ className, color = '#cbd2dc' }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill={color} d="M31.5 5a11 11 0 0 0-10.3 14.8L6.6 34.4a4 4 0 0 0 0 5.7l1.3 1.3a4 4 0 0 0 5.7 0l14.6-14.6A11 11 0 0 0 43 16.5l-6.4 6.4-6.8-1.7-1.7-6.8L34.5 8A11 11 0 0 0 31.5 5Z" />
  </svg>
);
