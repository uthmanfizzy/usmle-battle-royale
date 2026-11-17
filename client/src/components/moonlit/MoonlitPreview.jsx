import { ART } from './MoonlitMenu';
import './MoonlitPreview.css';

/** Settings → Appearance thumbnail for the Moonlit theme: a tiny main menu. */
export default function MoonlitPreview() {
  return (
    <div className="ap-prev mlpv" aria-hidden="true" style={{ backgroundImage: `url(${ART}/scene.jpg)` }}>
      <span className="mlpv-chip"><i /></span>
      <span className="mlpv-rounds"><i /><i /><i /></span>
      <span className="mlpv-title">Medvale</span>
      <span className="mlpv-play">Play</span>
      <span className="mlpv-cards"><i /><i /><i /><i /></span>
    </div>
  );
}
