import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PasswordGate } from './components/PasswordGate';
import './styles.css';

const STORE_KEY = 'team-plan-view-v1';
const STORE_VERSION = 4;

/**
 * If this browser has never run the app (no persisted state), try to fetch
 * a public snapshot bundled with the deployed site at /snapshot.json. This
 * lets mobile / first-time viewers see Yaella's authored content instead of
 * the empty seed.
 *
 * Existing browsers (desktop with localStorage already populated) skip this
 * — their data is untouched.
 */
async function loadSnapshotIfFirstRun() {
  try {
    if (localStorage.getItem(STORE_KEY)) return; // already have state
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const res = await fetch(`${base}/snapshot.json`, { cache: 'no-store' });
    if (!res.ok) return; // no snapshot published yet
    const snapshot = await res.json();
    // Snapshot file is the bare state object as exported by Admin → Data → Export.
    // Wrap it in Zustand persist's expected envelope.
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ state: snapshot, version: STORE_VERSION }),
    );
  } catch {
    // Network error / not found / parse error — fall back to default seed.
  }
}

void (async () => {
  await loadSnapshotIfFirstRun();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PasswordGate>
        <App />
      </PasswordGate>
    </React.StrictMode>,
  );
})();
