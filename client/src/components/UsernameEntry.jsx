import { useState } from 'react';

export default function UsernameEntry({ onJoin, error }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  }

  return (
    <div className="screen entry-screen">
      <div className="entry-card">
        <div className="logo">
          <span className="logo-icon">⚕️</span>
          <h1>USMLE Battle Royale</h1>
          <p className="subtitle">Last doctor standing wins</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
            autoComplete="off"
          />
          <p className="error-msg">{error || ''}</p>
          <button className="btn-primary" type="submit" disabled={!name.trim()}>
            Enter Battle
          </button>
        </form>
      </div>
    </div>
  );
}
