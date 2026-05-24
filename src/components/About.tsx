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

  return (
    <section className="mx-auto max-w-7xl px-8 py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">About the AI work platform PMMs</h2>
        <p className="mt-1 text-sm text-muted">
          Drop slide screenshots — wins, goals, focuses. Click an image to swap it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {SLOTS.map((slot, i) => (
          <AboutSlot key={i} index={i} label={slot.label} placeholder={slot.placeholder} image={about[i] ?? null} />
        ))}
      </div>
    </section>
  );
}

function AboutSlot({
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

  useEffect(() => setCaptionDraft(image?.caption ?? ''), [image?.caption]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3_000_000) {
      const ok = confirm('Image is larger than 3MB. It will work but may slow things down. Continue?');
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

  const onClear = () => setAboutImage(index, null);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-slate-50"
      >
        {image?.dataUrl ? (
          <img src={image.dataUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 text-center text-muted">
            <span className="text-3xl">🖼</span>
            <span className="text-sm font-medium">{label}</span>
            <span className="px-6 text-xs italic">{placeholder}</span>
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs font-medium text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          Click to {image?.dataUrl ? 'replace' : 'upload'} image
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />

      <div className="flex items-center gap-2 px-3 py-2">
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
            {image?.caption || <span className="italic text-muted">{label}</span>}
          </span>
        )}
        {image?.dataUrl && (
          <button
            type="button"
            onClick={onClear}
            title="Remove image"
            className="rounded-full px-2 py-0.5 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
