import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person, SubTeam } from '../types';

const UNASSIGNED_DROP_ID = 'subteam:unassigned';
const subteamMembersDropId = (id: string) => `subteam-members:${id}`;
const subteamManagerDropId = (id: string) => `subteam-manager:${id}`;
const memberDragId = (personId: string) => `member:${personId}`;

export function SubTeamsCanvas() {
  const people = useStore(selectVisiblePeople);
  const allPods = useStore((s) => s.subTeams ?? []);

  const crossCut = allPods.filter((p) => p.kind === 'crossCut');
  const normal = allPods.filter((p) => p.kind !== 'crossCut');

  const assignedIds = new Set(
    allPods.flatMap((s) => [s.managerId, ...s.memberIds].filter((x): x is string => Boolean(x))),
  );
  const unassigned = people.filter((p) => !assignedIds.has(p.id));

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <h2 className="mb-6 text-2xl font-bold text-ink">Professional pods</h2>

      <UnassignedPool people={unassigned} />

      {/* Normal pods: 4-col grid */}
      {normal.length === 0 && crossCut.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm italic text-muted">
          No pods yet. Hit + Pod to create one.
        </div>
      ) : normal.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {normal.map((st) => (
            <PodBox key={st.id} subTeam={st} people={people} />
          ))}
        </div>
      ) : null}

      {/* Cross pods: full-width thinner bars BELOW the normal grid */}
      {crossCut.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {crossCut.map((st) => (
            <CrossCutBar key={st.id} subTeam={st} people={people} />
          ))}
        </div>
      )}
    </section>
  );
}

function UnassignedPool({ people }: { people: Person[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_DROP_ID });
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
            <PhotoChip key={p.id} person={p} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Normal pod — 4-col grid card. */
function PodBox({ subTeam, people }: { subTeam: SubTeam; people: Person[] }) {
  const manager = subTeam.managerId ? people.find((p) => p.id === subTeam.managerId) ?? null : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex min-h-[360px] flex-col gap-4 p-5">
        <PodHeader subTeam={subTeam} />
        <ManagerSlot subTeamId={subTeam.id} manager={manager} />
        <MembersArea subTeamId={subTeam.id} members={members} />
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <TagRow subTeam={subTeam} />
          <SharedGoal subTeam={subTeam} />
        </div>
      </div>
    </article>
  );
}

