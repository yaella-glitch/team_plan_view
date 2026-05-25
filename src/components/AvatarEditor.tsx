import { useEffect, useRef, useState } from 'react';
import { resolvePhotoUrl } from '../lib/photo';
import { compressImage } from '../lib/image';
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
  /** When the avatar is near the right edge of the viewport, anchor the popover
   *  to the right instead of the left so it doesn't overflow off-screen. */
  const [anchorRight, setAnchorRight] = useState(false);

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

  // When opening, decide anchor side based on where there's room.
  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const POPOVER_WIDTH = 320; // matches w-80
    const spaceOnRight = window.innerWidth - rect.left;
    setAnchorRight(spaceOnRight < POPOVER_WIDTH + 16);
  }, [open]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    updatePerson(person.id, { photoUrl: draft.trim() });
    setOpen(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxWidth: 400, quality: 0.85 });
      updatePerson(person.id, { photoUrl: dataUrl });
      setDraft(dataUrl);
      setOpen(false);
    } catch (err) {
      alert(`Failed to load image: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
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
        <div
          className={[
            'absolute top-full z-40 mt-2 w-80 rounded-xl border border-white/15 p-3 shadow-xl',
            anchorRight ? 'right-0' : 'left-0',
          ].join(' ')}
          style={{ background: 'rgb(var(--surface))' }}
        >
          <label className="block text-xs font-semibold text-ink">Photo for {person.name}</label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full rounded-lg border-2 border-dashed border-accent/40 bg-accent/10 px-3 py-3 text-sm font-medium text-accent hover:border-accent hover:bg-accent/20"
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
            Use a file in <code className="rounded bg-white/10 px-1">public/photos/</code>.
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
            className="mt-1 w-full rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-mono text-ink outline-none focus:border-accent/60"
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
                className="rounded px-2 py-1 text-xs text-muted hover:bg-white/10 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                className="rounded bg-accent px-2.5 py-1 text-xs font-semibold text-canvas hover:opacity-90"
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
