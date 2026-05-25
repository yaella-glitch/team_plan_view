import { useEffect, useMemo, useState } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { PersonCard } from './PersonCard';
import { resolvePhotoUrl } from '../lib/photo';
import type { Person } from '../types';

const personDragId = (id: string) => `person:${id}`;

export function CardsCanvas() {
  // Show ALL people here (including hidden ones) so this view doubles as the
  // place to flip visibility on/off without going into Admin.
  const allPeople = useStore((s) => s.people);
  const togglePersonEnabled = useStore((s) => s.togglePersonEnabled);
  const people = useMemo(
    () => [...allPeople].sort((a, b) => a.order - b.order),
    [allPeople],
  );
  const [selectedId, setSelectedId] = useState<string | null>(people[0]?.id ?? null);

  useEffect(() => {
    if (people.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !people.find((p) => p.id === selectedId)) {
      setSelectedId(people[0].id);
    }
  }, [people, selectedId]);

  const selected = people.find((p) => p.id === selectedId) ?? null;

  return (
    <section className="mx-auto max-w-7xl px-8 py-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">Full card: ownership by PMM</h2>
      </div>

      <div className="flex gap-5">
        {/* Left strip: photo carousel */}
        <aside className="w-[96px] shrink-0">
          <div className="sticky top-4 max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-sm backdrop-blur">
            <SortableContext
              items={people.map((p) => personDragId(p.id))}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-1.5">
                {people.map((p) => (
                  <PhotoTile
                    key={p.id}
                    person={p}
                    active={p.id === selectedId}
                    onSelect={() => setSelectedId(p.id)}
                    onToggle={() => togglePersonEnabled(p.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </div>
        </aside>

        {/* Right: expanded card */}
        <div className="min-w-0 flex-1">
          {selected ? (
            <PersonCard person={selected} />
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm italic text-muted">
              No team members yet. Add one from Admin.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PhotoTile({
  person,
  active,
  onSelect,
  onToggle,
}: {
  person: Person;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const photo = resolvePhotoUrl(person.photoUrl);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => setImgFailed(false), [person.photoUrl]);
  const enabled = person.enabled !== false;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: personDragId(person.id),
    data: { personId: person.id, kind: 'person-reorder' },
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : enabled ? 1 : 0.45,
      }}
      className="relative"
    >
      {/* Card body — drag handle + click-to-select. Using a div (not button) so
          the pointer events flow cleanly to dnd-kit's sensor. */}
      <div
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={[
          'group flex cursor-grab select-none flex-col items-center gap-1 rounded-lg p-1 transition-all active:cursor-grabbing',
          active ? 'bg-accent/15 ring-2 ring-accent/60' : 'hover:bg-white/5',
        ].join(' ')}
        title={`${person.name} — drag to reorder, click to view`}
        {...attributes}
        {...listeners}
      >
        <div
          className={[
            'aspect-square w-full overflow-hidden rounded-lg ring-2',
            active ? 'ring-accent/60' : 'ring-white/10 group-hover:ring-accent/30',
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
                'flex h-full w-full items-center justify-center text-base font-bold',
                imgFailed ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-muted',
              ].join(' ')}
            >
              {imgFailed ? '!' : initials(person.name)}
            </div>
          )}
        </div>
        <span
          className={[
            'w-full truncate text-center text-[10px] leading-tight',
            active ? 'font-semibold text-accent' : 'text-muted',
          ].join(' ')}
        >
          {person.name}
        </span>
      </div>

      {/* Visibility toggle — top-right, not part of the drag handle. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        title={enabled ? 'Hide from views (Ownership, Pods)' : 'Show in views'}
        className={[
          'absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow transition-all',
          enabled
            ? 'bg-black/60 text-white/70 opacity-0 hover:text-white group-hover:opacity-100'
            : 'bg-rose-500/80 text-white opacity-100',
        ].join(' ')}
      >
        {enabled ? eyeOn : eyeOff}
      </button>
    </li>
  );
}

const eyeOn = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const eyeOff = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a19.78 19.78 0 0 1 4.06-5.94" />
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a19.71 19.71 0 0 1-2.16 3.19" />
    <path d="M1 1l22 22" />
    <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
  </svg>
);

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
