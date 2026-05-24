import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Palette = {
  canvas: string;   // page background
  surface: string;  // card background
  ink: string;      // primary text
  muted: string;    // secondary text
  accent: string;   // brand / primary action
  border: string;   // dividers
};

export const DEFAULT_PALETTE: Palette = {
  canvas: '#f8fafc',
  surface: '#ffffff',
  ink: '#0f172a',
  muted: '#64748b',
  accent: '#6366f1',
  border: '#e2e8f0',
};

export const MONDAY_PALETTE: Palette = {
  canvas: '#f6f7fb',
  surface: '#ffffff',
  ink: '#323338',
  muted: '#676879',
  accent: '#0073ea',
  border: '#d0d4e4',
};

type ThemeStore = {
  palette: Palette;
  setColor: (key: keyof Palette, hex: string) => void;
  applyPreset: (p: Palette) => void;
  reset: () => void;
};

export const useTheme = create<ThemeStore>()(
  persist(
    (set) => ({
      palette: DEFAULT_PALETTE,
      setColor: (key, hex) => set((s) => ({ palette: { ...s.palette, [key]: hex } })),
      applyPreset: (p) => set({ palette: p }),
      reset: () => set({ palette: DEFAULT_PALETTE }),
    }),
    { name: 'team-plan-view-theme-v1' },
  ),
);

function hexToRgbTriplet(hex: string): string | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function applyPaletteToCss(palette: Palette) {
  const root = document.documentElement;
  (Object.entries(palette) as [keyof Palette, string][]).forEach(([key, hex]) => {
    const triplet = hexToRgbTriplet(hex);
    if (triplet) root.style.setProperty(`--${key}`, triplet);
  });
}
