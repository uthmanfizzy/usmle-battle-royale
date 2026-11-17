import { ART } from './MoonlitMenu';
import './MoonlitTabFrame.css';

/**
 * The Moonlit frame for the dashboard's other tabs (Leaderboards, Clans,
 * News, Friends): the same painting, dimmed, behind the tab's own content,
 * with a way back to the main menu.
 */
export default function MoonlitTabFrame({ title, onBack, children }) {
  return (
    <div className="mlf">
      <div className="mlf-bg" style={{ backgroundImage: `url(${ART}/scene.jpg)` }} aria-hidden="true" />
      <header className="mlf-head">
        <button type="button" className="mlf-back" onClick={onBack}>← Main menu</button>
        {title && <h1 className="mlf-title">{title}</h1>}
      </header>
      <div className="mlf-body dashboard-screen cs-tabhost">{children}</div>
    </div>
  );
}
