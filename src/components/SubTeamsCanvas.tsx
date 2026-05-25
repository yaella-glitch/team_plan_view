import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore, selectVisiblePeople } from '../store';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person, SubTeam } from '../types';

/**
 * Professional pods canvas — drag PMM photos into sub-team boxes.
 * Each sub-team has a manager slot + members area, plus an editable title.
 */

const UNASSIGNED_DROP_ID = 'subteam:unassigned';
const subteamMembersDropId = (id: string) => `subteam-members:${id}`;
const subteamManagerDropId = (id: string) => `subteam-manager:${id}`;
const memberDragId = (personId: string) => `member:${personId}`;

export function SubTeamsCanvas() {
  const people = useStore(selectVisiblePeople);
  const subTeams = useStore((s) => s.subTeams ?? []);
  const addSubTeam = useStore((s) => s.addSubTeam);

  const assignedIds = new Set(
    subTeams.flatMap((s) => [s.managerId, ...s.memberIds].filter((x): x is string => Boolean(x))),
  );
  const unassigned = people.filter((p) => !assignedIds.has(p.id));

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-2xl font-bold text-ink">Professional pods</h2>
        <button
          type="button"
          onClick={() => addSubTeam()}
          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-muted hover:border-accent/60 hover:text-ink"
          title="Add sub-team"
        >
          +
        </button>
      </div>

      <UnassignedPool people={unassigned} />

      {subTeams.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm italic text-muted">
          No sub-teams yet. Hit the + to create one.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {subTeams.map((st) => (
            <SubTeamBox key={st.id} subTeam={st} people={people} />
          ))}
        </div>
      )}
    </section>
  );
}

function UnassignedPool({ people }: { people: Person[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_DROP_ID });
  const isEmpty = people.length === 0;

  // When empty, show a tiny strip — collapses to a single line.
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
        {isEmpty && <span className="ml-2 normal-case text-muted/60 italic">— everyone assigned</span>}
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

function SubTeamBox({ subTeam, people }: { subTeam: SubTeam; people: Person[] }) {
  const updateSubTeamTitle = useStore((s) => s.updateSubTeamTitle);
  const removeSubTeam = useStore((s) => s.removeSubTeam);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.title);
  const [labelText, setLabelText] = useState<string>(getLabel(subTeam.id));
  const [editingLabel, setEditingLabel] = useState(false);

  useEffect(() => setDraft(subTeam.title), [subTeam.title]);

  const manager = subTeam.managerId
    ? people.find((p) => p.id === subTeam.managerId) ?? null
    : null;
  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));

  return (
    <article className="card-gradient">
      <div className="card-gradient-inner flex min-h-[280px] flex-col gap-4 p-5">
      {/* Header — title + editable label + delete */}
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {editingLabel ? (
            <input
              autoFocus
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onBlur={() => {
                saveLabel(subTeam.id, labelText.trim() || 'Shared goal');
                setEditingLabel(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                else if (e.key === 'Escape') {
                  setLabelText(getLabel(subTeam.id));
                  setEditingLabel(false);
                }
              }}
              className="block bg-transparent text-[11px] font-semibold uppercase tracking-wide text-muted outline-none border-b border-indigo-200"
            />
          ) : (
            <span
              className="cursor-text text-[11px] font-semibold uppercase tracking-wide text-muted"
              onDoubleClick={() => setEditingLabel(true)}
              title="Double-click to edit label"
            >
              {labelText}
            </span>
          )}
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
              className="block w-full bg-transparent text-lg font-semibold text-ink outline-none border-b border-indigo-300"
            />
          ) : (
            <h3
              className="cursor-text text-lg font-semibold text-ink"
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
            if (confirm(`Remove sub-team "${subTeam.title}"?`)) removeSubTeam(subTeam.id);
          }}
          className="rounded-full px-2 py-0.5 text-sm text-muted hover:bg-rose-50 hover:text-rose-600"
          title="Remove sub-team"
        >
          ×
        </button>
      </div>

      {/* Manager slot */}
      <ManagerSlot subTeamId={subTeam.id} manager={manager} />

      {/* Members area */}
      <MembersArea subTeamId={subTeam.id} members={members} />
      </div>
    </article>
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

// Per-subteam editable label storage (small, separate from main state to avoid migration friction).
const LABEL_STORAGE_KEY = 'team-plan-view-subteam-labels-v1';
function getLabel(subTeamId: string): string {
  try {
    const raw = localStorage.getItem(LABEL_STORAGE_KEY);
    if (!raw) return 'Shared goal';
    const map = JSON.parse(raw) as Record<string, string>;
    return map[subTeamId] ?? 'Shared goal';
  } catch {
    return 'Shared goal';
  }
}
function saveLabel(subTeamId: string, text: string) {
  try {
    const raw = localStorage.getItem(LABEL_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[subTeamId] = text;
    localStorage.setItem(LABEL_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

// Expose the drop IDs for App.tsx to decode
export { UNASSIGNED_DROP_ID, subteamMembersDropId, subteamManagerDropId, memberDragId };
