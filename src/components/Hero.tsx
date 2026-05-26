import { useRef, useState } from 'react';
import { compressImage } from '../lib/image';

const HERO_IMAGE_KEY = 'team-plan-view-hero-image-v1';

function loadHeroImage(): string | null {
  try {
    return localStorage.getItem(HERO_IMAGE_KEY);
  } catch {
    return null;
  }
}

function saveHeroImage(dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(HERO_IMAGE_KEY, dataUrl);
    else localStorage.removeItem(HERO_IMAGE_KEY);
  } catch {
    // ignore
  }
}

export function Hero() {
  const [heroImage, setHeroImage] = useState<string | null>(loadHeroImage);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await compressImage(file, { maxWidth: 1200, quality: 0.85 });
      setHeroImage(url);
      saveHeroImage(url);
    } catch (err) {
      alert(`Failed to load image: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section className="relative overflow-hidden">
      {/* Soft purple glow on the left */}
      <div
        className="pointer-events-none absolute -left-40 top-10 -z-10 h-[500px] w-[500px] rounded-full opacity-40"
        style={{
          background:
            'radial-gradient(circle, rgba(165,138,255,0.45), rgba(99,102,241,0.1) 50%, transparent 75%)',
        }}
      />

      <div className="mx-auto flex max-w-7xl items-center gap-8 px-8 pt-16 pb-20 lg:gap-12">
        {/* Left: logo + headlines */}
        <div className="flex-1">
          <MondayLogo />

          <h1 className="mt-10 text-5xl font-light leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            AI work platform
            <br />
            PMMs
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            From Marketing, GTM, Product — supporting customers along the way in positioning monday as
            best AI work platform.
          </p>
        </div>

        {/* Right: optional hero illustration */}
        <div className="hidden flex-1 lg:block">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative aspect-square w-full overflow-hidden rounded-3xl"
            title="Click to set a hero illustration"
          >
            {heroImage ? (
              <img src={heroImage} alt="Team hero illustration" className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed text-center text-muted opacity-60 transition-opacity hover:opacity-100"
                style={{ borderColor: 'rgba(165,138,255,0.3)' }}
              >
                <div>
                  <div className="text-5xl">🎨</div>
                  <p className="mt-2 text-sm">
                    Click to upload
                    <br />
                    hero illustration
                  </p>
                </div>
              </div>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
        </div>
      </div>
    </section>
  );
}

/** monday.com wordmark — stylized inline. Replace with the official SVG if you have it. */
function MondayLogo() {
  return (
    <div className="inline-flex items-end gap-1 select-none">
      <svg viewBox="0 0 32 16" width="38" height="20" aria-hidden className="-mb-0.5">
        <circle cx="5" cy="8" r="3.4" fill="#ff3d57" />
        <circle cx="16" cy="8" r="3.4" fill="#ffcb00" />
        <circle cx="27" cy="8" r="3.4" fill="#00d647" />
      </svg>
      <span className="text-xl font-semibold tracking-tight text-ink">monday</span>
      <span className="mb-1 text-xs font-medium text-muted">.com</span>
    </div>
  );
}
