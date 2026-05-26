import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { AddOwnershipModal } from './Backlog';
import { useTheme, DEFAULT_PALETTE, MONDAY_PALETTE, type Palette } from '../theme';
import { AvatarEditor } from './AvatarEditor';
import { ADMIN_PASSWORD_HASH } from '../access';
import { resolvePhotoUrl } from '../lib/photo';
import { TOPIC_TAB_CATEGORIES, CATEGORY_BY_ID } from '../constants';
import type { AppState, Category, Person } from '../types';

const ADMIN_UNLOCK_KEY = 'team-plan-view-admin-unlocked-v1';

function isAdminUnlocked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function setAdminUnlocked() {
  try {
    sessionStorage.setItem(ADMIN_UNLOCK_KEY, '1');
  } catch {
    // ignore
  }
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function AdminDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mx-auto max-w-7xl px-8 pb-10 pt-4 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted hover:border-accent/40 hover:text-ink"
          title="Open admin panel"
        >
          ⚙ Admin
        </button>
      </div>

      {open && <Drawer onClose={() => setOpen(false)} />}
    </>
  );
}

function Drawer({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(() => isAdminUnlocked());

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

        {!unlocked ? (
          <AdminLock
            onUnlock={() => {
              setAdminUnlocked();
              setUnlocked(true);
            }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <QuickAddSection />
            <PMMsSection />
            <TopicsSection />
            <AboutSection />
            <LatestSection />
            <SubTeamsSection />
            <ThemeSection />
            <DataSection />
            <DangerZone />
          </div>
        )}
      </aside>
    </div>
  );
}

function AdminLock({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const hash = await sha256Hex(password);
      if (hash === ADMIN_PASSWORD_HASH) {
        onUnlock();
      } else {
        setError('Wrong password.');
        setPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Editor only
        </div>
        <h3 className="text-2xl font-light text-ink">Unlock admin</h3>
        <p className="mt-1 text-xs text-muted">Edit team plan content. Closes when you close this tab.</p>

        <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Admin password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-base text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
          placeholder="••••••••"
        />
        {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
        <button
          type="submit"
          disabled={submitting || password.length === 0}
          className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-canvas hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Checking…' : 'Unlock'}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

function QuickAddSection() {
  const addPerson = useStore((s) => s.addPerson);
  const addChip = useStore((s) => s.addChip);
  const addSubTeam = useStore((s) => s.addSubTeam);
  const addAboutSlide = useStore((s) => s.addAboutSlide);
  const addLatestItem = useStore((s) => s.addLatestItem);
  const addTopic = useStore((s) => s.addTopic);
  const [openOwnership, setOpenOwnership] = useState(false);

  const tile = 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-white/[0.06]';

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
          className={tile}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span>+ Add PMM</span>
          </div>
        </button>
        <button type="button" onClick={() => setOpenOwnership(true)} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧩</span>
            <span>+ Add ownership area</span>
          </div>
        </button>
        <button type="button" onClick={() => addSubTeam()} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🟪</span>
            <span>+ Add pod</span>
          </div>
        </button>
        <button type="button" onClick={() => addSubTeam('New cross pod', 'crossCut')} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">⬌</span>
            <span>+ Add cross pod</span>
          </div>
        </button>
        <button type="button" onClick={() => { const name = prompt('New topic name?'); if (name && name.trim()) addTopic(name.trim()); }} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📌</span>
            <span>+ Add topic</span>
          </div>
        </button>
        <button type="button" onClick={() => addAboutSlide()} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🖼</span>
            <span>+ About slide</span>
          </div>
        </button>
        <button type="button" onClick={() => addLatestItem()} className={tile}>
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <span>+ Latest highlight</span>
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
        {people.map((p) => (
          <PmmAdminRow key={p.id} person={p} onRemove={() => removePerson(p.id)} />
        ))}
      </ul>
    </section>
  );
}

function PmmAdminRow({ person, onRemove }: { person: Person; onRemove: () => void }) {
  const updatePerson = useStore((s) => s.updatePerson);
  const togglePersonEnabled = useStore((s) => s.togglePersonEnabled);
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState(person.name);

  useEffect(() => setDraft(person.name), [person.name]);
  const enabled = person.enabled !== false;

  return (
    <li
      className={[
        'flex items-center gap-2 rounded-lg border bg-white/[0.03] px-2 py-1.5',
        enabled ? 'border-white/10' : 'border-white/5 opacity-50',
      ].join(' ')}
    >
      <AvatarEditor person={person} size={28} />
      {editingName ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim()) updatePerson(person.id, { name: draft.trim() });
            else setDraft(person.name);
            setEditingName(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              setDraft(person.name);
              setEditingName(false);
            }
          }}
          className="flex-1 bg-transparent text-sm text-ink outline-none border-b border-accent/40"
        />
      ) : (
        <span
          className="flex-1 cursor-text truncate text-sm text-ink"
          onDoubleClick={() => setEditingName(true)}
          title="Double-click to rename"
        >
          {person.name}
        </span>
      )}

      <ToggleSwitch
        on={enabled}
        onChange={() => togglePersonEnabled(person.id)}
        title={enabled ? `${person.name} is visible. Toggle to hide.` : `${person.name} is hidden. Toggle to show.`}
      />

      <button
        type="button"
        onClick={() => {
          if (confirm(`Permanently remove ${person.name}? Their chips go to the backlog.`)) onRemove();
        }}
        className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-500/15 hover:text-rose-300"
        title="Permanently delete"
      >
        ×
      </button>
    </li>
  );
}

