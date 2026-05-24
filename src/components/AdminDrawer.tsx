import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { resolvePhotoUrl } from '../lib/photo';
import { AddOwnershipModal } from './Backlog';
import { useTheme, DEFAULT_PALETTE, MONDAY_PALETTE, type Palette } from '../theme';
import type { AppState } from '../types';

export function AdminDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur hover:bg-white/10"
        title="Open admin panel"
      >
        ⚙ Admin
      </button>

      {open && <Drawer onClose={() => setOpen(false)} />}
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close admin panel"
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col shadow-2xl"
        style={{ background: 'rgb(var(--surface))' }}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Admin</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-muted hover:bg-white/10 hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <QuickAddSection />
          <PMMsSection />
          <AboutSection />
          <LatestSection />
          <SubTeamsSection />
          <ThemeSection />
          <DataSection />
          <DangerZone />
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------

function QuickAddSection() {
  const addPerson = useStore((s) => s.addPerson);
  const addChip = useStore((s) => s.addChip);
  const [openOwnership, setOpenOwnership] = useState(false);

  return (
    <section className="mb-8">
      <SectionHeader title="Quick add" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            const name = prompt('New PMM name?');
            if (name && name.trim()) addPerson(name.trim());
          }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span>+ Add PMM</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setOpenOwnership(true)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-white/[0.06]"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🧩</span>
            <span>+ Add ownership area</span>
          </div>
        </button>
      </div>
      {openOwnership && (
        <AddOwnershipModal
          onClose={() => setOpenOwnership(false)}
          onAdd={(cat, label) => {
            addChip(cat, null, label);
            setOpenOwnership(false);
          }}
        />
      )}
    </section>
  );
}

