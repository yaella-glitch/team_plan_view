import { useState } from 'react';
import { useStore } from '../store';
import { resolvePhotoUrl } from '../lib/photo';

export function AdminDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 top-14 z-30 flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur hover:bg-white"
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
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Admin</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-muted hover:bg-slate-100 hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <PMMsSection />
          <AboutSection />
          <LatestSection />
          <SubTeamsSection />
          <DangerZone />
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------

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
            className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs text-muted hover:border-indigo-300 hover:text-indigo-700"
          >
            + Add
          </button>
        }
      />

      <ul className="space-y-1.5">
        {people.map((p) => {
          const photo = resolvePhotoUrl(p.photoUrl);
          return (
            <li key={p.id} className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5">
              <div className="h-7 w-7 overflow-hidden rounded-full bg-slate-100">
                {photo ? (
                  <img src={photo} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
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
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5"
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
            className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs text-muted hover:border-indigo-300 hover:text-indigo-700"
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
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5"
            >
              <div className="h-7 w-10 overflow-hidden rounded bg-slate-100">
                {item.dataUrl ? (
                  <img src={item.dataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">🖼</div>
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
            className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs text-muted hover:border-indigo-300 hover:text-indigo-700"
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
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5"
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

function DangerZone() {
  const resetToSeed = useStore((s) => s.resetToSeed);

  return (
    <section className="border-t border-border pt-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">Danger zone</h3>
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
        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
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
