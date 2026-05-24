import { useEffect, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person, SubTeam } from '../types';

/**
 * Sub-teams canvas — drag PMM photos into sub-team boxes.
 * Each sub-team has an editable shared-goal title.
 * Unassigned pool at the top.
 */

const UNASSIGNED_DROP_ID = 'subteam:unassigned';
const subteamDropId = (id: string) => `subteam:${id}`;
const memberDragId = (personId: string) => `member:${personId}`;

export function SubTeamsCanvas() {
  const people = useStore((s) => s.people);
  const subTeams = useStore((s) => s.subTeams ?? []);
  const addSubTeam = useStore((s) => s.addSubTeam);

  const assignedIds = new Set(subTeams.flatMap((s) => s.memberIds));
  const unassigned = people.filter((p) => !assignedIds.has(p.id));

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-ink">Sub-teams</h2>
          <p className="mt-1 text-sm text-muted">
            Drag photos into sub-teams. Each sub-team can carry a shared goal. Use this to brainstorm splits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => addSubTeam()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Add sub-team
        </button>
      </div>

      {/* Unassigned pool */}
      <UnassignedPool people={unassigned} />

      {/* Sub-team grid */}
      {subTeams.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-white p-12 text-center text-sm italic text-muted">
          No sub-teams yet. Click "+ Add sub-team" to create one.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-2xl border-2 border-dashed p-4 transition-colors',
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50/60',
      ].join(' ')}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Unassigned <span className="ml-1 normal-case text-slate-400">({people.length})</span>
      </p>
      {people.length === 0 ? (
        <p className="text-xs italic text-muted">All team members assigned to a sub-team.</p>
      ) : (
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
  const { setNodeRef, isOver } = useDroppable({ id: subteamDropId(subTeam.id) });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subTeam.title);

  useEffect(() => setDraft(subTeam.title), [subTeam.title]);

  const members = subTeam.memberIds
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => Boolean(p));

  return (
    <article
      ref={setNodeRef}
      className={[
        'flex min-h-[180px] flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm transition-all',
        isOver ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Shared goal</span>
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
              className="block w-full bg-transparent text-base font-semibold text-ink outline-none border-b border-indigo-300"
            />
          ) : (
            <h3
              className="cursor-text truncate text-base font-semibold text-ink"
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
          className="rounded-full px-2 py-0.5 text-xs text-muted hover:bg-rose-50 hover:text-rose-600"
          title="Remove sub-team"
        >
          ×
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {members.length === 0 ? (
          <p className="text-xs italic text-muted">Drop team photos here</p>
        ) : (
          members.map((p) => <PhotoChip key={p.id} person={p} />)
        )}
      </div>
    </article>
  );
}

function PhotoChip({ person }: { person: Person }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: memberDragId(person.id),
    data: { personId: person.id, kind: 'subteam-member' },
  });
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      className="inline-flex cursor-grab items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-3 shadow-sm hover:shadow-md active:cursor-grabbing"
      {...listeners}
      {...attributes}
      title={person.name}
    >
      <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-slate-200">
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
              'flex h-full w-full items-center justify-center text-[10px] font-semibold',
              imgFailed ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600',
            ].join(' ')}
          >
            {imgFailed ? '!' : initials(person.name)}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-ink">{person.name}</span>
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

// Expose the drop IDs for App.tsx to decode
export { UNASSIGNED_DROP_ID, subteamDropId, memberDragId };
