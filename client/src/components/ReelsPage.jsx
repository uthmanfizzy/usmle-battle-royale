import { useEffect } from 'react';
import { getToken } from '../auth';
import ShortsFeed from './ShortsFeed';
import './ReelsPage.css';

/**
 * /reels — the standalone Reels page the Dashboard's REELS card opens.
 *
 * A thin host, not a second implementation: the feed itself is ShortsFeed,
 * already built and in use as DashboardNew's Shorts tab. This gives it the full
 * viewport it is designed for (a scroll-snap feed fights any page that adds
 * header clearance around it) plus the one thing it lacks on its own — a way
 * out, since every slide is edge-to-edge video.
 */
export default function ReelsPage() {
  // Same own-identity guard the other signed-in pages use.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; }
  }, []);

  return (
    <div className="reels-page">
      <button
        type="button"
        className="reels-back"
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        ← Back to Dashboard
      </button>
      <ShortsFeed />
    </div>
  );
}