function ToggleSwitch({ on, onChange, title }: { on: boolean; onChange: () => void; title?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      title={title}
      className={[
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        on ? 'bg-accent' : 'bg-white/15',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-[18px]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
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
        <ul className="space-y-2">
          {items.map((item) => (
            <LatestAdminRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LatestAdminRow({ item }: { item: import('../types').LatestItem }) {
  const updateLatestItem = useStore((s) => s.updateLatestItem);
  const removeLatestItem = useStore((s) => s.removeLatestItem);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { compressImage } = await import('../lib/image');
      const dataUrl = await compressImage(file, { maxWidth: 1000, quality: 0.8 });
      updateLatestItem(item.id, { dataUrl });
    } catch (err) {
      alert(`Failed to load image: ${(err as Error).message}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <li className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="h-10 w-14 shrink-0 overflow-hidden rounded bg-white/5 ring-1 ring-white/10 hover:ring-accent/60"
          title="Click to upload / replace image"
        >
          {item.dataUrl ? (
            <img src={item.dataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted">🖼</div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />

        <div className="flex-1 space-y-1">
          <input
            value={item.title ?? ''}
            onChange={(e) =>
              updateLatestItem(item.id, { title: e.target.value.trim() ? e.target.value : undefined })
            }
            placeholder="Title…"
            className="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-ink outline-none focus:border-accent/60"
          />
          <input
            type="url"
            value={item.link ?? ''}
            onChange={(e) =>
              updateLatestItem(item.id, { link: e.target.value.trim() ? e.target.value : undefined })
            }
            placeholder="https://link-to-asset…"
            className="w-full rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-ink outline-none focus:border-accent/60"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (confirm('Remove this item?')) removeLatestItem(item.id);
          }}
          className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-500/15 hover:text-rose-300"
          title="Remove"
        >
          ×
        </button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------

function TopicsSection() {
  const topics = useStore((s) => s.topics ?? []);
  const people = useStore((s) => s.people);
  const addTopic = useStore((s) => s.addTopic);
  const renameTopic = useStore((s) => s.renameTopic);
  const removeTopic = useStore((s) => s.removeTopic);
  const addPmmToTopic = useStore((s) => s.addPmmToTopic);
  const removePmmFromTopic = useStore((s) => s.removePmmFromTopic);

  return (
    <section className="mb-8">
      <SectionHeader title="Topics" />
      <p className="mb-3 text-[11px] text-muted">
        Topics in the Ownership view, grouped by category. Each topic can hold multiple PMMs.
      </p>
      {TOPIC_TAB_CATEGORIES.map((catId) => {
        const meta = CATEGORY_BY_ID[catId];
        const catTopics = topics.filter((t) => t.category === catId).sort((a, b) => a.order - b.order);
        return (
          <div key={catId} className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: meta.ownershipColor + '33',
                  color: meta.ownershipColor,
                }}
              >
                {meta.icon} {meta.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  const name = prompt(`New tag in ${meta.label}?`);
                  if (name && name.trim()) addTopic(name.trim(), catId as Category);
                }}
                className="rounded-full border border-white/15 bg-white/[0.05] px-2 py-0 text-[11px] text-muted hover:border-accent/60 hover:text-ink"
              >
                + tag
              </button>
            </div>
            {catTopics.length === 0 ? (
              <p className="text-[11px] italic text-muted">— no tags yet</p>
            ) : (
              <ul className="space-y-1.5">
                {catTopics.map((t) => (
                  <TopicAdminRow
                    key={t.id}
                    topicId={t.id}
                    topicName={t.name}
                    pmmIds={t.pmmIds}
                    allPeople={people}
                    onRename={(name) => renameTopic(t.id, name)}
                    onRemove={() => removeTopic(t.id)}
                    onAddPmm={(pmmId) => addPmmToTopic(t.id, pmmId)}
                    onRemovePmm={(pmmId) => removePmmFromTopic(t.id, pmmId)}
                  />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

function TopicAdminRow({
  topicId: _topicId,
  topicName,
  pmmIds,
  allPeople,
  onRename,
  onRemove,
  onAddPmm,
  onRemovePmm,
}: {
  topicId: string;
  topicName: string;
  pmmIds: string[];
  allPeople: Person[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onAddPmm: (pmmId: string) => void;
  onRemovePmm: (pmmId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(topicName);
  const [picker, setPicker] = useState(false);
  useEffect(() => setDraft(topicName), [topicName]);

  const owners = pmmIds
    .map((id) => allPeople.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));
  const available = allPeople.filter((p) => !pmmIds.includes(p.id));

  const commit = () => {
    if (draft.trim() && draft.trim() !== topicName) onRename(draft.trim());
    else setDraft(topicName);
    setEditing(false);
  };

  return (
    <li className="rounded-lg border border-white/10 bg-white/[0.03] p-2">
      <div className="mb-1.5 flex items-center gap-2">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setDraft(topicName);
                setEditing(false);
              }
            }}
            className="flex-1 bg-transparent text-sm font-medium text-ink outline-none border-b border-accent/40"
          />
        ) : (
          <span
            className="flex-1 cursor-text truncate text-sm font-medium text-ink"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to rename"
          >
            {topicName}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove "${topicName}"?`)) onRemove();
          }}
          className="rounded-full px-1.5 py-0 text-xs text-muted hover:bg-rose-500/15 hover:text-rose-300"
          title="Remove topic"
        >
          ×
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {owners.map((p) => (
          <span
            key={p.id}
            className="group inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 py-0.5 pl-0.5 pr-2 text-[11px] text-ink"
          >
            <img
              src={resolvePhotoUrl(p.photoUrl) || ''}
              alt={p.name}
              className="h-5 w-5 rounded-full object-cover"
              onError={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
            />
            <span className="truncate">{p.name}</span>
            <button
              type="button"
              onClick={() => onRemovePmm(p.id)}
              className="opacity-50 hover:opacity-100"
              title="Remove from topic"
            >
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setPicker((v) => !v)}
          className="rounded-full border border-dashed border-white/15 px-2 py-0.5 text-[11px] text-muted hover:border-accent/60 hover:text-ink disabled:opacity-40"
          disabled={available.length === 0}
          title={available.length === 0 ? 'All PMMs are already on this topic' : picker ? 'Close' : 'Add a PMM'}
        >
          {picker ? '✓ done' : '+ PMM'}
        </button>
      </div>
      {/* Inline picker — no dropdown, no overflow clipping issues */}
      {picker && available.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {available.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onAddPmm(p.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-0.5 pr-2 text-[11px] text-ink hover:border-accent/60 hover:bg-white/[0.08]"
              title={`Add ${p.name}`}
            >
              <img
                src={resolvePhotoUrl(p.photoUrl) || ''}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
                onError={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = 'none')}
              />
              <span className="truncate">{p.name}</span>
              <span className="text-accent">+</span>
            </button>
          ))}
        </div>
      )}
    </li>
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

