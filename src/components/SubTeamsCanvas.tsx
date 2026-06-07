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

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex min-h-[300px] flex-col gap-4 p-5">
        <PodHeader subTeam={subTeam} slot={slot} />
        <TeamArea subTeamId={subTeam.id} people={ordered} leadId={subTeam.managerId} slot={slot} />
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <TagRow subTeam={subTeam} slot={slot} />
          <SharedGoal subTeam={subTeam} slot={slot} />
          <DetailsPanel subTeam={subTeam} slot={slot} />
        </div>
      </div>
    </article>
  );
}

function CrossCutBar({ subTeam, people, slot }: { subTeam: SubTeam; people: Person[]; slot: SubTeamSlot }) {
  const manager = subTeam.managerId ? people.find((p) => p.id === subTeam.managerId) ?? null : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));
  const ordered: Person[] = manager ? [manager, ...members] : members;

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2">
          <PodHeader subTeam={subTeam} inline slot={slot} />
        </div>
        <TeamArea subTeamId={subTeam.id} people={ordered} leadId={subTeam.managerId} slot={slot} dense />
        <div className="flex items-center gap-2">
          <TagRow subTeam={subTeam} dense slot={slot} />
        </div>
        <div className="min-w-[180px] flex-1">
          <SharedGoal subTeam={subTeam} dense slot={slot} />
        </div>
        <div className="w-full">
          <DetailsPanel subTeam={subTeam} slot={slot} dense />
        </div>
      </div>
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

function DetailsPanel({
  subTeam,
  slot,
  dense = false,
}: {
  subTeam: SubTeam;
  slot: SubTeamSlot;
  dense?: boolean;
}) {
  const admin = useAdminUnlocked();
  const setSubTeamDetails = useStore((s) => s.setSubTeamDetails);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.detailsText ?? '');
  useEffect(() => setDraft(subTeam.detailsText ?? ''), [subTeam.detailsText]);

  const hasText = Boolean((subTeam.detailsText ?? '').trim());
  // If viewer-only and no text → don't render the toggle at all.
  if (!admin && !hasText) return null;

  return (
    <div className={dense ? '' : 'pt-1'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>{open ? 'Hide details' : 'See more'}</span>
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          {editing ? (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setSubTeamDetails(subTeam.id, draft, slot);
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setDraft(subTeam.detailsText ?? '');
                  setEditing(false);
                }
              }}
              rows={6}
              placeholder="Describe the team focus, scope, working style, key deliverables…"
              className="block w-full resize-y bg-transparent text-xs text-ink placeholder:italic placeholder:text-muted outline-none"
            />
          ) : hasText ? (
            <div
              className={[
                'whitespace-pre-wrap text-xs leading-relaxed text-ink/90',
                admin ? 'cursor-text' : '',
              ].join(' ')}
              onDoubleClick={() => admin && setEditing(true)}
              title={admin ? 'Double-click to edit' : undefined}
            >
              {subTeam.detailsText}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs italic text-muted hover:text-ink"
            >
              + add free-text details
            </button>
          )}
        </div>
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
    <div className={['flex items-baseline gap-2', dense ? '' : ''].join(' ')}>
      <span className="shrink-0 text-[7px] font-semibold uppercase tracking-wide text-muted">Shared goal</span>
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
          className="flex-1 bg-transparent text-[7px] text-white outline-none border-b border-accent/40"
        />
      ) : (
        <span
          className="flex-1 cursor-text truncate text-[7px] text-white"
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

  const leadBg = isLead
    ? 'bg-amber-400/15 border-amber-300/50 ring-1 ring-amber-300/40'
    : 'border-white/10 bg-white/[0.06]';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className={[
        'group/chip relative inline-flex cursor-grab items-center gap-2 rounded-full border py-1 pl-1 pr-3 shadow-sm backdrop-blur hover:bg-white/10 active:cursor-grabbing',
        leadBg,
      ].join(' ')}
      {...listeners}
      {...attributes}
      title={isLead ? `${person.name} — Lead` : person.name}
    >
      <div
        className={[
          dim,
          'overflow-hidden rounded-full',
          isLead ? 'ring-2 ring-amber-300' : 'ring-1 ring-white/15',
        ].join(' ')}
      >
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
          className="ml-0.5 rounded-full bg-amber-400/25 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-100"
          title="Pod lead"
        >
          ★ Lead
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
          className={[
            'absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow transition-opacity',
            isLead
              ? 'border-amber-300/60 bg-amber-400 text-amber-900'
              : 'border-white/20 bg-canvas text-muted opacity-0 group-hover/chip:opacity-100 hover:text-amber-300',
          ].join(' ')}
          title={isLead ? 'Demote — no lead' : 'Make Lead'}
        >
          ★
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
