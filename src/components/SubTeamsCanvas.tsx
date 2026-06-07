import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import type { SubTeamSlot } from '../store';
import { resolvePhotoUrl } from '../lib/photo';
import { useAdminUnlocked } from '../lib/admin';
import type { Person, SubTeam } from '../types';

const unassignedDropId = (slot: SubTeamSlot) => `subteam:unassigned:${slot}`;
const subteamMembersDropId = (id: string, slot: SubTeamSlot) => `subteam-members:${id}:${slot}`;
const memberDragId = (personId: string, slot: SubTeamSlot) => `member:${personId}:${slot}`;

export function SubTeamsCanvas({
  slot = 'main',
  title = 'Professional pods',
}: {
  slot?: SubTeamSlot;
  title?: string;
}) {
  const people = useStore(selectVisiblePeople);
  const allPods = useStore((s) => (slot === 'second' ? s.subTeams2 : s.subTeams) ?? []);
  const addSubTeam = useStore((s) => s.addSubTeam);
  const admin = useAdminUnlocked();

  const crossCut = allPods.filter((p) => p.kind === 'crossCut');
  const normal = allPods.filter((p) => p.kind !== 'crossCut');

  const assignedIds = new Set(
    allPods.flatMap((s) => [s.managerId, ...s.memberIds].filter((x): x is string => Boolean(x))),
  );
  const unassigned = people.filter((p) => !assignedIds.has(p.id));

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>
        {admin && (
          <>
            <button
              type="button"
              onClick={() => addSubTeam('New pod', 'normal', slot)}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-muted hover:border-accent/60 hover:text-ink"
              title="Add a pod"
            >
              + Pod
            </button>
            <button
              type="button"
              onClick={() => addSubTeam('New cross pod', 'crossCut', slot)}
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-muted hover:border-accent/60 hover:text-ink"
              title="Add a cross pod"
            >
              + Cross
            </button>
          </>
        )}
      </div>

      <UnassignedPool people={unassigned} slot={slot} />

      {normal.length === 0 && crossCut.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm italic text-muted">
          {admin ? 'No pods yet. Hit + Pod above to start.' : 'No pods yet.'}
        </div>
      ) : normal.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {normal.map((st) => (
            <PodBox key={st.id} subTeam={st} people={people} slot={slot} />
          ))}
        </div>
      ) : null}

      {crossCut.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {crossCut.map((st) => (
            <CrossCutBar key={st.id} subTeam={st} people={people} slot={slot} />
          ))}
        </div>
      )}
    </section>
  );
}

