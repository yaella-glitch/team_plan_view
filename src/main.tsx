import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PasswordGate } from './components/PasswordGate';
import './styles.css';

const STORE_KEY = 'team-plan-view-v1';
const STORE_VERSION = 4;
const SNAPSHOT_APPLIED_KEY = 'team-plan-view-snapshot-id';

/**
 * Snapshot fallback for fresh viewers + auto-update for existing viewers.
 *
 * On startup we fetch /snapshot.json. The file (created via Admin → Data →
 * '📸 Publish snapshot') carries a `snapshotId` timestamp. We apply the
 * snapshot to localStorage when:
 *
 *   (a) localStorage has no state at all — first-time viewer; or
 *   (b) the snapshot's id differs from the id we last applied — author
 *       republished, so existing viewers also pick up the refresh.
 *
 * Yaella's own desktop: as long as she republishes after edits, her state
 * stays current. If she edits without republishing, her local edits are
 * preserved (snapshot id matches what's stored, so we don't reapply).
 */
async function maybeApplySnapshot() {
  try {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const res = await fetch(`${base}/snapshot.json`, { cache: 'no-store' });
    if (!res.ok) return;
    const snapshot = await res.json();
    if (!snapshot || typeof snapshot !== 'object') return;

    const stored = localStorage.getItem(STORE_KEY);
    const lastAppliedId = localStorage.getItem(SNAPSHOT_APPLIED_KEY);
    const snapshotId: string | undefined = snapshot.snapshotId;

    const shouldApply = !stored || (snapshotId && snapshotId !== lastAppliedId);
    if (!shouldApply) return;

    // Strip snapshotId from the state body before storing.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { snapshotId: _omit, ...stateOnly } = snapshot;

    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ state: stateOnly, version: STORE_VERSION }),
    );
    if (snapshotId) {
      localStorage.setItem(SNAPSHOT_APPLIED_KEY, snapshotId);
    }
  } catch {
    // Network / parse / no file — fall back to seed/local state.
  }
}

void (async () => {
  await maybeApplySnapshot();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PasswordGate>
        <App />
      </PasswordGate>
    </React.StrictMode>,
  );
})();