/** Cross-cut pod — full-width thinner horizontal bar. */
function CrossCutBar({ subTeam, people }: { subTeam: SubTeam; people: Person[] }) {
  const manager = subTeam.managerId ? people.find((p) => p.id === subTeam.managerId) ?? null : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3">
        {/* Title (no badge) */}
        <div className="flex min-w-[200px] flex-1 items-center gap-2">
          <PodHeader subTeam={subTeam} inline />
        </div>

        {/* Lead slot inline */}
        <CrossCutSlot label="Lead" subTeamId={subTeam.id} kind="manager" person={manager} />

        {/* Members area inline (no MEMBERS label) */}
        <CrossCutSlot label="" subTeamId={subTeam.id} kind="members" people={members} />

        {/* Tags inline */}
        <div className="flex items-center gap-2">
          <TagRow subTeam={subTeam} dense />
        </div>

        {/* Goal inline */}
        <div className="min-w-[180px] flex-1">
          <SharedGoal subTeam={subTeam} dense />
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------

function PodHeader({ subTeam, inline = false }: { subTeam: SubTeam; inline?: boolean }) {
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
              if (draft.trim()) updateSubTeamTitle(subTeam.id, draft.trim());
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
      {!inline && (
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove pod "${subTeam.title}"?`)) removeSubTeam(subTeam.id);
          }}
          className="rounded-full px-2 py-0.5 text-sm text-muted hover:bg-rose-500/15 hover:text-rose-300"
          title="Remove pod"
        >
          ×
        </button>
      )}
      {inline && (
        <button
          type="button"
          onClick={() => {
            if (confirm(`Remove pod "${subTeam.title}"?`)) removeSubTeam(subTeam.id);
          }}
          className="rounded-full px-1.5 text-xs text-muted hover:text-rose-300"
          title="Remove pod"
        >
          ×
        </button>
      )}
    </div>
  );
}

function ManagerSlot({ subTeamId, manager }: { subTeamId: string; manager: Person | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: subteamManagerDropId(subTeamId) });
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Lead</p>
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-[64px] items-center gap-2 rounded-2xl border-2 border-dashed px-3 py-2 transition-colors',
          isOver ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.03]',
        ].join(' ')}
      >
        {manager ? (
          <PhotoChip person={manager} size="lg" />
        ) : (
          <p className="text-xs italic text-muted">Drop one person here as Lead</p>
        )}
      </div>
    </div>
  );
}

function MembersArea({ subTeamId, members }: { subTeamId: string; members: Person[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: subteamMembersDropId(subTeamId) });
  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-[80px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed px-3 py-2.5 transition-colors',
        isOver ? 'border-accent/60 bg-accent/10' : 'border-white/10 bg-white/[0.03]',
      ].join(' ')}
    >
      {members.length === 0 ? (
        <p className="text-xs italic text-muted">Drop team photos here</p>
      ) : (
        members.map((p) => <PhotoChip key={p.id} person={p} />)
      )}
    </div>
  );
}

/** Compact slot used in the cross-cut horizontal layout. */
function CrossCutSlot(
  props:
    | { label: string; subTeamId: string; kind: 'manager'; person: Person | null }
    | { label: string; subTeamId: string; kind: 'members'; people: Person[] },
) {
  const dropId =
    props.kind === 'manager' ? subteamManagerDropId(props.subTeamId) : subteamMembersDropId(props.subTeamId);
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const membersEmpty = props.kind === 'members' && props.people.length === 0;

  return (
    <div className="flex items-center gap-2">
      {props.label && !membersEmpty && (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{props.label}</span>
      )}
      <div
        ref={setNodeRef}
        className={[
          'flex items-center gap-1.5 rounded-xl border border-dashed px-2 py-1',
          // Empty members slot: collapse to a tiny dotted hint that still accepts drops
          membersEmpty ? 'min-h-[28px] min-w-[24px] border-white/5' : 'min-h-[36px]',
          isOver ? 'border-accent/60 bg-accent/10' : !membersEmpty ? 'border-white/10' : '',
        ].join(' ')}
      >
        {props.kind === 'manager' ? (
          props.person ? (
            <PhotoChip person={props.person} />
          ) : (
            <span className="text-[10px] italic text-muted px-1">Drop lead</span>
          )
        ) : (
          props.people.map((p) => <PhotoChip key={p.id} person={p} />)
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TagRow({ subTeam, dense = false }: { subTeam: SubTeam; dense?: boolean }) {
  const addSubTeamTag = useStore((s) => s.addSubTeamTag);
  const removeSubTeamTag = useStore((s) => s.removeSubTeamTag);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const tags = subTeam.tags ?? [];

  const commit = () => {
    const v = draft.trim();
    if (v) addSubTeamTag(subTeam.id, v);
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
            onClick={() => removeSubTeamTag(subTeam.id, i)}
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
          title="Add tag (deliverable / focus / output)"
        >
          + tag
        </button>
      )}
    </div>
  );
}

function SharedGoal({ subTeam, dense = false }: { subTeam: SubTeam; dense?: boolean }) {
  const setSubTeamGoalText = useStore((s) => s.setSubTeamGoalText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.goalText ?? '');
  useEffect(() => setDraft(subTeam.goalText ?? ''), [subTeam.goalText]);

  return (
    <div className={['flex items-baseline gap-2', dense ? '' : ''].join(' ')}>
      <span className="shrink-0 text-[7px] font-semibold uppercase tracking-wide text-muted">
        Shared goal
      </span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setSubTeamGoalText(subTeam.id, draft.trim());
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

// ---------------------------------------------------------------------------

function PhotoChip({ person, size = 'md' }: { person: Person; size?: 'md' | 'lg' }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: memberDragId(person.id),
    data: { personId: person.id, kind: 'subteam-member' },
  });
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  const dim = size === 'lg' ? 'h-10 w-10 text-xs' : 'h-8 w-8 text-[10px]';
  const textCls = size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="inline-flex cursor-grab items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1 pl-1 pr-3 shadow-sm backdrop-blur hover:bg-white/10 active:cursor-grabbing"
      {...listeners}
      {...attributes}
      title={person.name}
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

// Expose drop IDs for App.tsx to decode
export { UNASSIGNED_DROP_ID, subteamMembersDropId, subteamManagerDropId, memberDragId };