function UnassignedPool({ people, slot }: { people: Person[]; slot: SubTeamSlot }) {
  const { setNodeRef, isOver } = useDroppable({ id: unassignedDropId(slot) });
  const isEmpty = people.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-2xl border-2 border-dashed transition-all',
        isEmpty ? 'px-3 py-2' : 'p-4',
        isOver ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.02]',
      ].join(' ')}
    >
      <p className={['text-xs font-semibold uppercase tracking-wide text-muted', isEmpty ? '' : 'mb-3'].join(' ')}>
        Unassigned <span className="ml-1 normal-case text-muted/60">({people.length})</span>
        {isEmpty && <span className="ml-2 normal-case italic text-muted/60">— everyone assigned</span>}
      </p>
      {!isEmpty && (
        <div className="flex flex-wrap gap-2">
          {people.map((p) => (
            <PhotoChip key={p.id} person={p} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}

function PodBox({ subTeam, people, slot }: { subTeam: SubTeam; people: Person[]; slot: SubTeamSlot }) {
  const manager = subTeam.managerId ? people.find((p) => p.id === subTeam.managerId) ?? null : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));
  // Render the lead first, inline among the same row as the rest of the team.
  const ordered: Person[] = manager ? [manager, ...members] : members;

  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex min-h-[300px] flex-col gap-3 p-5">
        <PodHeader subTeam={subTeam} slot={slot} />
        <SharedGoal subTeam={subTeam} slot={slot} />
        <TeamArea subTeamId={subTeam.id} people={ordered} leadId={subTeam.managerId} slot={slot} />
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <TagRow subTeam={subTeam} slot={slot} />
          <SeeMoreButton subTeam={subTeam} onClick={() => setDetailOpen(true)} />
        </div>
      </div>
      {detailOpen && (
        <PodDetailModal
          subTeam={subTeam}
          people={ordered}
          leadId={subTeam.managerId}
          slot={slot}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </article>
  );
}

function CrossCutBar({ subTeam, people, slot }: { subTeam: SubTeam; people: Person[]; slot: SubTeamSlot }) {
  const manager = subTeam.managerId ? people.find((p) => p.id === subTeam.managerId) ?? null : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));
  const ordered: Person[] = manager ? [manager, ...members] : members;
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2">
          <PodHeader subTeam={subTeam} inline slot={slot} />
        </div>
        <div className="min-w-[180px] flex-1">
          <SharedGoal subTeam={subTeam} dense slot={slot} />
        </div>
        <TeamArea subTeamId={subTeam.id} people={ordered} leadId={subTeam.managerId} slot={slot} dense />
        <div className="flex items-center gap-2">
          <TagRow subTeam={subTeam} dense slot={slot} />
        </div>
        <SeeMoreButton subTeam={subTeam} onClick={() => setDetailOpen(true)} />
      </div>
      {detailOpen && (
        <PodDetailModal
          subTeam={subTeam}
          people={ordered}
          leadId={subTeam.managerId}
          slot={slot}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </article>
  );
}

function PodHeader({
  subTeam,
  inline = false,
  slot,
}: {
  subTeam: SubTeam;
  inline?: boolean;
  slot: SubTeamSlot;
}) {
  const updateSubTeamTitle = useStore((s) => s.updateSubTeamTitle);
  const removeSubTeam = useStore((s) => s.removeSubTeam);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.title);
  useEffect(() => setDraft(subTeam.title), [subTeam.title]);

  const titleClass = inline ? 'text-base font-semibold text-ink' : 'text-lg font-semibold text-ink';

  return (
    <div className={inline ? 'flex flex-1 items-center gap-2' : 'flex items-start gap-2'}>
      <div className="flex-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft.trim()) updateSubTeamTitle(subTeam.id, draft.trim(), slot);
              else setDraft(subTeam.title);
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
              else if (e.key === 'Escape') {
                setDraft(subTeam.title);
                setEditing(false);
              }
            }}
            className={`block w-full bg-transparent ${titleClass} outline-none border-b border-accent/40`}
          />
        ) : (
          <h3
            className={`${titleClass} cursor-text`}
            onDoubleClick={() => setEditing(true)}
            title="Double-click to edit"
          >
            {subTeam.title}
          </h3>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Remove pod "${subTeam.title}"?`)) removeSubTeam(subTeam.id, slot);
        }}
        className={
          inline
            ? 'rounded-full px-1.5 text-xs text-muted hover:text-rose-300'
            : 'rounded-full px-2 py-0.5 text-sm text-muted hover:bg-rose-500/15 hover:text-rose-300'
        }
        title="Remove pod"
      >
        ×
      </button>
    </div>
  );
}

function TeamArea({
  subTeamId,
  people,
  leadId,
  slot,
  dense = false,
}: {
  subTeamId: string;
  people: Person[];
  leadId: string | null;
  slot: SubTeamSlot;
  dense?: boolean;
}) {
  // Members drop zone — dragging into it adds the person as a member.
  // To promote to Lead, hover a chip and click its ★ button.
  const { setNodeRef, isOver } = useDroppable({ id: subteamMembersDropId(subTeamId, slot) });
  return (
    <div
      ref={setNodeRef}
      className={[
        'flex flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed transition-colors',
        dense ? 'min-h-[36px] px-2 py-1' : 'min-h-[80px] px-3 py-2.5',
        isOver ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.03]',
      ].join(' ')}
    >
      {people.length === 0 ? (
        <p className="text-xs italic text-muted">Drop team photos here</p>
      ) : (
        people.map((p) => (
          <PhotoChip
            key={p.id}
            person={p}
            slot={slot}
            subTeamId={subTeamId}
            isLead={p.id === leadId}
          />
        ))
      )}
    </div>
  );
}

function SeeMoreButton({ subTeam, onClick }: { subTeam: SubTeam; onClick: () => void }) {
  const admin = useAdminUnlocked();
  const ownerships = subTeam.ownerships ?? {};
  const ownershipCount = Object.values(ownerships).reduce((n, list) => n + list.length, 0);
  const podCount = (subTeam.podResponsibilities ?? []).length;
  const itemCount = ownershipCount + podCount;
  const hasNotes = Boolean((subTeam.detailsText ?? '').trim());
  // Hide for non-admins when there's nothing to see (no items + no notes).
  if (!admin && itemCount === 0 && !hasNotes) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 self-start text-[11px] font-medium text-accent hover:underline"
    >
      <span>▸</span>
      <span>See more</span>
      {itemCount > 0 && <span className="text-muted">· {itemCount}</span>}
    </button>
  );
}

function PodDetailModal({
  subTeam,
  people,
  leadId,
  slot,
  onClose,
}: {
  subTeam: SubTeam;
  people: Person[];
  leadId: string | null;
  slot: SubTeamSlot;
  onClose: () => void;
}) {
  const admin = useAdminUnlocked();
  const addOwnershipItem = useStore((s) => s.addOwnershipItem);
  const updateOwnershipItem = useStore((s) => s.updateOwnershipItem);
  const removeOwnershipItem = useStore((s) => s.removeOwnershipItem);
  const addPodResponsibility = useStore((s) => s.addPodResponsibility);
  const updatePodResponsibility = useStore((s) => s.updatePodResponsibility);
  const removePodResponsibility = useStore((s) => s.removePodResponsibility);
  const setSubTeamDetails = useStore((s) => s.setSubTeamDetails);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ownerships = subTeam.ownerships ?? {};
  const podResponsibilities = subTeam.podResponsibilities ?? [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-ink">{subTeam.title}</h3>
            {subTeam.goalText && (
              <p className="mt-1 text-sm text-muted">
                <span className="font-semibold text-muted/80">Shared goal · </span>
                {subTeam.goalText}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-ink"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body — two columns, scrolls */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left: What the pod owns */}
            <PodResponsibilitiesColumn
              items={podResponsibilities}
              admin={admin}
              onAdd={(v) => addPodResponsibility(subTeam.id, v, slot)}
              onUpdate={(idx, v) => updatePodResponsibility(subTeam.id, idx, v, slot)}
              onRemove={(idx) => removePodResponsibility(subTeam.id, idx, slot)}
            />

            {/* Right: Who owns what */}
            <WhoOwnsWhatColumn
              people={people}
              leadId={leadId}
              ownerships={ownerships}
              admin={admin}
              onAdd={(personId, v) => addOwnershipItem(subTeam.id, personId, v, slot)}
              onUpdate={(personId, idx, v) =>
                updateOwnershipItem(subTeam.id, personId, idx, v, slot)
              }
              onRemove={(personId, idx) =>
                removeOwnershipItem(subTeam.id, personId, idx, slot)
              }
            />
          </div>

          {/* Free-text notes (optional) */}
          <NotesBlock
            text={subTeam.detailsText ?? ''}
            admin={admin}
            onSave={(text) => setSubTeamDetails(subTeam.id, text, slot)}
          />
        </div>
      </div>
    </div>
  );
}

function PodResponsibilitiesColumn({
  items,
  admin,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: string[];
  admin: boolean;
  onAdd: (v: string) => void;
  onUpdate: (index: number, v: string) => void;
  onRemove: (index: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
    setAdding(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted">
        What the pod owns
      </h4>
      {items.length === 0 && !adding ? (
        <p className="text-sm italic text-muted">
          {admin ? 'Add what the team owns as a whole.' : 'Nothing here yet.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((it, idx) => (
            <OwnershipBullet
              key={idx}
              text={it}
              admin={admin}
              onUpdate={(v) => onUpdate(idx, v)}
              onRemove={() => onRemove(idx)}
            />
          ))}
        </ul>
      )}
      {admin && (
        <div>
          {adding ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                else if (e.key === 'Escape') {
                  setDraft('');
                  setAdding(false);
                }
              }}
              placeholder="what the pod owns…"
              className="w-full rounded-md border border-accent/40 bg-white/[0.04] px-2 py-1 text-sm text-ink outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-xs text-muted hover:text-ink"
            >
              + add item
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function WhoOwnsWhatColumn({
  people,
  leadId,
  ownerships,
  admin,
  onAdd,
  onUpdate,
  onRemove,
}: {
  people: Person[];
  leadId: string | null;
  ownerships: Record<string, string[]>;
  admin: boolean;
  onAdd: (personId: string, v: string) => void;
  onUpdate: (personId: string, index: number, v: string) => void;
  onRemove: (personId: string, index: number) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-muted">
        Who owns what
      </h4>
      {people.length === 0 ? (
        <p className="text-sm italic text-muted">No team members in this pod yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((p) => (
            <OwnershipRow
              key={p.id}
              person={p}
              isLead={p.id === leadId}
              items={ownerships[p.id] ?? []}
              admin={admin}
              onAdd={(v) => onAdd(p.id, v)}
              onUpdate={(idx, v) => onUpdate(p.id, idx, v)}
              onRemove={(idx) => onRemove(p.id, idx)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OwnershipRow({
  person,
  isLead,
  items,
  admin,
  onAdd,
  onUpdate,
  onRemove,
}: {
  person: Person;
  isLead: boolean;
  items: string[];
  admin: boolean;
  onAdd: (v: string) => void;
  onUpdate: (index: number, v: string) => void;
  onRemove: (index: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      {/* Left column: photo + name + lead */}
      <div className="flex w-40 shrink-0 flex-col items-start gap-2">
        <div className="h-14 w-14 overflow-hidden rounded-full ring-1 ring-white/15">
          {photo && !imgFailed ? (
            <img
              src={photo}
              alt={person.name}
              className="h-full w-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-semibold text-muted">
              {initials(person.name)}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold text-ink">{person.name}</div>
          {isLead && (
            <span className="mt-0.5 inline-block rounded-full bg-white/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ink">
              Lead
            </span>
          )}
        </div>
      </div>

      {/* Right column: bullets */}
      <div className="min-w-0">
        {items.length === 0 && !adding ? (
          <p className="text-xs italic text-muted">
            {admin ? 'No items yet — add what they own in this pod.' : 'No items yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((it, idx) => (
              <OwnershipBullet
                key={idx}
                text={it}
                admin={admin}
                onUpdate={(v) => onUpdate(idx, v)}
                onRemove={() => onRemove(idx)}
              />
            ))}
          </ul>
        )}
        {admin && (
          <div className="mt-2">
            {adding ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                  else if (e.key === 'Escape') {
                    setDraft('');
                    setAdding(false);
                  }
                }}
                placeholder="what they own…"
                className="w-full rounded-md border border-accent/40 bg-white/[0.04] px-2 py-1 text-sm text-ink outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="text-xs text-muted hover:text-ink"
              >
                + add item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OwnershipBullet({
  text,
  admin,
  onUpdate,
  onRemove,
}: {
  text: string;
  admin: boolean;
  onUpdate: (v: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);

  return (
    <li className="group flex items-start gap-2 text-sm text-ink/90">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onUpdate(draft);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              setDraft(text);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent outline-none border-b border-accent/40"
        />
      ) : (
        <span
          className={['flex-1 leading-snug', admin ? 'cursor-text' : ''].join(' ')}
          onDoubleClick={() => admin && setEditing(true)}
          title={admin ? 'Double-click to edit' : undefined}
        >
          {text}
        </span>
      )}
      {admin && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 text-muted hover:text-rose-300"
          title="Remove"
        >
          ×
        </button>
      )}
    </li>
  );
}

function NotesBlock({
  text,
  admin,
  onSave,
}: {
  text: string;
  admin: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  useEffect(() => setDraft(text), [text]);
  const hasText = Boolean(text.trim());
  if (!admin && !hasText) return null;
  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Notes</p>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onSave(draft);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(text);
              setEditing(false);
            }
          }}
          rows={4}
          placeholder="Free-text notes — scope, working style, key deliverables…"
          className="block w-full resize-y bg-transparent text-sm text-ink placeholder:italic placeholder:text-muted outline-none"
        />
      ) : hasText ? (
        <div
          className={['whitespace-pre-wrap text-sm leading-relaxed text-ink/90', admin ? 'cursor-text' : ''].join(' ')}
          onDoubleClick={() => admin && setEditing(true)}
          title={admin ? 'Double-click to edit' : undefined}
        >
          {text}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs italic text-muted hover:text-ink"
        >
          + add notes
        </button>
      )}
    </div>
  );
}

function TagRow({ subTeam, dense = false, slot }: { subTeam: SubTeam; dense?: boolean; slot: SubTeamSlot }) {
  const addSubTeamTag = useStore((s) => s.addSubTeamTag);
  const removeSubTeamTag = useStore((s) => s.removeSubTeamTag);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const tags = subTeam.tags ?? [];

  const commit = () => {
    const v = draft.trim();
    if (v) addSubTeamTag(subTeam.id, v, slot);
    setDraft('');
    setAdding(false);
  };

  return (
    <div className={['flex flex-wrap items-center gap-1', dense ? '' : ''].join(' ')}>
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="group inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[8px] font-medium uppercase tracking-wide text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(165,138,255,0.45), rgba(99,102,241,0.45))',
            border: '1px solid rgba(165,138,255,0.5)',
          }}
        >
          {t}
          <button
            type="button"
            onClick={() => removeSubTeamTag(subTeam.id, i, slot)}
            className="opacity-0 transition-opacity group-hover:opacity-80 hover:opacity-100"
            title="Remove tag"
          >
            ×
          </button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              setDraft('');
              setAdding(false);
            }
          }}
          placeholder="tag…"
          className="w-20 rounded-full border border-accent/40 bg-white/[0.04] px-1.5 py-px text-[8px] text-white outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-full border border-dashed border-accent/40 px-1.5 py-px text-[8px] text-muted hover:border-accent hover:text-ink"
          title="Add tag"
        >
          + tag
        </button>
      )}
    </div>
  );
}

function SharedGoal({
  subTeam,
  dense = false,
  slot,
}: {
  subTeam: SubTeam;
  dense?: boolean;
  slot: SubTeamSlot;
}) {
  const setSubTeamGoalText = useStore((s) => s.setSubTeamGoalText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.goalText ?? '');
  useEffect(() => setDraft(subTeam.goalText ?? ''), [subTeam.goalText]);

  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">Shared goal</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setSubTeamGoalText(subTeam.id, draft.trim(), slot);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
            else if (e.key === 'Escape') {
              setDraft(subTeam.goalText ?? '');
              setEditing(false);
            }
          }}
          placeholder="short text…"
          className="flex-1 bg-transparent text-[10px] text-white outline-none border-b border-accent/40"
        />
      ) : (
        <span
          className={[
            'flex-1 cursor-text text-[10px] text-white',
            dense ? 'truncate' : '',
          ].join(' ')}
          onDoubleClick={() => setEditing(true)}
          title="Double-click to edit"
        >
          {subTeam.goalText || <span className="italic text-muted">add a short goal…</span>}
        </span>
      )}
    </div>
  );
}

function PhotoChip({
  person,
  size = 'md',
  slot,
  subTeamId,
  isLead = false,
}: {
  person: Person;
  size?: 'md' | 'lg';
  slot: SubTeamSlot;
  subTeamId?: string;
  isLead?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: memberDragId(person.id, slot),
    data: { personId: person.id, kind: 'subteam-member', slot },
  });
  const setSubTeamManager = useStore((s) => s.setSubTeamManager);
  const admin = useAdminUnlocked();
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  const dim = size === 'lg' ? 'h-10 w-10 text-xs' : 'h-8 w-8 text-[10px]';
  const textCls = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="group/chip relative inline-flex cursor-grab items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3 shadow-sm backdrop-blur hover:bg-white/10 active:cursor-grabbing"
      {...listeners}
      {...attributes}
      title={isLead ? `${person.name} — Lead` : person.name}
    >
      <div className={`${dim} overflow-hidden rounded-full ring-1 ring-white/15`}>
        {photo && !imgFailed ? (
          <img
            src={photo}
            alt={person.name}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        ) : (
          <div
            className={[
              'flex h-full w-full items-center justify-center font-semibold',
              imgFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-muted',
            ].join(' ')}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>
      <span className={`${textCls} font-medium text-ink`}>{person.name}</span>
      {isLead && (
        <span
          className="ml-0.5 rounded-full bg-white/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ink"
          title="Pod lead"
        >
          Lead
        </span>
      )}
      {admin && subTeamId && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setSubTeamManager(subTeamId, isLead ? null : person.id, slot);
          }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-canvas text-[10px] font-bold text-muted opacity-0 shadow transition-opacity hover:text-ink group-hover/chip:opacity-100"
          title={isLead ? 'Demote — no lead' : 'Make Lead'}
        >
          {isLead ? '×' : '★'}
        </button>
      )}
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

// Drop ID parsers for App.tsx routing
export function parseSubTeamDropId(
  overId: string,
):
  | { kind: 'unassigned'; slot: SubTeamSlot }
  | { kind: 'manager'; subTeamId: string; slot: SubTeamSlot }
  | { kind: 'members'; subTeamId: string; slot: SubTeamSlot }
  | null {
  if (overId.startsWith('subteam:unassigned:')) {
    return { kind: 'unassigned', slot: overId.endsWith(':second') ? 'second' : 'main' };
  }
  if (overId.startsWith('subteam-manager:')) {
    const rest = overId.slice('subteam-manager:'.length);
    const lastColon = rest.lastIndexOf(':');
    return {
      kind: 'manager',
      subTeamId: rest.slice(0, lastColon),
      slot: rest.endsWith(':second') ? 'second' : 'main',
    };
  }
  if (overId.startsWith('subteam-members:')) {
    const rest = overId.slice('subteam-members:'.length);
    const lastColon = rest.lastIndexOf(':');
    return {
      kind: 'members',
      subTeamId: rest.slice(0, lastColon),
      slot: rest.endsWith(':second') ? 'second' : 'main',
    };
  }
  return null;
}

export function parseMemberDragId(activeId: string): { personId: string; slot: SubTeamSlot } | null {
  if (!activeId.startsWith('member:')) return null;
  const rest = activeId.slice('member:'.length);
  const lastColon = rest.lastIndexOf(':');
  return {
    personId: rest.slice(0, lastColon),
    slot: rest.endsWith(':second') ? 'second' : 'main',
  };
}
