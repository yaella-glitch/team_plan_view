import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { LatestItem } from '../types';

export function LatestGallery() {
  const items = useStore((s) => s.latest ?? []);
  const addLatestItem = useStore((s) => s.addLatestItem);

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Latest things we did</h2>
          <p className="mt-1 text-sm text-muted">A running gallery of recent launches, ships, wins.</p>
        </div>
        <button
          type="button"
          onClick={() => addLatestItem()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm italic text-muted">
          Nothing here yet. Click "+ Add item" to add your first.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <LatestCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
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
    <article className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative block aspect-[16/10] w-full overflow-hidden bg-slate-50"
      >
        {item.dataUrl ? (
          <img src={item.dataUrl} alt={item.title || 'Item'} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-muted">
            <span className="text-3xl">🖼</span>
            <span className="text-xs italic">Click to upload image</span>
          </div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="p-3">
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
            className="w-full bg-transparent text-sm font-semibold text-ink outline-none border-b border-indigo-200"
          />
        ) : (
          <h3
            className="cursor-text truncate text-sm font-semibold text-ink"
            onDoubleClick={() => setEditingTitle(true)}
            title="Double-click to edit title"
          >
            {item.title || <span className="italic text-muted">Add a title</span>}
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
            className="mt-1 w-full bg-transparent text-xs text-muted outline-none border-b border-indigo-200"
          />
        ) : item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-xs text-indigo-600 hover:underline"
            onDoubleClick={(e) => {
              e.preventDefault();
              setEditingLink(true);
            }}
            title="Open link · double-click to edit"
          >
            {item.link}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setEditingLink(true)}
            className="mt-1 truncate text-xs italic text-muted hover:text-ink"
          >
            + add a link
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm('Remove this item?')) removeLatestItem(item.id);
        }}
        title="Remove"
        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-muted opacity-0 shadow-sm transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
      >
        ×
      </button>
    </article>
  );
}
