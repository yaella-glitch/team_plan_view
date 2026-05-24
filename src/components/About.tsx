import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { AboutImage } from '../types';

const SLOTS = [
  { label: 'Win', placeholder: 'Drop a screenshot of a team win' },
  { label: 'Goals', placeholder: 'Drop a screenshot of team goals' },
  { label: 'Focuses', placeholder: 'Drop a screenshot of team focuses' },
];

export function About() {
  const about = useStore((s) => s.about ?? [null, null, null]);
  const [active, setActive] = useState(0);

  // Clamp active index if slot count changes
  useEffect(() => {
    if (active >= SLOTS.length) setActive(0);
  }, [active]);

  const prev = () => setActive((i) => (i === 0 ? SLOTS.length - 1 : i - 1));
  const next = () => setActive((i) => (i === SLOTS.length - 1 ? 0 : i + 1));

  const slot = SLOTS[active];
  const image = about[active] ?? null;

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">About the AI work platform PMMs</h2>
      </div>

      <div className="relative">
        {/* Slide */}
        <Slide
          index={active}
          label={slot.label}
          placeholder={slot.placeholder}
          image={image}
        />

        {/* Side arrows */}
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md ring-1 ring-border hover:bg-white"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink shadow-md ring-1 ring-border hover:bg-white"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SLOTS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}: ${s.label}`}
            className={[
              'h-2 rounded-full transition-all',
              i === active ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-300 hover:bg-slate-400',
            ].join(' ')}
          />
        ))}
      </div>
    </section>
  );
}

function Slide({
  index,
  label,
  placeholder,
  image,
}: {
  index: number;
  label: string;
  placeholder: string;
  image: AboutImage | null;
}) {
  const setAboutImage = useStore((s) => s.setAboutImage);
  const setAboutCaption = useStore((s) => s.setAboutCaption);
  const fileRef = useRef<HTMLInputElement>(null);
  const [captionDraft, setCaptionDraft] = useState(image?.caption ?? '');
  const [editingCaption, setEditingCaption] = useState(false);

  useEffect(() => setCaptionDraft(image?.caption ?? ''), [image?.caption, index]);

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
    reader.onload = () => {
      setAboutImage(index, { dataUrl: String(reader.result || ''), caption: image?.caption });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="mx-auto overflow-hidden rounded-3xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative block aspect-[16/9] w-full overflow-hidden bg-slate-50"
      >
        {image?.dataUrl ? (
          <img src={image.dataUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 text-center text-muted">
            <span className="text-5xl">🖼</span>
            <span className="text-lg font-semibold text-ink">{label}</span>
            <span className="text-sm italic">{placeholder}</span>
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent px-4 py-2 text-sm font-medium text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          Click to {image?.dataUrl ? 'replace' : 'upload'} image
        </span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

      <div className="flex items-center gap-2 border-t border-border bg-white px-4 py-2.5">
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          {label}
        </span>
        {editingCaption ? (
          <input
            autoFocus
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            onBlur={() => {
              setAboutCaption(index, captionDraft);
              setEditingCaption(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setCaptionDraft(image?.caption ?? '');
                setEditingCaption(false);
              }
            }}
            placeholder={`${label} caption…`}
            className="flex-1 bg-transparent text-sm outline-none border-b border-indigo-200"
          />
        ) : (
          <span
            className="flex-1 cursor-text truncate text-sm text-ink"
            onDoubleClick={() => setEditingCaption(true)}
            title="Double-click to edit caption"
          >
            {image?.caption || <span className="italic text-muted">Add a caption</span>}
          </span>
        )}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12.79 4.21a1 1 0 010 1.42L8.42 10l4.37 4.37a1 1 0 11-1.42 1.42l-5.08-5.08a1 1 0 010-1.42L11.37 4.21a1 1 0 011.42 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M7.21 4.21a1 1 0 011.42 0l5.08 5.08a1 1 0 010 1.42l-5.08 5.08a1 1 0 11-1.42-1.42L11.58 10 7.21 5.63a1 1 0 010-1.42z"
        clipRule="evenodd"
      />
    </svg>
  );
}
