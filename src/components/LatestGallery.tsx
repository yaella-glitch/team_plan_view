import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { LatestItem } from '../types';

export function LatestGallery() {
  const items = useStore((s) => s.latest ?? []);
  const addLatestItem = useStore((s) => s.addLatestItem);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-ink">Our latest highlights</h2>
        <button
          type="button"
          onClick={() => addLatestItem()}
          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-muted hover:border-accent/60 hover:text-ink"
          title="Add item"
        >
          +
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm italic text-muted">
          Nothing here yet. Hit the + to add your first.
        </div>
      ) : (
        <Marquee items={items} />
      )}
    </section>
  );
}

/**
 * A single-row horizontal strip that auto-scrolls left.
 * - The list is duplicated so the loop seamlessly repeats.
 * - Hovering the strip pauses the animation so users can read / click.
 */
function Marquee({ items }: { items: LatestItem[] }) {
  // Duplicate the items so the keyframes can translate -50% without showing a gap.
  const looped = [...items, ...items];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] py-3">
      <div className="flex w-max gap-3 animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused]">
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
        /* The track contains N items repeated twice with a uniform 12px gap throughout.
           A perfect seamless loop translates by exactly one repeat-cycle =
           one copy width + one gap. That equals 50% of the total + 6px (half a gap). */
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(calc(-50% - 6px), 0, 0); }
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
    if (file.size > 3_000_000) {
      const ok = confirm('Image is larger than 3MB. Continue?');
      if (!ok) {
        e.target.value = '';
        return;
      }
    }
    const reader = new FileReader();
    reader.onload = () => updateLatestItem(item.id, { dataUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
    e.target.value = '';
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
