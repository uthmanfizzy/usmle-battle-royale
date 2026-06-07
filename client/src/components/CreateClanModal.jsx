import { useState } from 'react';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function CreateClanModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', tag: '', description: '', type: 'Open',
    location: 'Global', required_trophies: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.name.trim()) return setError('Clan name is required');
    if (!form.tag.trim()) return setError('Clan tag is required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/clans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.id })
      });
      const data = await res.json();
      if (data.success) {
        onCreated(data.clan);
        onClose();
      } else {
        setError(data.error || 'Failed to create clan');
      }
    } catch(e) { setError('Network error'); }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="create-clan-modal">
        <div className="create-clan-header">
          <h2>⚔️ Create Clan</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="create-clan-body">
          {error && <div className="create-clan-error">{error}</div>}
          <div className="create-clan-field">
            <label>Clan Name *</label>
            <input
              className="create-clan-input"
              placeholder="e.g. Royal Guardians"
              value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              maxLength={30}
            />
          </div>
          <div className="create-clan-field">
            <label>Clan Tag * <span>(max 5 chars)</span></label>
            <input
              className="create-clan-input"
              placeholder="e.g. RGD"
              value={form.tag}
              onChange={e => setForm(f => ({...f, tag: e.target.value.toUpperCase()}))}
              maxLength={5}
            />
          </div>
          <div className="create-clan-field">
            <label>Description</label>
            <textarea
              className="create-clan-input create-clan-textarea"
              placeholder="We fight as one. We rise as legends."
              value={form.description}
              onChange={e => setForm(f => ({...f, description: e.target.value}))}
              rows={3}
            />
          </div>
          <div className="create-clan-row">
            <div className="create-clan-field">
              <label>Clan Type</label>
              <select
                className="create-clan-input"
                value={form.type}
                onChange={e => setForm(f => ({...f, type: e.target.value}))}
              >
                <option value="Open">Open</option>
                <option value="Invite Only">Invite Only</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="create-clan-field">
              <label>Location</label>
              <select
                className="create-clan-input"
                value={form.location}
                onChange={e => setForm(f => ({...f, location: e.target.value}))}
              >
                <option value="Global">Global</option>
                <option value="UK">UK</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="Asia">Asia</option>
                <option value="Middle East">Middle East</option>
                <option value="Africa">Africa</option>
              </select>
            </div>
          </div>
          <div className="create-clan-field">
            <label>Required Trophies</label>
            <input
              className="create-clan-input"
              type="number"
              min={0}
              value={form.required_trophies}
              onChange={e => setForm(f => ({...f, required_trophies: parseInt(e.target.value) || 0}))}
            />
          </div>
        </div>
        <div className="create-clan-footer">
          <button className="create-clan-cancel" onClick={onClose}>Cancel</button>
          <button className="create-clan-submit" onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : '⚔️ Create Clan'}
          </button>
        </div>
      </div>
    </div>
  );
}
