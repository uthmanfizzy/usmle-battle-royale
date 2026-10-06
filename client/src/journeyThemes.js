/**
 * Colour themes for the First Aid Journey game screen.
 *
 * Each one is a class on the screen (.jm-theme-<id>) that restates a handful
 * of custom properties in SoloGameJourney.css — the three background glows,
 * the base gradient and the accent. Everything else, including the colours
 * that MEAN something (green for a correct answer, red for a wrong one), is
 * left alone: a theme changes the room, not the scoreboard.
 *
 * `swatch` is [paper, accent, second accent], drawn as the little three-tone
 * dot in the picker.
 */
export const JOURNEY_THEMES = [
  { id: 'emerald',  name: 'Emerald Hall',   swatch: ['#0d1712', '#e8b04b', '#4fd1c5'] },
  { id: 'sapphire', name: 'Midnight Blue',  swatch: ['#0a1430', '#7fb4ff', '#b48cff'] },
  { id: 'rosewood', name: 'Rosewood',       swatch: ['#1b0c16', '#f0a6c0', '#e8b04b'] },
  { id: 'amber',    name: 'Desert Amber',   swatch: ['#1a1209', '#f0b860', '#9fcf8a'] },
  { id: 'arctic',   name: 'Arctic Glass',   swatch: ['#0a1620', '#7fe3ea', '#aab9ff'] },
  { id: 'nebula',   name: 'Nebula',         swatch: ['#120a1e', '#c494ff', '#5ad6ea'] },
  { id: 'sunset',   name: 'Last Light',     swatch: ['#160e18', '#ff9a63', '#ffd36b'] },
  { id: 'ink',      name: 'Ink & Pearl',    swatch: ['#0e1013', '#cfd6e0', '#8fb8d8'] },
];

export const JOURNEY_THEME_DEFAULT = 'emerald';
const KEY = 'jm_theme';

export function loadJourneyTheme() {
  try {
    const v = localStorage.getItem(KEY);
    return JOURNEY_THEMES.some(t => t.id === v) ? v : JOURNEY_THEME_DEFAULT;
  } catch {
    return JOURNEY_THEME_DEFAULT;
  }
}

export function saveJourneyTheme(id) {
  try { localStorage.setItem(KEY, id); } catch { /* private mode — the choice just won't persist */ }
}