function PMMsSection() {
  const people = useStore((s) => s.people);
  const addPerson = useStore((s) => s.addPerson);
  const removePerson = useStore((s) => s.removePerson);

  return (
    <section className="mb-8">
      <SectionHeader
        title="PMMs"
        action={
          <button
            type="button"
            onClick={() => {
              const name = prompt('New PMM name?');
              if (name && name.trim()) addPerson(name.trim());
            }}
            className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-xs text-muted hover:border-accent/60 hover:text-ink"
          >
            + Add
          </button>
        }
      />

      <ul className="space-y-1.5">
        {people.map((p) => {
          const photo = resolvePhotoUrl(p.photoUrl);
          return (
            <li key={p.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5">
              <div className="h-7 w-7 overflow-hidden rounded-full bg-white/5">
                {photo ? (
                  <img src={photo} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted">
                    {initials(p.name)}
                  </div>
                )}
              </div>
              <span className="flex-1 truncate text-sm text-ink">{p.name}</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove ${p.name} from the team? Their assigned chips will move to the backlog.`)) {
                    removePerson(p.id);
                  }
                }}
                className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
                title={`Remove ${p.name}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------

function AboutSection() {
  const about = useStore((s) => s.about ?? [null, null, null]);
  const setAboutImage = useStore((s) => s.setAboutImage);

  const labels = ['Win', 'Goals', 'Focuses'];

  return (
    <section className="mb-8">
      <SectionHeader title="About slides" />
      <ul className="space-y-1.5">
        {labels.map((l, i) => {
          const has = !!about[i]?.dataUrl;
          return (
            <li
              key={l}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5"
            >
              <span className="w-16 text-xs font-semibold uppercase tracking-wide text-muted">{l}</span>
              <span className="flex-1 truncate text-sm text-ink">
                {has ? about[i]?.caption || <em className="text-muted">no caption</em> : <em className="text-muted">empty</em>}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!has || confirm(`Clear the ${l} slide?`)) setAboutImage(i, null);
                }}
                disabled={!has}
                className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                title="Clear"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------

function LatestSection() {
  const items = useStore((s) => s.latest ?? []);
  const addLatestItem = useStore((s) => s.addLatestItem);
  const removeLatestItem = useStore((s) => s.removeLatestItem);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Latest things"
        action={
          <button
            type="button"
            onClick={addLatestItem}
            className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-xs text-muted hover:border-accent/60 hover:text-ink"
          >
            + Add
          </button>
        }
      />
      {items.length === 0 ? (
        <p className="text-xs italic text-muted">No items yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5"
            >
              <div className="h-7 w-10 overflow-hidden rounded bg-white/5">
                {item.dataUrl ? (
                  <img src={item.dataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted">🖼</div>
                )}
              </div>
              <span className="flex-1 truncate text-sm text-ink">
                {item.title || <em className="text-muted">untitled</em>}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Remove this item?')) removeLatestItem(item.id);
                }}
                className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

function SubTeamsSection() {
  const subTeams = useStore((s) => s.subTeams ?? []);
  const addSubTeam = useStore((s) => s.addSubTeam);
  const removeSubTeam = useStore((s) => s.removeSubTeam);

  return (
    <section className="mb-8">
      <SectionHeader
        title="Sub-teams"
        action={
          <button
            type="button"
            onClick={() => addSubTeam()}
            className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-xs text-muted hover:border-accent/60 hover:text-ink"
          >
            + Add
          </button>
        }
      />
      {subTeams.length === 0 ? (
        <p className="text-xs italic text-muted">No sub-teams yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {subTeams.map((st) => (
            <li
              key={st.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5"
            >
              <span className="flex-1 truncate text-sm text-ink">{st.title}</span>
              <span className="text-[11px] text-muted">
                {st.memberIds.length + (st.managerId ? 1 : 0)}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove sub-team "${st.title}"?`)) removeSubTeam(st.id);
                }}
                className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
                title="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

const THEME_LABELS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: 'accent', label: 'Accent', hint: 'Buttons, highlights, active states' },
  { key: 'canvas', label: 'Canvas', hint: 'Page background' },
  { key: 'surface', label: 'Surface', hint: 'Card background' },
  { key: 'ink', label: 'Ink', hint: 'Primary text' },
  { key: 'muted', label: 'Muted', hint: 'Secondary text' },
  { key: 'border', label: 'Border', hint: 'Dividers, outlines' },
];

function ThemeSection() {
  const palette = useTheme((s) => s.palette);
  const setColor = useTheme((s) => s.setColor);
  const applyPreset = useTheme((s) => s.applyPreset);
  const reset = useTheme((s) => s.reset);

  return (
    <section className="mb-8">
      <SectionHeader title="Theme" />

      <div className="mb-3 flex gap-1.5">
        <PresetBtn label="Dark default" onClick={() => applyPreset(DEFAULT_PALETTE)} />
        <PresetBtn label="monday light" onClick={() => applyPreset(MONDAY_PALETTE)} />
        <PresetBtn label="Reset" onClick={reset} />
      </div>

      <div className="space-y-2">
        {THEME_LABELS.map(({ key, label, hint }) => (
          <ColorRow
            key={key}
            label={label}
            hint={hint}
            value={palette[key]}
            onChange={(hex) => setColor(key, hex)}
          />
        ))}
      </div>
    </section>
  );
}

function PresetBtn({ label, onClick }: { label: string; onClick: () => void }) {
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

// ---------------------------------------------------------------------------

function DataSection() {
  const exported = useStore((s) => ({
    people: s.people,
    chips: s.chips,
    activeTopicTab: s.activeTopicTab,
    about: s.about,
    latest: s.latest,
    subTeams: s.subTeams,
  }));
  const replaceState = useStore((s) => s.replaceState);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text) as AppState;
      if (!Array.isArray(parsed.people) || !Array.isArray(parsed.chips)) {
        alert('Invalid file format.');
        return;
      }
      replaceState(parsed);
    } catch (err) {
      alert(`Failed to import: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <section className="mb-8">
      <SectionHeader title="Data" />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onExport}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink hover:border-accent/40"
        >
          ↓ Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink hover:border-accent/40"
        >
          ↑ Import JSON
        </button>
        <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Export the current plan to share or back up. Import replaces the current plan with the JSON's contents.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------

function DangerZone() {
  const resetToSeed = useStore((s) => s.resetToSeed);

  return (
    <section className="border-t border-white/10 pt-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-300">Danger zone</h3>
      <button
        type="button"
        onClick={() => {
          if (
            confirm(
              'This resets ALL content — people, chips, sub-teams, About slides, Latest items — back to the original seed. Photos and theme palette are kept. Continue?',
            )
          )
            resetToSeed();
        }}
        className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20"
      >
        Reset all content to seed
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink">{title}</h3>
      {action}
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
