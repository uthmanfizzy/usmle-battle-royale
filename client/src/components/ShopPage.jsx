import { useState, useEffect } from 'react';
import { getToken, fetchMe, getCachedUser, authFetch } from '../auth';
import './ShopPage.css';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

// Standalone Shop page — virtual-currency (gems) gear purchases only.
// Featured bundles and real-money currency packs have NO backend (no payment
// processor exists anywhere in the codebase), so those tabs are honest
// coming-soon states, same pattern as the Quests page's Weekly tab.
// Purchases go through POST /api/gear-items/purchase, which relays the
// purchase_gear_item RPC — the single atomic spend path for users.gems.
export default function ShopPage() {
  const [user, setUser] = useState(getCachedUser);
  // Deep-linkable tab (/shop?tab=currency), same URLSearchParams pattern the
  // Dashboard uses for ?tab=clans; unknown values fall back to 'gear'.
  const [tab, setTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    return ['featured', 'currency', 'gear'].includes(t) ? t : 'gear';
  }); // 'featured' | 'currency' | 'gear'
  const [items, setItems] = useState([]);
  const [ownedIds, setOwnedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);   // gear_item_id mid-purchase
  const [notice, setNotice] = useState(null);       // { itemId, kind: 'error'|'success', text }

  // Same own-identity guard /quests and /settings use: no token → landing.
  useEffect(() => {
    if (!getToken()) { window.location.href = '/'; return; }
    fetchMe().then(me => { if (me) setUser(me); });
  }, []);

  // Catalog (public) + own collection (public, but needs the user id)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const catalogReq = fetch(`${SERVER_URL}/api/gear-items`).then(r => r.json());
        const myId = getCachedUser()?.id;
        const ownedReq = myId
          ? fetch(`${SERVER_URL}/api/users/${myId}/gear`).then(r => r.json()).catch(() => ({ gear: [] }))
          : Promise.resolve({ gear: [] });
        const [catalog, owned] = await Promise.all([catalogReq, ownedReq]);
        if (cancelled) return;
        setItems(catalog.items || []);
        setOwnedIds(new Set((owned.gear || []).map(g => g.id)));
      } catch (err) {
        console.error('Failed to load shop:', err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function buyItem(item) {
    // Plain-confirm convention (same as ClansPage's leave-clan confirm)
    if (!window.confirm(`Buy ${item.name} for ${item.price_gems} gems?`)) return;
    setBuyingId(item.id);
    setNotice(null);
    try {
      const res = await authFetch('/api/gear-items/purchase', {
        method: 'POST',
        body: JSON.stringify({ gear_item_id: item.id }),
      });
      const data = await res.json();
      if (data.success) {
        setOwnedIds(prev => new Set([...prev, item.id]));
        if (data.new_gems != null) setUser(u => (u ? { ...u, gems: data.new_gems } : u));
        setNotice({ itemId: item.id, kind: 'success', text: `${item.name} is yours!` });
      } else {
        setNotice({ itemId: item.id, kind: 'error', text: data.message || 'Purchase failed.' });
      }
    } catch (err) {
      setNotice({ itemId: item.id, kind: 'error', text: 'Purchase failed — check your connection.' });
    }
    setBuyingId(null);
  }

  // Auto-clear the inline notice after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const comingSoon = (icon, title) => (
    <div className="sp-soon">
      <span className="sp-soon-icon" aria-hidden="true">{icon}</span>
      <h2 className="sp-soon-title">{title}</h2>
      <p className="sp-soon-sub">
        This part of the shop isn't open yet. Gear is available now — spend your gems there!
      </p>
    </div>
  );

  return (
    <div className="sp">
      {/* Top bar: wordmark + currency pills + avatar */}
      <div className="sp-topbar">
        <a className="sp-wordmark" href="/dashboard">MEDVALE</a>
        <div className="sp-topbar-right">
          <div className="sp-currency" aria-label="Currency">
            <span className="sp-currency-item">🪙 {user?.coins ?? 0}</span>
            <span className="sp-currency-divider" aria-hidden="true" />
            <span className="sp-currency-item">💎 {user?.gems ?? 0}</span>
          </div>
          <div className="sp-avatar" title={user?.username || 'Player'}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.username} referrerPolicy="no-referrer" />
              : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="sp-back"
        onClick={() => { window.location.href = '/dashboard'; }}
      >
        ← Back to Dashboard
      </button>

      <div className="sp-col">
        <h1 className="sp-title">Shop</h1>
        <p className="sp-subtitle">Bundles, currency, and gear for the road ahead.</p>

        <div className="sp-tabs">
          <button
            type="button"
            className={`sp-tab ${tab === 'featured' ? 'sp-tab--active' : ''}`}
            onClick={() => setTab('featured')}
          >
            FEATURED
          </button>
          <button
            type="button"
            className={`sp-tab ${tab === 'currency' ? 'sp-tab--active' : ''}`}
            onClick={() => setTab('currency')}
          >
            CURRENCY
          </button>
          <button
            type="button"
            className={`sp-tab ${tab === 'gear' ? 'sp-tab--active' : ''}`}
            onClick={() => setTab('gear')}
          >
            GEAR
          </button>
        </div>

        {tab === 'featured' && comingSoon('🎁', 'Featured bundles are coming soon!')}
        {tab === 'currency' && comingSoon('🪙', 'Currency packs are coming soon!')}

        {tab === 'gear' && (
          <>
            <h2 className="sp-section-head">Gear</h2>
            {loading && <p className="sp-empty">Loading gear…</p>}
            {!loading && items.length === 0 && (
              <p className="sp-empty">The armory is empty — check back soon.</p>
            )}
            {!loading && items.length > 0 && (
              <div className="sp-grid">
                {items.map(item => {
                  const owned = ownedIds.has(item.id);
                  return (
                    <div className={`sp-card${owned ? ' sp-card--owned' : ''}`} key={item.id}>
                      <div className="sp-card-art">
                        <span className="sp-card-art-label">gear art placeholder</span>
                      </div>
                      <div className="sp-card-body">
                        <div className="sp-card-name">{item.name}</div>
                        {item.description && <div className="sp-card-desc">{item.description}</div>}
                        {owned ? (
                          <span className="sp-owned">✓ Owned</span>
                        ) : (
                          <button
                            type="button"
                            className="sp-buy"
                            disabled={buyingId === item.id}
                            onClick={() => buyItem(item)}
                          >
                            <span className="sp-gem" aria-hidden="true" />
                            {buyingId === item.id ? 'Buying…' : item.price_gems}
                          </button>
                        )}
                        {notice?.itemId === item.id && (
                          <span className={`sp-notice sp-notice--${notice.kind}`} role="status">
                            {notice.text}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
