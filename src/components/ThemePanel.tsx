import { useEffect, useState } from 'react';
import { useTheme, applyPaletteToCss, DEFAULT_PALETTE, MONDAY_PALETTE, type Palette } from '../theme';

const LABELS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: 'accent', label: 'Accent', hint: 'Buttons, highlights, tab active' },
  { key: 'canvas', label: 'Canvas', hint: 'Page background' },
  { key: 'surface', label: 'Surface', hint: 'Card background' },
  { key: 'ink', label: 'Ink', hint: 'Primary text' },
  { key: 'muted', label: 'Muted', hint: 'Secondary text' },
  { key: 'border', label: 'Border', hint: 'Dividers, outlines' },
];

export function ThemePanel() {
  const palette = useTheme((s) => s.palette);
  const setColor = useTheme((s) => s.setColor);
  const applyPreset = useTheme((s) => s.applyPreset);
  const reset = useTheme((s) => s.reset);
  const [open, setOpen] = useState(false);

  // Re-apply palette to CSS whenever it changes (incl. on first mount from localStorage)
  useEffect(() => {
    applyPaletteToCss(palette);
  }, [palette]);

  return (
    <div className="fixed right-4 top-14 z-30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur hover:bg-white/10"
        title="Open theme panel"
      >
        <span className="flex h-3 w-3 rounded-full" style={{ background: palette.accent }} />
        Theme
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/10 p-4 shadow-xl"
          style={{ background: 'rgb(var(--surface))' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Palette</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-ink"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="mb-3 flex gap-1.5">
            <PresetButton label="Default" onClick={() => applyPreset(DEFAULT_PALETTE)} />
            <PresetButton label="monday" onClick={() => applyPreset(MONDAY_PALETTE)} />
            <PresetButton label="Reset" onClick={reset} />
          </div>

          <div className="space-y-2">
            {LABELS.map(({ key, label, hint }) => (
              <ColorRow
                key={key}
                label={label}
                hint={hint}
                value={palette[key]}
                onChange={(hex) => setColor(key, hex)}
              />
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-tight text-muted">
            Changes apply live and are saved to your browser. Refresh-safe.
          </p>
        </div>
      )}
    </div>
  );
}

function PresetButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-xs text-ink hover:border-accent/60"
    >
      {label}
    </button>
  );
}

function ColorRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const v = draft.trim();
    if (/^#?[0-9a-f]{6}$/i.test(v) || /^#?[0-9a-f]{3}$/i.test(v)) {
      onChange(v.startsWith('#') ? v : `#${v}`);
    } else {
      setDraft(value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded border border-white/15"
        aria-label={`${label} color picker`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ink">{label}</span>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            }}
            className="ml-auto w-20 rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-mono text-ink focus:border-accent/60 focus:outline-none"
          />
        </div>
        <p className="text-[11px] text-muted">{hint}</p>
      </div>
    </div>
  );
}
