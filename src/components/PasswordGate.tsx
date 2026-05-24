import { useEffect, useState } from 'react';
import { PASSWORD_HASH, ACCESS_VERSION } from '../access';

const STORAGE_KEY = 'team-plan-view-unlock';

type UnlockState = { unlocked: true; version: number };

function isUnlocked(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as UnlockState;
    return v.unlocked === true && v.version === ACCESS_VERSION;
  } catch {
    return false;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unlocked) {
      const data: UnlockState = { unlocked: true, version: ACCESS_VERSION };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }, [unlocked]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const hash = await sha256Hex(password);
      if (hash === PASSWORD_HASH) {
        setUnlocked(true);
      } else {
        setError('Wrong password. Try again.');
        setPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-rose-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-xl"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Restricted access
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">AI work platform PMMs</h1>
        <p className="mt-2 text-sm text-muted">Enter the team password to view the plan.</p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted">
          Password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-2 text-sm text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>

        <p className="mt-6 text-center text-[11px] text-muted">
          Lost the password? Ask Yaella.
        </p>
      </form>
    </div>
  );
}
