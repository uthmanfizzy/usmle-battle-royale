import { useEffect, useRef, useState, useCallback } from 'react';
import { embedUrlStatic } from '../utils/shortEmbeds';
import './ShortPlayer.css';

/**
 * A YouTube video with our controls instead of YouTube's.
 *
 * WHAT THIS IS. YouTube's embed must stay YouTube's player — their terms
 * require it for their video, and nothing in the iframe API hands over the
 * picture to draw ourselves. What the API does allow is turning their
 * furniture off and driving the player from outside: controls=0 removes the
 * bar along the bottom, and play, pause, seek, mute and the current time all
 * come through postMessage. So the player below is theirs and everything you
 * see on top of it is ours.
 *
 * WHAT IS STILL THEIRS, and cannot be removed by any parameter: the title and
 * channel strip that slides in across the top when the video is paused or
 * hovered, and the watermark in the corner. Pausing through our button rather
 * than by tapping the picture keeps it away most of the time, which is the
 * best an embed can do.
 *
 * WHY IT MATTERS HERE. A Short is 9:16. Played in a 16:9 frame it becomes a
 * narrow column with the player's furniture spread across the empty sides —
 * which is what sent the picture into a letterbox with buttons over it.
 * `vertical` gives the frame the video's own shape, and then there is nothing
 * spare for anything to sit on.
 *
 * IF THE API NEVER LOADS — blocked script, offline, an adblocker — this falls
 * back to the ordinary embed WITH YouTube's controls, because a video you can
 * play with their bar beats a video with no controls at all.
 */

const API_SRC = 'https://www.youtube.com/iframe_api';
let apiPromise = null;

// One script, however many players mount. Resolves with window.YT.
function loadApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const done = () => (window.YT?.Player ? resolve(window.YT) : reject(new Error('YT missing')));
    // YouTube calls this global when it is ready; chain rather than clobber,
    // in case anything else on the page is waiting for it too.
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') { try { previous(); } catch { /* theirs, not ours */ } }
      done();
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const tag = document.createElement('script');
      tag.src = API_SRC;
      tag.async = true;
      tag.onerror = () => reject(new Error('blocked'));
      document.head.appendChild(tag);
    }
    // A script that never calls back should not leave the player blank for
    // ever; the fallback embed is better than a hole.
    setTimeout(() => (window.YT?.Player ? resolve(window.YT) : reject(new Error('timeout'))), 6000);
  }).catch((e) => { apiPromise = null; throw e; });
  return apiPromise;
}

const clock = (s) => {
  const t = Math.max(0, Math.floor(Number(s) || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

export default function ShortPlayer({ videoId, vertical = false, title = 'Video' }) {
  const hostRef   = useRef(null);
  const playerRef = useRef(null);
  const tickRef   = useRef(0);

  const [ready, setReady]   = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted]   = useState(false);
  const [at, setAt]         = useState(0);
  const [length, setLength] = useState(0);

  useEffect(() => {
    let dead = false;
    loadApi().then((YT) => {
      if (dead || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          controls: 0, rel: 0, playsinline: 1, modestbranding: 1,
          iv_load_policy: 3, disablekb: 1, fs: 0,
        },
        host: 'https://www.youtube-nocookie.com',
        events: {
          onReady: (e) => {
            if (dead) return;
            setReady(true);
            setLength(e.target.getDuration?.() || 0);
            setMuted(!!e.target.isMuted?.());
          },
          onStateChange: (e) => {
            if (dead) return;
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.PLAYING && !length) {
              setLength(e.target.getDuration?.() || 0);
            }
          },
          onError: () => { if (!dead) setFailed(true); },
        },
      });
    }).catch(() => { if (!dead) setFailed(true); });

    return () => {
      dead = true;
      clearInterval(tickRef.current);
      try { playerRef.current?.destroy?.(); } catch { /* already gone */ }
      playerRef.current = null;
    };
  }, [videoId]);   // eslint-disable-line react-hooks/exhaustive-deps

  // Where we are, while playing. Stopped when paused so a modal left open
  // is not polling for ever.
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!playing) return undefined;
    tickRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      setAt(p.getCurrentTime() || 0);
      if (!length) setLength(p.getDuration?.() || 0);
    }, 250);
    return () => clearInterval(tickRef.current);
  }, [playing, length]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo?.(); else p.playVideo?.();
  }, [playing]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    if (p.isMuted?.()) { p.unMute?.(); setMuted(false); } else { p.mute?.(); setMuted(true); }
  }, []);

  const scrub = useCallback((e) => {
    e.stopPropagation();
    const p = playerRef.current;
    const bar = e.currentTarget;
    if (!p?.seekTo || !length) return;
    const r = bar.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    p.seekTo(frac * length, true);
    setAt(frac * length);
  }, [length]);

  const frameClass = `sp-frame${vertical ? ' sp-frame--vertical' : ''}`;

  // The API never arrived: their player, their controls, right shape.
  if (failed) {
    return (
      <div className={frameClass}>
        <iframe
          src={embedUrlStatic('youtube', videoId)}
          title={title}
          frameBorder="0"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className={frameClass}>
      <div className="sp-stage" ref={hostRef} />

      {/* Ours, over theirs. The whole picture is the play/pause target, which
          is what a vertical video wants — and it means the bar below is the
          only furniture on screen. */}
      <button
        type="button"
        className={`sp-tap${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {!playing && <span className="sp-big" aria-hidden="true">▶</span>}
      </button>

      <div className="sp-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="sp-btn"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-label={playing ? 'Pause' : 'Play'}
        >{playing ? '❚❚' : '▶'}</button>

        <span className="sp-time">{clock(at)}</span>

        <div
          className="sp-track"
          onClick={scrub}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(length)}
          aria-valuenow={Math.round(at)}
          onKeyDown={(e) => {
            const p = playerRef.current;
            if (!p?.seekTo) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); p.seekTo(Math.min(length, at + 5), true); }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); p.seekTo(Math.max(0, at - 5), true); }
          }}
        >
          <span className="sp-fill" style={{ width: length ? `${(at / length) * 100}%` : '0%' }} />
        </div>

        <span className="sp-time">{clock(length)}</span>

        <button
          type="button"
          className="sp-btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >{muted ? '🔇' : '🔊'}</button>
      </div>

      {!ready && <div className="sp-loading" aria-hidden="true" />}
    </div>
  );
}
