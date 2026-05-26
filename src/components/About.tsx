import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { AboutImage } from '../types';
import { compressImage } from '../lib/image';

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
          className="absolute -left-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-2 text-ink shadow-lg ring-1 ring-white/10 backdrop-blur hover:bg-surface"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface/90 p-2 text-ink shadow-lg ring-1 ring-white/10 backdrop-blur hover:bg-surface"
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
              i === active ? 'w-8 bg-accent' : 'w-2 bg-white/20 hover:bg-white/40',
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
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, { maxWidth: 1600, quality: 0.85 });
      setAboutImage(index, { dataUrl, caption: image?.caption });
    } catch (err) {
      alert(`Failed to load image: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="card-gradient mx-auto">
      <div className="card-gradient-inner">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group relative block aspect-[16/9] w-full overflow-hidden"
      >
        {image?.dataUrl ? (
          <img src={image.dataUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-muted">
            <span className="text-5xl">🖼</span>
            <span className="text-lg font-semibold text-ink">{label}</span>
            <span className="text-sm italic">{placeholder}</span>
          </div>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
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
