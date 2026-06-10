import { useState } from 'react';

const SERVER_URL = 'https://usmle-battle-royale-production.up.railway.app';

export default function ClanSettingsModal({ clan, user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: clan?.name || '',
    tag: clan?.tag || '',
    description: clan?.description || '',
    type: clan?.type || 'Open',
    location: clan?.location || 'Global',
    required_trophies: clan?.required_trophies || 0,
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [crestFile, setCrestFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(clan?.banner_url || '');
  const [crestPreview, setCrestPreview] = useState(clan?.crest_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageSelect = (file, type) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'banner') {
      setBannerFile(file);
      setBannerPreview(preview);
    } else {
      setCrestFile(file);
      setCrestPreview(preview);
    }
  };

  const uploadImage = async (file, fileName) => {
    const { supabase } = await import('../supabaseClient');
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Clan name is required');
    setSaving(true);
    setError('');
    setUploading(false);

    try {
      let bannerUrl = clan?.banner_url;
      let crestUrl = clan?.crest_url;

      // Upload banner if changed
      if (bannerFile) {
        setUploading(true);
        bannerUrl = await uploadImage(bannerFile, `clan-banner-${clan.id}-${Date.now()}.${bannerFile.name.split('.').pop()}`);
      }

      // Upload crest if changed
      if (crestFile) {
        setUploading(true);
        crestUrl = await uploadImage(crestFile, `clan-crest-${clan.id}-${Date.now()}.${crestFile.name.split('.').pop()}`);
      }

      setUploading(false);

      // Save settings to server
      const res = await fetch(`${SERVER_URL}/api/clans/${clan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          banner_url: bannerUrl,
          crest_url: crestUrl,
          leaderId: user.id
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save');

      setSuccess('Settings saved!');
      onUpdated({ ...clan, ...form, banner_url: bannerUrl, crest_url: crestUrl });
      setTimeout(() => { setSuccess(''); onClose(); }, 1500);
    } catch(e) {
      setError(e.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="clan-settings-modal">
        <div className="clan-settings-header">
          <h2>⚙️ Clan Settings</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="clan-settings-body">
          {error && <div className="clan-settings-error">{error}</div>}
          {success && <div className="clan-settings-success">{success}</div>}

          {/* Banner Upload */}
          <div className="clan-settings-section">
            <p className="clan-settings-label">CLAN BANNER</p>
            <div className="clan-image-upload-row">
              <div className="clan-banner-preview">
                {bannerPreview
                  ? <img src={bannerPreview} alt="Banner" />
                  : <span>🛡</span>
                }
              </div>
              <label className="clan-image-upload-btn">
                📁 {bannerFile ? 'Change Banner' : 'Upload Banner'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageSelect(e.target.files[0], 'banner')}
                />
              </label>
              {bannerPreview && (
                <button className="clan-image-remove-btn" onClick={() => { setBannerFile(null); setBannerPreview(''); }}>
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Crest Upload */}
          <div className="clan-settings-section">
            <p className="clan-settings-label">CLAN CREST</p>
            <div className="clan-image-upload-row">
              <div className="clan-crest-preview">
                {crestPreview
                  ? <img src={crestPreview} alt="Crest" />
                  : <span>⚔️</span>
                }
              </div>
              <label className="clan-image-upload-btn">
                📁 {crestFile ? 'Change Crest' : 'Upload Crest'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageSelect(e.target.files[0], 'crest')}
                />
              </label>
              {crestPreview && (
                <button className="clan-image-remove-btn" onClick={() => { setCrestFile(null); setCrestPreview(''); }}>
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Clan Details */}
          <div className="clan-settings-section">
            <p className="clan-settings-label">CLAN DETAILS</p>
            <div className="clan-settings-fields">
              <div className="clan-settings-field">
                <label>Clan Name *</label>
                <input
                  className="clan-settings-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={30}
                />
              </div>
              <div className="clan-settings-field">
                <label>Clan Tag * <span>(max 5 chars)</span></label>
                <input
                  className="clan-settings-input"
                  value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value.toUpperCase() }))}
                  maxLength={5}
                />
              </div>
              <div className="clan-settings-field">
                <label>Description</label>
                <textarea
                  className="clan-settings-input clan-settings-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe your clan..."
                />
              </div>
              <div className="clan-settings-row">
                <div className="clan-settings-field">
                  <label>Clan Type</label>
                  <select
                    className="clan-settings-input"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="Open">Open</option>
                    <option value="Invite Only">Invite Only</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="clan-settings-field">
                  <label>Location</label>
                  <select
                    className="clan-settings-input"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
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
              <div className="clan-settings-field">
                <label>Required Trophies</label>
                <input
                  className="clan-settings-input"
                  type="number"
                  min={0}
                  value={form.required_trophies}
                  onChange={e => setForm(f => ({ ...f, required_trophies: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="clan-settings-footer">
          <button className="clan-settings-cancel" onClick={onClose}>Cancel</button>
          <button
            className="clan-settings-save"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {uploading ? '📤 Uploading...' : saving ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
