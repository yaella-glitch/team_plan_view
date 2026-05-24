import { useEffect, useRef, useState } from 'react';
import { resolvePhotoUrl } from '../lib/photo';
import { useStore } from '../store';
import type { Person } from '../types';

type Props = {
  person: Person;
  size?: number;
  className?: string;
};

export function AvatarEditor({ person, size = 56, className = '' }: Props) {
  const updatePerson = useStore((s) => s.updatePerson);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(person.photoUrl);
  const ref = useRef<HTMLDivElement>(null);

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => setDraft(person.photoUrl), [person.photoUrl]);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    updatePerson(person.id, { photoUrl: draft.trim() });
    setOpen(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      alert('Image is large (>2MB). For best results pick a smaller one.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      updatePerson(person.id, { photoUrl: dataUrl });
      setDraft(dataUrl);
      setOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const resolved = resolvePhotoUrl(person.photoUrl);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group block rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        title="Click to change photo"
      >
        {resolved && !imgFailed ? (
          <img
            src={resolved}
            alt={person.name}
            style={{ height: size, width: size }}
            className="rounded-full border-2 border-white object-cover shadow-sm ring-2 ring-slate-100 group-hover:ring-indigo-200"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            style={{ height: size, width: size }}
            className={[
              'flex items-center justify-center rounded-full text-sm font-semibold ring-2 ring-slate-100',
              imgFailed ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600',
            ].join(' ')}
            title={imgFailed ? `Photo not found: ${person.photoUrl}` : ''}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-xl border border-border bg-white p-3 shadow-xl">
          <label className="block text-xs font-semibold text-ink">Photo for {person.name}</label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full rounded-lg border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-3 text-sm font-medium text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
          >
            ↑ Pick file from your computer
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
          <p className="mt-1 text-[11px] text-muted">
            Picks any image and embeds it. Travels with JSON export.
          </p>

          <div className="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <label className="block text-[11px] font-medium text-ink">Filename or URL</label>
          <p className="text-[11px] text-muted">
            Use a file in <code className="rounded bg-slate-100 px-1">public/photos/</code>.
          </p>
          <input
            type="text"
            value={draft.startsWith('data:') ? '' : draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              else if (e.key === 'Escape') {
                setDraft(person.photoUrl);
                setOpen(false);
              }
            }}
            placeholder="tamar.png  or  https://…"
            className="mt-1 w-full rounded border border-border px-2 py-1 text-xs font-mono outline-none focus:border-indigo-400"
          />

          <div className="mt-3 flex justify-between">
            <button
              type="button"
              onClick={() => {
                updatePerson(person.id, { photoUrl: '' });
                setDraft('');
                setOpen(false);
              }}
              className="rounded px-2 py-1 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
              title="Clear photo (show initials)"
            >
              Clear
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setDraft(person.photoUrl);
                  setOpen(false);
                }}
                className="rounded px-2 py-1 text-xs text-muted hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
