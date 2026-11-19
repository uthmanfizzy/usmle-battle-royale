import { ART } from './MoonlitMenu';
import './MoonlitPreview.css';

/** Settings → Appearance thumbnail for the Moonlit theme: a tiny main menu. */
export default function MoonlitPreview() {
  return (
    <div className="ap-prev mlpv" aria-hidden="true" style={{ backgroundImage: `url(${ART}/scene.jpg)` }}>
      <span className="mlpv-side">{[14, 24, 34, 44, 54, 64].map(t => <i key={t} style={{ top: t + 24 }} />)}</span>
      <span className="mlpv-chips"><i /><i /><i /></span>
      <span className="mlpv-title">Welcome back</span>
      <span className="mlpv-play">▸ Play</span>
      <span className="mlpv-cards"><i /><i /><i /><i /></span>
      <span className="mlpv-panels"><i /><i /></span>
    </div>
  );
}
