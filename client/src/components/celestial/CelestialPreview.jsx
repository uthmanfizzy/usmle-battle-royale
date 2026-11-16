import { ART } from './CelestialShell';
import './CelestialPreview.css';

/** Settings → Appearance thumbnail for the Celestial theme: a tiny home page. */
export default function CelestialPreview() {
  return (
    <div className="ap-prev cpv" aria-hidden="true">
      <div className="cpv-side">
        <img src={`${ART}/emblem.png`} alt="" />
        <i className="cpv-on" /><i /><i /><i /><i />
      </div>
      <div className="cpv-main">
        <div className="cpv-hero" style={{ backgroundImage: `url(${ART}/hero.jpg)` }}>
          <span className="cpv-name">PLAYER</span>
          <span className="cpv-play">▶ PLAY</span>
        </div>
        <div className="cpv-cards"><i /><i /><i /><i /></div>
        <div className="cpv-row"><i /><i /></div>
      </div>
    </div>
  );
}
