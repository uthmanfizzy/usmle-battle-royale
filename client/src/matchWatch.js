/**
 * Match integrity watcher.
 *
 * Reports what the browser can actually tell us about a player's attention
 * during a live match: leaving the tab, clicking away from the window,
 * selecting text, copying, opening the context menu, and pressing the keys
 * that TAKE a screenshot.
 *
 * What this is NOT: a screenshot detector. No browser can tell a web page
 * that a screenshot was taken — the capture happens in the operating system,
 * outside anything a page can observe. What we can see is the keyboard
 * shortcut being pressed in the tab (PrintScreen, Cmd+Shift+3/4/5,
 * Win+Shift+S) and the screen-capture API being called from the page. A
 * phone pointed at the monitor, or a capture started from another window,
 * leaves no trace at all. Everything downstream — the report, the admin
 * panel — is worded to say exactly that, because a signal presented as
 * stronger than it is would be worse than no signal.
 *
 * Usage: const stop = watchMatch(evt => socket.emit('match_event', evt));
 */

// Don't let one twitchy player flood the socket: the same kind of event is
// reported at most this often, and a match is capped overall.
const THROTTLE_MS = 1500;
const MAX_EVENTS = 250;

export function watchMatch(report) {
  if (typeof window === 'undefined' || typeof report !== 'function') return () => {};

  let sent = 0;
  const lastAt = new Map();
  let awaySince = 0;

  const emit = (type, meta) => {
    if (sent >= MAX_EVENTS) return;
    const now = Date.now();
    if (now - (lastAt.get(type) || 0) < THROTTLE_MS) return;
    lastAt.set(type, now);
    sent += 1;
    try { report({ type, at: now, ...(meta ? { meta } : {}) }); } catch { /* never break a match over telemetry */ }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      awaySince = Date.now();
      emit('tab_hidden');
    } else if (awaySince) {
      const ms = Date.now() - awaySince;
      awaySince = 0;
      // The return is the interesting half: it carries how long they were gone.
      lastAt.delete('tab_visible');
      emit('tab_visible', { ms });
    }
  };

  const onBlur = () => emit('window_blur');
  const onFocus = () => emit('window_focus');

  const onKeyDown = (e) => {
    const key = (e.key || '').toLowerCase();
    const mod = e.metaKey || e.ctrlKey;
    if (key === 'printscreen') return emit('screenshot_key', { combo: 'PrintScreen' });
    if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(key)) {
      return emit('screenshot_key', { combo: `Cmd+Shift+${key}` });
    }
    // Windows' own Snip & Sketch shortcut. The Win key reaches the page as
    // metaKey on Windows, so this is the same branch with a different name.
    if (e.shiftKey && e.metaKey && key === 's') return emit('screenshot_key', { combo: 'Win+Shift+S' });
    if (mod && e.shiftKey && key === 's') return emit('screenshot_key', { combo: 'Ctrl+Shift+S' });
    if (mod && key === 'p') return emit('print_key', { combo: 'Ctrl/Cmd+P' });
    if (mod && key === 'c') return emit('copy_key', { combo: 'Ctrl/Cmd+C' });
    return undefined;
  };

  const onCopy = () => {
    const len = (window.getSelection?.()?.toString() || '').length;
    emit('copy', len ? { chars: len } : undefined);
  };

  // Length only — never the text. What matters for a report is that a stem
  // was being selected, not which words.
  const onMouseUp = () => {
    const len = (window.getSelection?.()?.toString() || '').trim().length;
    if (len >= 3) emit('highlight', { chars: len });
  };

  const onContext = () => emit('context_menu');

  // The page asking to capture the screen IS observable, unlike the OS doing
  // it. Wrap it rather than replace it: whatever the page wanted still runs.
  let restoreCapture = null;
  const md = navigator.mediaDevices;
  if (md && typeof md.getDisplayMedia === 'function') {
    const original = md.getDisplayMedia.bind(md);
    md.getDisplayMedia = function patched(...args) {
      emit('screen_capture_api');
      return original(...args);
    };
    restoreCapture = () => { md.getDisplayMedia = original; };
  }

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('copy', onCopy);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('contextmenu', onContext);

  return function stop() {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('copy', onCopy);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('contextmenu', onContext);
    if (restoreCapture) restoreCapture();
  };
}

/** How each event type reads in a report. Shared by the admin panel. */
export const MATCH_EVENT_LABELS = {
  tab_hidden: 'Left the tab',
  tab_visible: 'Came back',
  window_blur: 'Clicked away from the window',
  window_focus: 'Back on the window',
  screenshot_key: 'Pressed a screenshot shortcut',
  screen_capture_api: 'Started a screen capture',
  print_key: 'Pressed print',
  copy_key: 'Pressed copy',
  copy: 'Copied text',
  highlight: 'Selected text',
  context_menu: 'Opened the right-click menu',
};
