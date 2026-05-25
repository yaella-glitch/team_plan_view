import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { LatestItem } from '../types';
import { compressImage } from '../lib/image';

export function LatestGallery() {
  const items = useStore((s) => s.latest ?? []);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <h2 className="mb-5 text-2xl font-bold text-ink">Our latest highlights</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm italic text-muted">
          Nothing here yet. Add an item from the Admin panel (Quick add).
        </div>
      ) : (
        <Marquee items={items} />
      )}
    </section>
  );
}

const CARD_WIDTH = 176; // tailwind w-44 = 11rem = 176px
const GAP = 12;          // gap-3

/**
 * A single-row horizontal strip that auto-scrolls left.
 *
 * Key insight: we render the items enough times so the track is always at
 * least ~2x viewport wide. Then we animate the track by exactly *one cycle*
 * (one copy of the items + one gap) in pixels — so the loop visually repeats
 * to a position identical to where it started, regardless of viewport width
 * or how many items the user has added.
 *
 * Hovering pauses the animation.
 */
function Marquee({ items }: { items: LatestItem[] }) {
  const N = items.length;
  const cycleWidth = N * CARD_WIDTH + N * GAP; // one copy + one trailing gap
  // Make sure the rendered track is at least 2x the widest expected viewport
  // so we never see empty space on the right at any phase of the animation.
  const minCopies = Math.max(2, Math.ceil((2 * 2400) / cycleWidth));
  const copies = Math.min(minCopies, 12);
  const looped = Array.from({ length: copies }, () => items).flat();
  // Pick a duration proportional to cycle width so visual speed is constant.
  const pxPerSecond = 60;
  const durationSec = Math.max(20, Math.round(cycleWidth / pxPerSecond));

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] py-3">
      <div
        className="flex w-max animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover:[animation-play-state:paused]"
        style={
          {
            gap: `${GAP}px`,
            '--marquee-duration': `${durationSec}s`,
            '--marquee-cycle': `${cycleWidth}px`,
          } as React.CSSProperties
        }
      >
        {looped.map((item, i) => (
          <LatestCard key={`${item.id}-${i}`} item={item} />
        ))}
      </div>

      {/* Side fade gradients */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-12"
        style={{ background: 'linear-gradient(to right, rgb(var(--canvas)), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-12"
        style={{ background: 'linear-gradient(to left, rgb(var(--canvas)), transparent)' }}
      />

      <style>{`
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(calc(-1 * var(--marquee-cycle)), 0, 0); }
        }
      `}</style>
    </div>
  );
}

function LatestCard({ item }: { item: LatestItem }) {
  const updateLatestItem = useStore((s) => s.updateLatestItem);
  const removeLatestItem = useStore((s) => s.removeLatestItem);
  const fileRef = useRef<HTMLInputElement>(null);
  const [titleDraft, setTitleDraft] = useState(item.title ?? '');
  const [linkDraft, setLinkDraft] = useState(item.link ?? '');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingLink, setEditingLink] = useState(false);

  useEffect(() => setTitleDraft(item.title ?? ''), [item.title]);
  useEffect(() => setLinkDraft(item.link ?? ''), [item.link]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxWidth: 1000, quality: 0.8 });
      updateLatestItem(item.id, { dataUrl });
    } catch (err) {
      alert(`Failed to load image: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <article className="group/card card-gradient-subtle relative w-44 shrink-0">
      <div className="card-gradient-inner">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="block aspect-[16/10] w-full overflow-hidden"
      >
        {item.dataUrl ? (
          <img src={item.dataUrl} alt={item.title || 'Item'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-2xl text-white/30">🖼</div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="px-2 py-1.5">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              updateLatestItem(item.id, { title: titleDraft.trim() || undefined });
              setEditingTitle(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            }}
            placeholder="Title…"
            className="w-full bg-transparent text-xs font-semibold text-ink outline-none border-b border-accent/40"
          />
        ) : (
          <h3
            className="cursor-text truncate text-xs font-semibold text-ink"
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to edit"
          >
            {item.title || <span className="italic text-muted">Title</span>}
          </h3>
        )}

        {editingLink ? (
          <input
            autoFocus
            value={linkDraft}
            onChange={(e) => setLinkDraft(e.target.value)}
            onBlur={() => {
              updateLatestItem(item.id, { link: linkDraft.trim() || undefined });
              setEditingLink(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            }}
            placeholder="https://…"
            className="mt-0.5 w-full bg-transparent text-[10px] text-ink outline-none border-b border-accent/40"
          />
        ) : item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate text-[10px] text-accent hover:underline"
            onDoubleClick={(e) => {
              e.preventDefault();
              setEditingLink(true);
            }}
          >
            {item.link.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setEditingLink(true)}
            className="mt-0.5 truncate text-[10px] italic text-muted hover:text-ink"
          >
            + link
          </button>
        )}
      </div>

      </div>
      <button
        type="button"
        onClick={() => {
          if (confirm('Remove this item?')) removeLatestItem(item.id);
        }}
        title="Remove"
        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0 text-xs text-muted opacity-0 shadow-sm hover:bg-rose-500/20 hover:text-rose-300 group-hover/card:opacity-100"
      >
        ×
      </button>
    </article>
  );
}
