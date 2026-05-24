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
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: 'rgb(var(--canvas))' }}>
      <form
        onSubmit={onSubmit}
        className="card-gradient w-full max-w-md"
      >
        <div className="card-gradient-inner p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Restricted access
        </div>
        <h1 className="text-3xl font-light tracking-tight text-ink">AI work platform PMMs</h1>
        <p className="mt-2 text-sm text-muted">Enter the team password to view the plan.</p>

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-muted">
          Password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-base text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          placeholder="••••••••"
        />

        {error && (
          <p className="mt-2 text-sm text-rose-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-canvas shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>

        <p className="mt-6 text-center text-[11px] text-muted">
          Lost the password? Ask Yaella.
        </p>
        </div>
      </form>
    </div>
  );
}
